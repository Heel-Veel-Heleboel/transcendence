import {
  AbstractMesh,
  Light,
  Scene,
  PhysicsAggregate,
  Vector3,
  Mesh
} from '@babylonjs/core';
import { Arena } from './arena';
import { KeyManager } from './KeyManager';
import { Player } from './player.ts';
import { KeyGrid } from './KeyGrid.ts';

export interface IKeyGrid {
  grid: Map<string, { x: number; y: number }>;
  columns: string;
  rows: string;
  length: number;
}

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
  goalDimensions: Vector3;
  goalPosition: Vector3;
  keyGrid: KeyGrid;
  keyGridMesh: Mesh;
  ratioDiv: number;
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
