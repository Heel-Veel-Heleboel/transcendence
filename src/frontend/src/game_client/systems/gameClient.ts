import {
  AbstractEngine,
  Scene,
  GizmoManager,
  Vector3,
  Camera,
  Light,
  Sound,
  ArcRotateCamera
} from '@babylonjs/core';
import {
  debugLayerListener,
  engineResizeListener
} from '../utils/eventListeners.ts';
import { initializeResolution, prepareImportGLTF } from '../utils/canvas.ts';
import {
  createBgMusic,
  createHack,
  createArena,
  createCamera,
  createLight
} from '../utils/create.ts';
import '@babylonjs/loaders/glTF';
import { Hack } from '../components/ball.ts';
import { KeyManager } from './keyManager.ts';
import { Hud } from '../components/hud.ts';
import { Arena } from '../components/arena.ts';
import { renderLoop } from '../utils/render.ts';
import { Client, Callbacks, Room } from '@colyseus/sdk';
import { Protagonist } from '../components/protagonist.ts';
import { Antagonist } from '../components/antagonist.ts';

export class GameClient {
  private _scene!: Scene;
  private _defaultScene!: Scene;
  private _canvas!: HTMLCanvasElement;
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
    // await initializePhysics(this.defaultScene);
    prepareImportGLTF(this.defaultScene);
    this.scene = await this.initScene(this.defaultScene);
    this.frameCount = 0;

