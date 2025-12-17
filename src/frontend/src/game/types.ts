import * as BABYLON from '@babylonjs/core';

export interface IBall {
  physicsMesh: PhysicsMesh;
}

export interface IArena {
  physicsMesh: PhysicsMesh[];
}

export interface PhysicsMesh {
  mesh: BABYLON.AbstractMesh;
  aggregate: BABYLON.PhysicsAggregate;
}
