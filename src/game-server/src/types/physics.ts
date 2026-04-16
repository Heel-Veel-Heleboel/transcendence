import { AbstractMesh, PhysicsAggregate } from '@babylonjs/core';

export interface PhysicsMesh {
  mesh: AbstractMesh;
  aggregate: PhysicsAggregate;
}
