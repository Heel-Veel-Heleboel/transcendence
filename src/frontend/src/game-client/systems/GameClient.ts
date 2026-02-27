import {
  AbstractEngine,
  Scene,
  GizmoManager,
  Camera,
  Light,
  Sound,
  ArcRotateCamera
} from '@babylonjs/core';
import {
  debugLayerListener,
  engineResizeListener
} from '../utils/EventListeners.ts';
import { prepareImportGLTF } from '../utils/Loaders';
import {
  createBgMusic,
  createHack,
  createCamera,
  createLight,
  createVector3
} from '../utils/Create';
import '@babylonjs/loaders/glTF';
import { Hack } from '../components/Hack';
import { KeyManager } from './KeyManager';
import { Hud } from '../components/Hud';
import { Arena } from '../components/Arena';
import { Callbacks, Room } from '@colyseus/sdk';
import { Protagonist } from '../components/Protagonist';
import { Antagonist } from '../components/Antagonist';
import gameConfig from '../utils/GameConfig.ts';

/* v8 ignore start */
export class GameClient {
  private _scene!: Scene;
  private _defaultScene!: Scene;
  private _engine!: AbstractEngine;

  private _frameCount!: number;
  private _arena!: Arena;
  private _protagonist!: Protagonist;
  private _antagonist!: Antagonist;
  private _hud!: Hud;
  private _keyManager!: KeyManager;
  private _balls!: Map<string, Hack>;
  private _room!: Room;

  //@ts-ignore
  private _camera!: Camera;
  //@ts-ignore
  private _light!: Light;
  //@ts-ignore
  private _backgroundMusic!: Sound;

  constructor(defaultScene: Scene) {
    this.defaultScene = defaultScene;
    this.engine = defaultScene.getEngine();
  }

  async initGame() {
    this.frameCount = 0;
    prepareImportGLTF(this.defaultScene);
    this.scene = await this.initScene(this.defaultScene);

    debugLayerListener(this.scene);
    engineResizeListener(this.engine);
  }

  private async initScene(scene: Scene) {
    this.hud = new Hud('hud.json', scene);
    await this.hud.init();

    if (process.env.NODE_ENV !== 'production') {
      new GizmoManager(scene);
    }
    this.backgroundMusic = createBgMusic(scene);
    this.camera = createCamera(scene, 40);
    this.light = createLight(scene);
    this.arena = new Arena();
    await this.arena.initMesh(scene);

    this.balls = new Map<string, Hack>();

    scene.onBeforeRenderObservable.add(this.draw(this));
    return scene;
  }

  private draw(g: GameClient) {
    return () => {
      if (typeof g.prota === 'undefined') return;
      if (!(g.frameCount % 600)) {
        // console.log(g.balls);
      }
      for (const entity of g.balls) {
        const ball = entity[1];
        if (ball) {
          g.prota.hitIndicator.detectIncomingHits(ball);
        }
        ball.update();
      }
      if (
        g.keyManager.deltaTime !== 0 &&
        g.frameCount - g.keyManager.deltaTime > g.keyManager.windowFrames
      ) {
        g.keyManager.resolve();
      }
      g.prota.hud.changeMana(0.01);
      g.frameCount++;
    };
  }

  initRoom(room: Room) {
    this.room = room;
    this.initCallbacks(this.room, this);
  }

  private initCallbacks(room: Room, g: GameClient) {
    const callbacks = Callbacks.get(room);
    this.initHacksStateCallbacks(callbacks, g);
    this.initPlayersStateCallbacks(callbacks, g);
  }

  initHacksStateCallbacks(callbacks: any, g: GameClient) {
    callbacks.onAdd(
      gameConfig.hacksState,
      (entity: any, _sessionId: unknown) => {
        const hack = createHack(
          this.scene,
          createVector3(entity.x, entity.y, entity.z),
          gameConfig.hackSize
        );
        g.balls.set(entity.id, hack);
        callbacks.onChange(entity, () => {
          const hack = g.balls.get(entity.id);
          if (hack) {
            const pos = createVector3(entity.x, entity.y, entity.z);
            const lv = createVector3(
              entity.linearVelocityX,
              entity.linearVelocityY,
              entity.linearVelocityZ
            );
            hack.mesh.setAbsolutePosition(pos);
            hack.linearVelocity = lv;
            lv.normalize();
          }
        });
      }
    );
    callbacks.onRemove(
      gameConfig.hacksState,
      (entity: any, _sessionId: unknown) => {
        const hack = g.balls.get(entity.id);
        if (hack) {
          hack.dispose();
        }
      }
    );
  }

