import { initializePhysics } from '#game-engine/physics.js';
import { renderLoop } from '#game-engine/render.js';
import { Hack } from '#entities/hack.js';
import { Arena } from '#entities/arena.js';
import { createArena, createCamera, createLight } from '#game-engine/create.js';
import { NullEngine, Scene, Camera, Light } from '@babylonjs/core';
import XMLHttpRequest from 'xmlhttprequest-ssl';
import { GameRoom } from '#rooms/GameRoom.js';
global.XMLHttpRequest = XMLHttpRequest;

export class GameEngine {
  private _scene!: Scene;
  private _defaultScene!: Scene;
  private _engine!: NullEngine;
  private _gameRoom!: GameRoom;
  //
  private _arena!: Arena;
  private _hacks!: Map<string, Hack>;
  //
  //@ts-ignore
  private _camera!: Camera;
  //@ts-ignore
  private _light!: Light;

  constructor(gameRoom: GameRoom) {
    this.gameRoom = gameRoom;
  }

  async initGame() {
    this.engine = new NullEngine();

    console.log(`Room: ${this.gameRoom.roomId} - creating scene`);
    const scene = new Scene(this.engine);

    console.log(`Room: ${this.gameRoom.roomId} - initializing physics`);
    await initializePhysics(scene);

    console.log(`Room: ${this.gameRoom.roomId} - initializing scene`);
    this.scene = await this.initScene(scene);

    renderLoop(this);
  }

  /* v8 ignore start */
  async initScene(scene: Scene) {
    console.log(`Room: ${this.gameRoom.roomId} - creating camera and lights`);
    this.camera = createCamera(scene, 40);
    this.light = createLight(scene);

    console.log(`Room: ${this.gameRoom.roomId} - initializing arena`);
    this.arena = createArena();
    await this.arena.initMesh(scene);

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
  set gameRoom(gameRoom: GameRoom) {
    this._gameRoom = gameRoom;
  }
  set arena(arena: Arena) {
    this._arena = arena;
  }
  set hacks(hacks: Map<string, Hack>) {
    this._hacks = hacks;
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
  get gameRoom(): GameRoom {
    return this._gameRoom;
  }
  get arena(): Arena {
    return this._arena;
  }
  get hacks(): Map<string, Hack> {
    return this._hacks;
  }
  get camera(): Camera {
    return this._camera;
  }
  get light(): Light {
    return this._light;
  }
  /* v8 ignore stop */
}
