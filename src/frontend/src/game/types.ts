import * as BABYLON from '@babylonjs/core';

export interface IBall {
  mesh: BABYLON.Mesh;
  aggregate: BABYLON.PhysicsAggregate;
  acceleration: BABYLON.Vector3;
  velocity: BABYLON.Vector3;
}

export interface IArena {
  mesh: BABYLON.AbstractMesh;
  aggregate: BABYLON.PhysicsAggregate;
}
