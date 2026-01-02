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
import {
  getCanvas,
  initializeResolution,
  prepareImportGLTF
} from '../utils/canvas.ts';
import {
  createEngine,
  createBgMusic,
  createBall,
  createArena,
  createCamera,
  createLight
} from '../utils/create.ts';
import '@babylonjs/loaders/glTF';
import { Ball } from '../components/ball.ts';
import { Player } from '../components/player.ts';
import { KeyManager } from './keyManager.ts';
import { Hud } from '../components/hud.ts';
import { Arena } from '../components/arena.ts';
import { initializePhysics } from '../utils/physics.ts';
import { renderLoop } from '../utils/render.ts';

export class Game {
  private _scene!: Scene;
  private _canvas!: HTMLCanvasElement;
  private _engine!: AbstractEngine;

  private _frameCount!: number;
  private _arena!: Arena;
  private _player!: Player;
  private _hud!: Hud;
  private _keyManager!: KeyManager;

  //@ts-ignore
  private _camera!: Camera;
  //@ts-ignore
  private _light!: Light;
  //@ts-ignore
  private _backgroundMusic!: Sound;

  constructor() {}

  /* v8 ignore start */
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
  set camera(camera: Camera) {
    this._camera = camera;
  }
  set light(light: Light) {
    this._light = light;
  }
  set backgroundMusic(backgroundMusic: Sound) {
    this._backgroundMusic = backgroundMusic;
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
    this.canvas = getCanvas();
    this.engine = createEngine(this.canvas);
    const defaultScene = new Scene(this.engine);
    await initializePhysics(defaultScene);
    prepareImportGLTF(defaultScene);
    this.scene = await this.initScene(defaultScene);
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

    const player = new Player(config, scene);
    this.player = player;
    player.initGridColumnsHints(scene);
    player.initGridRowsHints(scene);

    const observable_1 =
      this.arena.goal_1.aggregate.body.getCollisionObservable();
    observable_1.add(_collisionEvent => {
      console.log('goal_1');
      this.hud.changeHealth(-10);
    });

    const observable_2 =
      this.arena.goal_2.aggregate.body.getCollisionObservable();
    observable_2.add(_collisionEvent => {
      console.log('goal_2');
    });
    const keyManager = new KeyManager(scene, () => this.frameCount, player);
    this.keyManager = keyManager;

    const balls = [];
    const ball = addBall(scene);
    balls.push(ball);
    scene.onBeforeRenderObservable.add(this.draw(this, balls));
    // for hit indicator
    scene.getBoundingBoxRenderer().frontColor.set(1, 0, 0);
    scene.getBoundingBoxRenderer().backColor.set(0, 1, 0);
    return scene;
  }

  draw(g: Game, balls: Ball[]) {
    return () => {
      if (!(g.frameCount % 600)) {
        const ball = addBall(g.scene);
        balls.push(ball);
      }
      for (const ball of balls) {
        g.player.hitIndicator.detectIncomingHits(ball);
        ball.update();
      }
      balls = balls.filter(ball => {
        !ball.isDead();
      });
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

export function addBall(scene: Scene) {
  const temp = createBall(scene, new Vector3(0, 0, 0), 1);
  temp.physicsMesh.aggregate.body.applyForce(
    new Vector3(Math.random() * 100, Math.random() * 100, Math.random() * 100),
    temp.physicsMesh.mesh.absolutePosition
  );
  return temp;
}
/* v8 ignore stop */