  initPlayersStateCallbacks(callbacks: any, g: GameClient) {
    callbacks.onAdd(
      gameConfig.playersState,
      (entity: any, sessionId: unknown) => {
        if (sessionId === g.room.sessionId) {
          const config = {
            keys: {
              columns: entity.columns,
              rows: entity.rows,
              length: entity.keyLength,
              precisionKeys: entity.precisionKeys
            },
            goalPosition: createVector3(entity.posX, entity.posY, entity.posZ),
            goalDimensions: createVector3(
              entity.dimX,
              entity.dimY,
              entity.dimZ
            ),
            hud: g.hud,
            room: g.room
          };

          const player = new Protagonist(config, g.scene);
          g.prota = player;
          g.prota.initGridHints(g.scene);
          if (g.prota.keyGrid.rotation) {
            const pos = g.camera.position;
            const camera = g.camera as ArcRotateCamera;
            camera.setPosition(createVector3(pos.x, pos.y, pos.z * -1));
          }

          const keyManager = new KeyManager(
            g.scene,
            () => g.frameCount,
            g.prota
          );
          g.keyManager = keyManager;
        } else {
          const config = {
            goalPosition: createVector3(entity.posX, entity.posY, entity.posZ),
            goalDimensions: createVector3(
              entity.dimX,
              entity.dimY,
              entity.dimZ
            ),
            keys: {
              length: entity.keyLength
            }
          };
          const player = new Antagonist(config, g.scene);
          g.anta = player;
        }
        callbacks.onChange(entity, () => {
          const player = sessionId === g.room.sessionId ? g.prota : g.anta;
          player.mesh.position.x = entity.posX;
          player.mesh.position.y = entity.posY;
          player.mesh.position.z = entity.posZ;
          player.lifespan = entity.lifespan;
          player.mana = entity.mana;
        });
      }
    );
    callbacks.onRemove(
      gameConfig.playersState,
      (_entity: any, sessionId: unknown) => {
        const player = sessionId === g.room.sessionId ? g.prota : g.anta;
        player.dispose();
      }
    );
  }

  private set defaultScene(defaultScene: Scene) {
    this._defaultScene = defaultScene;
  }
  private set scene(scene: Scene) {
    this._scene = scene;
  }
  private set engine(engine: AbstractEngine) {
    this._engine = engine;
  }
  private set frameCount(frameCount: number) {
    this._frameCount = frameCount;
  }
  private set arena(arena: Arena) {
    this._arena = arena;
  }
  private set prota(prota: Protagonist) {
    this._protagonist = prota;
  }
  private set anta(anta: Antagonist) {
    this._antagonist = anta;
  }
  private set hud(hud: Hud) {
    this._hud = hud;
  }
  private set keyManager(keyManager: KeyManager) {
    this._keyManager = keyManager;
  }
  private set balls(balls: Map<string, Hack>) {
    this._balls = balls;
  }
  private set room(room: Room) {
    this._room = room;
  }
  private set camera(camera: Camera) {
    this._camera = camera;
  }
  private set light(light: Light) {
    this._light = light;
  }
  private set backgroundMusic(backgroundMusic: Sound) {
    this._backgroundMusic = backgroundMusic;
  }

  private get defaultScene() {
    return this._defaultScene;
  }
  private get scene(): Scene {
    return this._scene;
  }
  // NOTE: set to public to dispose scene on error
  public get engine(): AbstractEngine {
    return this._engine;
  }
  private get frameCount(): number {
    return this._frameCount;
  }
  private get arena(): Arena {
    return this._arena;
  }
  private get prota(): Protagonist {
    return this._protagonist;
  }
  private get anta(): Antagonist {
    return this._antagonist;
  }
  private get hud(): Hud {
    return this._hud;
  }
  private get keyManager(): KeyManager {
    return this._keyManager;
  }
  private get balls(): Map<string, Hack> {
    return this._balls;
  }
  private get room(): Room {
    return this._room;
  }
  private get camera(): Camera {
    return this._camera;
  }
  private get light(): Light {
    return this._light;
  }
  private get backgroundMusic(): Sound {
    return this._backgroundMusic;
  }
}

/* v8 ignore stop */
