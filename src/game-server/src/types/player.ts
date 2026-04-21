import { Vector3 } from '@babylonjs/core';
import { PhysicsMesh } from './physics.js';

export interface IPlayerConfig {
  goalPosition: Vector3;
  goalDimensions: Vector3;
  keys: {
    columns: string;
    rows: string;
    length: number;
    precisionKeys: string;
  };
  isHost: boolean;
}

export interface IPlayer {
  physicsMesh: PhysicsMesh;
  lifespan: number;
}
