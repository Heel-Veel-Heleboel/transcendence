import { IPlayer, PhysicsMesh } from './types.ts';
import * as BABYLON from '@babylonjs/core';

export class Player implements IPlayer {
  public physicsMesh: PhysicsMesh;
  public lifespan: number;

  constructor(
    goalPosition: BABYLON.Vector3,
    goalDimensions: BABYLON.Vector3,
    scene: BABYLON.Scene
  ) {
    const mesh = BABYLON.MeshBuilder.CreateBox(
      'padel',
      {
        height: goalDimensions.y / 4,
        width: goalDimensions.x / 4,
        depth: goalDimensions.z / 4
      },
      scene
    );
    mesh.position = new BABYLON.Vector3(
      goalPosition.x,
      goalPosition.y,
      goalPosition.z
    );
    mesh.position.addInPlace(
      new BABYLON.Vector3(0, 0, (mesh.position.z / 20) * -1)
    );
    const material = new BABYLON.StandardMaterial('wireframe', scene);
    material.wireframe = true;
    mesh.material = material;
    if (mesh.material) {
      mesh.material.wireframe = true;
    }
    const aggregate = new BABYLON.PhysicsAggregate(
      mesh,
      BABYLON.PhysicsShapeType.MESH,
      { mass: 0, restitution: 1, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh, aggregate };
    this.lifespan = 1000;
  }

  dispose(): void {
    this.physicsMesh.mesh.dispose();
    this.physicsMesh.aggregate.dispose();
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }
}
