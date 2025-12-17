import { IBall, PhysicsMesh } from './types.ts';
import * as BABYLON from '@babylonjs/core';

export class Ball implements IBall {
  public physicsMesh: PhysicsMesh;
  public lifespan: number;

  constructor(
    ball: BABYLON.Mesh,
    position: BABYLON.Vector3,
    scene: BABYLON.Scene
  ) {
    const mesh = ball;
    mesh.position = position;
    const aggregate = new BABYLON.PhysicsAggregate(
      mesh,
      BABYLON.PhysicsShapeType.SPHERE,
      { mass: 0.1, restitution: 1.023, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh, aggregate };
    this.lifespan = 1000;
  }

  isDead(): boolean {
    const dead = this.lifespan < 0.0;
    if (dead) {
      this.dispose();
    }
    return dead;
  }

  dispose(): void {
    this.physicsMesh.mesh.dispose();
    this.physicsMesh.aggregate.dispose();
  }

  update(): void {
    this.lifespan = this.lifespan - 1;
  }
}
