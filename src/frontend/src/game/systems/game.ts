import {
  AbstractEngine,
  Scene,
  GizmoManager,
  TransformNode,
  Vector3,
  Camera,
  Light,
  Sound,
  HavokPlugin
} from '@babylonjs/core';
import HavokPhysics from '@babylonjs/havok';
import {
  createEngine,
  createBgMusic,
  createBall,
  createArena,
  createCamera,
  createLight,
  getCanvas,
  engineResize
} from '../utils/utils.ts';
import '@babylonjs/loaders/glTF';
import { Ball } from '../components/ball.ts';
import { Player } from '../components/player.ts';
import { KeyManager } from './keyManager.ts';
import { Hud } from '../components/hud.ts';
import { Inspector } from '@babylonjs/inspector';
import { Arena } from '../components/arena.ts';

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

  async initGame() {
    this.canvas = getCanvas();
    this.engine = createEngine(this.canvas);
    const defaultScene = new Scene(this.engine);
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    defaultScene.enablePhysics(new Vector3(0, 0, 0), havokPlugin);
    this.physicalizeGLTFMeshes(defaultScene);
    this.scene = await this.initScene(defaultScene);
    this.frameCount = 0;

    window.addEventListener('resize', engineResize(this.engine));
    Inspector.Show(this.scene, {});
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    this.setFirstResolution();
  }

  setFirstResolution() {
    // initial resolution is blurry, no clue why, hacky fix in order to make resolutio sharp
    setTimeout(() => {
      this.engine.resize();
    }, 10);
  }

  physicalizeGLTFMeshes(scene: Scene) {
    // An extra step is needed in order to be able to physicalize meshes coming from gltf. Insert an extra node transform just before the __root__ so conversion between Righ or Left handedness are transparent for the physics engine.
    const trParent = new TransformNode('tr', scene);
    const root = scene.getMeshByName('__root__');
    if (root) {
      root.scaling.scaleInPlace(100);
      root.position.y = 4;
      root.setParent(trParent);
    }
  }

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
      balls.filter(ball => {
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
