import { initializePhysics } from '#gameEngine/Physics.js';
import { renderLoop } from '#gameEngine/Render.js';
import { Ball } from '#entities/Ball.js';
import { Arena } from '#entities/Arena.js';
import { createArena, createCamera, createLight } from '#gameEngine/Create.js';
import { NullEngine, Scene, Camera, Light } from '@babylonjs/core';
import XMLHttpRequest from 'xmlhttprequest-ssl';
global.XMLHttpRequest = XMLHttpRequest;

export class GameEngine {
  private _scene!: Scene;
  private _defaultScene!: Scene;
  private _engine!: NullEngine;
  //
  private _arena!: Arena;
  // private _player!: Player;
  private _balls!: Map<string, Ball>;
  //
  //@ts-ignore
  private _camera!: Camera;
  //@ts-ignore
  private _light!: Light;

  constructor() {}

  async initGame() {
    this.engine = new NullEngine();
    const scene = new Scene(this.engine);

    await initializePhysics(scene);
    this.scene = await this.initScene(scene);

    renderLoop(this.engine, this.scene);
  }

  /* v8 ignore start */
  async initScene(scene: Scene) {
    this.camera = createCamera(scene, 40);
    this.light = createLight(scene);
    this.arena = createArena();
    await this.arena.initMesh(scene);

    const observable_1 =
      this.arena.goal_1.aggregate.body.getCollisionObservable();
    observable_1.add(_collisionEvent => {
      console.log('goal_1');
    });

    const observable_2 =
      this.arena.goal_2.aggregate.body.getCollisionObservable();
    observable_2.add(_collisionEvent => {
      console.log('goal_2');
    });

    // NOTE: next lines probably not needed in server
    // scene.onBeforeRenderObservable.add(this.draw(this));
    // for hit indicator
    // scene.getBoundingBoxRenderer().frontColor.set(1, 0, 0);
    // scene.getBoundingBoxRenderer().backColor.set(0, 1, 0);
    return scene;
  }

  /* v8 ignore start */
  set defaultScene(defaultScene: Scene) {
    this._defaultScene = defaultScene;
  }
  set scene(scene: Scene) {
    this._scene = scene;
  }
  set engine(engine: NullEngine) {
    this._engine = engine;
  }
  set arena(arena: Arena) {
    this._arena = arena;
  }
  // set player(player: Player) {
  //   this._player = player;
  // }
  set balls(balls: Map<string, Ball>) {
    this._balls = balls;
  }
  set camera(camera: Camera) {
    this._camera = camera;
  }
  set light(light: Light) {
    this._light = light;
  }

  get defaultScene() {
    return this._defaultScene;
  }
  get scene(): Scene {
    return this._scene;
  }
  get engine(): NullEngine {
    return this._engine;
  }
  get arena(): Arena {
    return this._arena;
  }
  // get player(): Player {
  //   return this._player;
  // }
  get balls(): Map<string, Ball> {
    return this._balls;
  }
  get camera(): Camera {
    return this._camera;
  }
  get light(): Light {
    return this._light;
  }
  /* v8 ignore stop */
}
