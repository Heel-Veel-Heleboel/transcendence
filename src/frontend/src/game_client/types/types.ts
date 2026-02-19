import { AbstractMesh, Scene, Vector3, Mesh } from '@babylonjs/core';
import { Arena } from '../components/arena';
import { KeyManager } from '../systems/keyManager.ts';
import { Player } from '../components/player.ts';
import { KeyGrid } from '../systems/keyGrid.ts';
import { Hud } from '../components/hud.ts';
import { AdvancedDynamicTexture, Control } from '@babylonjs/gui';
import { HitIndicator } from '../components/hitIndicator.ts';

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

export interface IPlayerConfig {
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

export interface IKeyGridKeys {
  columns: string;
  rows: string;
  length: number;
  precisionKeys: string;
}

export interface IKeyGridDimensions {
  goalPosition: Vector3;
  goalDimensions: Vector3;
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
  precisionMove: number;
}

export interface IPlayer {
  mesh: AbstractMesh;
  lifespan: number;
  goalDimensions: Vector3;
  goalPosition: Vector3;
  ratioDiv: number;
}

export interface IProtagonist {
  keyGrid: KeyGrid;
  keyGridMesh: Mesh;
  hud: Hud;
  hitIndicator: HitIndicator;
}

export interface IAntagonist {}

export interface IHack {
  mesh: AbstractMesh | null;
  lifespan: number;
  lines: AbstractMesh | null;
}

export interface IArena {
  arena: AbstractMesh;
  goal_1: AbstractMesh;
  goal_2: AbstractMesh;
}
