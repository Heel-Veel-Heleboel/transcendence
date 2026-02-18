import { AbstractMesh, PhysicsAggregate, Vector3 } from '@babylonjs/core';

export interface IPlayerConfig {
  goalPosition: Vector3;
  goalDimensions: Vector3;
  keys: {
    length: number;
  };
}

export interface IPlayer {
  physicsMesh: PhysicsMesh;
  lifespan: number;
}

export interface IBall {
  physicsMesh: PhysicsMesh | null;
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
