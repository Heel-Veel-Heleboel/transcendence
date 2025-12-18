import { AbstractMesh, Light, Scene, PhysicsAggregate } from '@babylonjs/core';
import { Arena } from './arena';
import { KeyManager } from './KeyManager';
import { Player } from './player.ts';

export interface IWorld {
  scene: Scene;
  frameCount: number;
  keyManager: KeyManager;
  arena: Arena;
  localPlayer: Player;
  remotePlayer: Player;
}

export interface IKeyManager {
  windowFrames: number;
  buffer: string[];
  deltaTime: number;
  actions: Map<string, Function>;
}

export interface IPlayer {
  physicsMesh: PhysicsMesh;
  lifespan: number;
}

export interface IBall {
  physicsMesh: PhysicsMesh;
  lifespan: number;
}

export interface IArena {
  arena: PhysicsMesh;
  goal_1: PhysicsMesh;
  goal_2: PhysicsMesh;
}

export interface PhysicsMesh {
  mesh: AbstractMesh;
  aggregate: PhysicsAggregate;
}
