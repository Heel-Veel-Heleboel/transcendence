import {
  AbstractMesh,
  Scene,
  PhysicsAggregate,
  Vector3,
  Mesh
} from '@babylonjs/core';
import { Arena } from '../components/arena';
import { KeyManager } from '../systems/keyManager.ts';
import { Player } from '../components/player.ts';
import { KeyGrid } from '../systems/keyGrid.ts';
import { Hud } from '../components/hud.ts';
import { Ball } from '../components/ball.ts';
import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import { HitIndicator } from '../components/hitIndicator.ts';

export interface IncomingBall {
  ball: Ball;
  line: AbstractMesh;
}

export interface IHitIndicator {
  goalPosition: Vector3;
  radius: number;
  scene: Scene;
}

export interface IHud {
  texture: AdvancedDynamicTexture;
  filePath: string;
  healthMeter: Control;
  manaMeter: Control;
}

export interface PlayerConfig {
  goalPosition: Vector3;
  goalDimensions: Vector3;
  hud: Hud;
  keys: {
    columns: string;
    rows: string;
    length: number;
    precisionKeys: string;
  };
}

export interface IKeyGrid {
  grid: Map<string, { x: number; y: number }>;
  columns: string;
  rows: string;
  precisionKeys: string;
  length: number;
  dimensions: { goalPosition: Vector3; goalDimensions: Vector3 };
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
  actions: Map<string, { x: number; y: number }>;
  precisionKeys: string;
  player: Player;
}

export interface IPlayer {
  physicsMesh: PhysicsMesh;
  lifespan: number;
  goalDimensions: Vector3;
  goalPosition: Vector3;
  keyGrid: KeyGrid;
  keyGridMesh: Mesh;
  ratioDiv: number;
  hud: Hud;
  hitIndicator: HitIndicator;
}

export interface IBall {
  physicsMesh: PhysicsMesh | null;
  lifespan: number;
  lines: AbstractMesh | null;
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