    debugLayerListener(this.scene);
    engineResizeListener(this.engine);
    // renderLoop(this.engine, this.scene);
    initializeResolution(this.engine);
  }

  /* v8 ignore start */
  async initScene(scene: Scene) {
    this.hud = new Hud('hud.json', scene);
    await this.hud.init();

    if (process.env.NODE_ENV !== 'production') {
      new GizmoManager(scene);
    }
    this.backgroundMusic = createBgMusic(scene);

    this.camera = createCamera(scene, 40);
    this.light = createLight(scene);
    this.arena = createArena();
    await this.arena.initMesh(scene);

    this.balls = new Map<string, Hack>();

    const client = new Client('ws://localhost:2567');
    const room = await client
      .joinOrCreate('game_room')
      .then(function (room) {
        console.log('Connected to roomId: ' + room.roomId);
        return room;
      })
      .catch(function (error) {
        console.log('Could not connect: got following error');
        console.error(error);
      });

    if (room instanceof Room) {
      this.room = room;
      this.initCallbacks(this.room, this);
    } else {
      // throw error
    }
    scene.onBeforeRenderObservable.add(this.draw(this));
    // for hit indicator
    scene.getBoundingBoxRenderer().frontColor.set(1, 0, 0);
    scene.getBoundingBoxRenderer().backColor.set(0, 1, 0);
    return scene;
  }

  draw(g: GameClient) {
    return () => {
      if (g.prota === undefined) return;
      if (!(g.frameCount % 600)) {
        // console.log(g.balls);
      }
      for (const entity of g.balls) {
        const ball = entity[1];
        if (ball) {
          g.prota.hitIndicator.detectIncomingHits(ball);
        }
        // ball.update();
      }
      // g.room.send('set-position');
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

  initCallbacks(room: Room, g: GameClient) {
    const callbacks = Callbacks.get(room);
    callbacks.onAdd('balls', (entity: any, sessionId: unknown) => {
      const ball = addHack(this.scene, {
        x: entity.x,
        y: entity.y,
        z: entity.z
      });
      g.balls.set(entity.id, ball);
      callbacks.onChange(entity, () => {
        const ball = g.balls.get(entity.id);
        if (ball) {
          const pos = new Vector3(entity.x, entity.y, entity.z);
          const lv = new Vector3(
            entity.linearVelocityX,
            entity.linearVelocityY,
            entity.linearVelocityZ
          );
          ball.mesh.setAbsolutePosition(pos);
          ball.linearVelocity = lv;
          lv.normalize();
        }
      });
    });
    callbacks.onRemove('balls', (entity: any, sessionId) => {
      console.log(entity, 'ball has been removed at', sessionId);
      const ball = g.balls.get(entity.id);
      if (ball) {
        ball.dispose();
      }
    });
    callbacks.onAdd('players', (entity: any, sessionId: unknown) => {
      if (sessionId === room.sessionId) {
        console.log(entity);
        const config = {
          keys: {
            columns: entity.columns,
            rows: entity.rows,
            length: entity.keyLength,
            precisionKeys: entity.precisionKeys
          },
          goalPosition: new Vector3(entity.posX, entity.posY, entity.posZ),
          goalDimensions: new Vector3(entity.dimX, entity.dimY, entity.dimZ),
          hud: g.hud,
          room: room
        };

        const player = new Protagonist(config, g.scene);
        g.prota = player;
        g.prota.initGridHints(g.scene);
        if (g.prota.keyGrid.rotation) {
          const pos = g.camera.position;
          const camera = g.camera as ArcRotateCamera;
          camera.setPosition(new Vector3(pos.x, pos.y, pos.z * -1));
        }

        const keyManager = new KeyManager(g.scene, () => g.frameCount, g.prota);
        g.keyManager = keyManager;
      } else {
        if (g.anta !== undefined) {
          // throw error
          return;
        }
        const config = {
          goalPosition: new Vector3(entity.posX, entity.posY, entity.posZ),
          goalDimensions: new Vector3(entity.dimX, entity.dimY, entity.dimZ),
          keys: {
            length: entity.keyLength
          }
        };
        const player = new Antagonist(config, g.scene);
        g.anta = player;
      }
      callbacks.onChange(entity, () => {
        const player = sessionId === room.sessionId ? g.prota : g.anta;
        player.mesh.position.x = entity.posX;
        player.mesh.position.y = entity.posY;
        player.mesh.position.z = entity.posZ;
        player.lifespan = entity.lifespan;
        player.mana = entity.mana;
      });
    });
    callbacks.onRemove('players', (entity: any, sessionId) => {
      console.log(entity, 'player has been removed at', sessionId);
      const player = sessionId === room.sessionId ? g.prota : g.anta;

      player.dispose();
    });
  }

  /* v8 ignore start */
  set defaultScene(defaultScene: Scene) {
    this._defaultScene = defaultScene;
  }
  set scene(scene: Scene) {
    this._scene = scene;
  }
  set canvas(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
  }
  set engine(engine: AbstractEngine) {
    this._engine = engine;
  }
  set frameCount(frameCount: number) {
    this._frameCount = frameCount;
  }
  set arena(arena: Arena) {
    this._arena = arena;
  }
  set prota(prota: Protagonist) {
    this._protagonist = prota;
  }
  set anta(anta: Antagonist) {
    this._antagonist = anta;
  }
  set hud(hud: Hud) {
    this._hud = hud;
  }
  set keyManager(keyManager: KeyManager) {
    this._keyManager = keyManager;
  }
  set balls(balls: Map<string, Hack>) {
    this._balls = balls;
  }
  set room(room: Room) {
    this._room = room;
  }
  set camera(camera: Camera) {
    this._camera = camera;
  }
  set light(light: Light) {
    this._light = light;
  }
  set backgroundMusic(backgroundMusic: Sound) {
    this._backgroundMusic = backgroundMusic;
  }

  get defaultScene() {
    return this._defaultScene;
  }
  get scene(): Scene {
    return this._scene;
  }
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  get engine(): AbstractEngine {
    return this._engine;
  }
  get frameCount(): number {
    return this._frameCount;
  }
  get arena(): Arena {
    return this._arena;
  }
  get prota(): Protagonist {
    return this._protagonist;
  }
  get anta(): Antagonist {
    return this._antagonist;
  }
  get hud(): Hud {
    return this._hud;
  }
  get keyManager(): KeyManager {
    return this._keyManager;
  }
  get balls(): Map<string, Hack> {
    return this._balls;
  }
  get room(): Room {
    return this._room;
  }
  get camera(): Camera {
    return this._camera;
  }
  get light(): Light {
    return this._light;
  }
  get backgroundMusic(): Sound {
    return this._backgroundMusic;
  }
  /* v8 ignore stop */
}

export function addHack(
  scene: Scene,
  pos: { x: number; y: number; z: number }
) {
  const temp = createHack(scene, new Vector3(pos.x, pos.y, pos.z), 1);
  return temp;
}
/* v8 ignore stop */
