import * as BABYLON from '@babylonjs/core';

export interface IBall {
  mesh: BABYLON.Mesh;
  aggregate: BABYLON.PhysicsAggregate;
}

export interface IArena {
  mesh: BABYLON.AbstractMesh;
  aggregate: BABYLON.PhysicsAggregate;
}
