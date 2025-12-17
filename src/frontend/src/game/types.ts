import { AbstractMesh, PhysicsAggregate } from '@babylonjs/core';

export interface IBall {
  physicsMesh: PhysicsMesh;
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
