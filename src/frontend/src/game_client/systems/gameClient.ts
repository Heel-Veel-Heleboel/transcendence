import {
  AbstractEngine,
  Scene,
  GizmoManager,
  Vector3,
  Camera,
  Light,
  Sound
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
import { Player } from '../components/player.ts';
import { KeyManager } from './keyManager.ts';
import { Hud } from '../components/hud.ts';
import { Arena } from '../components/arena.ts';
import { renderLoop } from '../utils/render.ts';
import { Client, Callbacks, Room } from '@colyseus/sdk';
import { Protagonist } from '../components/protagonist.ts';

export class GameClient {
  private _scene!: Scene;
  private _defaultScene!: Scene;
  private _canvas!: HTMLCanvasElement;
  private _engine!: AbstractEngine;

  private _frameCount!: number;
  private _arena!: Arena;
  private _player!: Player;
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
  set player(player: Player) {
    this._player = player;
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
  get player(): Player {
    return this._player;
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

  async initGame() {
    // await initializePhysics(this.defaultScene);
    prepareImportGLTF(this.defaultScene);
    this.scene = await this.initScene(this.defaultScene);
    this.frameCount = 0;

    engineResizeListener(this.engine);
    debugLayerListener(this.scene);
    renderLoop(this.engine, this.scene);
    initializeResolution(this.engine);
  }

  /* v8 ignore start */
  async initScene(scene: Scene) {
    this.hud = new Hud('hud.json', scene);
    this.hud.init();

    if (process.env.NODE_ENV !== 'production') {
      new GizmoManager(scene);
    }
    this.backgroundMusic = createBgMusic(scene);

    this.camera = createCamera(scene, 40);
    this.light = createLight(scene);
    this.arena = createArena();
    await this.arena.initMesh(scene);
    console.log(this.arena);

    const config = {
      keys: {
        columns: 'qwaszx',
        rows: 'erdfcv',
        length: 6,
        precisionKeys: 'WASD'
      },
      goalPosition: this.arena.goal_1.mesh.absolutePosition,
      goalDimensions: this.arena.goal_1.mesh
        .getBoundingInfo()
        .boundingBox.extendSizeWorld.scale(2),
      hud: this.hud
    };
    console.log(config);

    const player = new Protagonist(config, scene);
    this.player = player;
    player.initGridColumnsHints(scene);
    player.initGridRowsHints(scene);

    const keyManager = new KeyManager(scene, () => this.frameCount, player);
    this.keyManager = keyManager;

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
      const callbacks = Callbacks.get(room);
      callbacks.onAdd('balls', (entity: any, sessionId: unknown) => {
        const ball = addHack(scene, { x: entity.x, y: entity.y, z: entity.z });
        this.balls.set(entity.id, ball);
        callbacks.onChange(entity, () => {
          const ball = this.balls.get(entity.id);
          if (ball) {
            const pos = new Vector3(entity.x, entity.y, entity.z);
            const lv = new Vector3(
              entity.linearVelocityX,
              entity.linearVelocityY,
              entity.linearVelocityZ
            );
            ball.mesh.setAbsolutePosition(pos);
            ball.linearVelocity = lv;
          }
        });
      });
      callbacks.onRemove('balls', (entity: any, sessionId) => {
        console.log(entity, 'has been removed at', sessionId);
        const ball = this.balls.get(entity.id);
        if (ball) {
          ball.dispose();
        }
      });
    }
    scene.onBeforeRenderObservable.add(this.draw(this));
    // for hit indicator
    scene.getBoundingBoxRenderer().frontColor.set(1, 0, 0);
    scene.getBoundingBoxRenderer().backColor.set(0, 1, 0);
    return scene;
  }

  draw(g: GameClient) {
    return () => {
      if (!(g.frameCount % 600)) {
        // console.log(g.balls);
      }
      for (const entity of g.balls) {
        const ball = entity[1];
        if (ball) {
          g.player.hitIndicator.detectIncomingHits(ball);
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
      g.player.hud.changeMana(0.01);
      g.frameCount++;
    };
  }
}

export function addHack(
  scene: Scene,
  pos: { x: number; y: number; z: number }
) {
  const temp = createHack(scene, new Vector3(pos.x, pos.y, pos.z), 1);
  return temp;
}
/* v8 ignore stop */
