import { Scene, TransformNode } from '@babylonjs/core';
import { Arena } from './arena';
import { KeyManager } from './KeyManager';
import { Player } from './player.ts';

export class World {
  public scene: Scene;
  public _frameCount: number;
  public _keyManager!: KeyManager;
  public _arena!: Arena;
  public _localPlayer!: Player;
  public _remotePlayer!: Player;

  constructor(scene: Scene) {
    this.scene = scene;
    this._frameCount = 0;
    // An extra step is needed in order to be able to physicalize meshes coming from gltf. Insert an extra node transform just before the __root__ so conversion between Righ or Left handedness are transparent for the physics engine.
    const trParent = new TransformNode('tr', scene);
    const root = scene.getMeshByName('__root__');
    if (root) {
      root.scaling.scaleInPlace(100);
      root.position.y = 4;
      root.setParent(trParent);
    }
  }

  set keyManager(keyManager: KeyManager) {
    this._keyManager = keyManager;
  }
  set arena(arena: Arena) {
    this._arena = arena;
  }
  set localPlayer(localPlayer: Player) {
    this._localPlayer = localPlayer;
  }
  set remotePlayer(remotePlayer: Player) {
    this._remotePlayer = remotePlayer;
  }
  set frameCount(frameCount: number) {
    this._frameCount = frameCount;
  }

  get frameCount(): number {
    return this._frameCount;
  }
  get keyManager(): KeyManager {
    return this._keyManager;
  }
}
