import { AbstractMesh, Scene, Vector3, Mesh } from '@babylonjs/core';
import { KeyGrid } from '../systems/KeyGrid';
import { Hud } from '../components/Hud';
import { Control } from '@babylonjs/gui';
import { HitIndicator } from '../components/HitIndicator';
import { Protagonist } from '../components/Protagonist';
import { Room } from '@colyseus/sdk';

export interface HitIndicatorConfig {
  goalPosition: Vector3;
  radius: number;
  rotation: boolean;
  scene: Scene;
}

export interface IHud {
  healthMeter: Control;
  manaMeter: Control;
}

export interface IPlayerConfig {
  goalPosition: Vector3;
  goalDimensions: Vector3;
  keys: {
    length: number;
  };
}

export interface IProtagonistConfig {
  goalPosition: Vector3;
  goalDimensions: Vector3;
  hud: Hud;
  keys: {
    columns: string;
    rows: string;
    length: number;
    precisionKeys: string;
  };
  room: Room;
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

export interface IKeyGridConfig {
  dimensions: IKeyGridDimensions;
  keys: IKeyGridKeys;
  rotation: boolean;
}

export interface IKeyGrid {
  grid: Map<string, { x: number; y: number }>;
  columns: string;
  rows: string;
  precisionKeys: string;
  length: number;
  dimensions: { goalPosition: Vector3; goalDimensions: Vector3 };
}

export interface IKeyManager {
  windowFrames: number;
  buffer: string[];
  deltaTime: number;
  actions: Map<string, { x: number; y: number }>;
  precisionKeys: string;
  player: Protagonist;
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
  keyGridHints: Mesh[];
  hud: Hud;
  hitIndicator: HitIndicator;
  room: Room;
  rotation: boolean;
}

export interface IAntagonist {}

export interface IHack {
  mesh: AbstractMesh | null;
  lifespan: number;
  lines: AbstractMesh | null;
  hitDisk: AbstractMesh | null;
}

export interface IArena {
  arena: AbstractMesh;
  goal_1: AbstractMesh;
  goal_2: AbstractMesh;
}
