import { IBall, PhysicsMesh } from '../types/types.ts';
import {
  AbstractMesh,
  Mesh,
  Scene,
  Vector3,
  PhysicsAggregate,
  PhysicsShapeType
} from '@babylonjs/core';

export class Ball implements IBall {
  public physicsMesh: PhysicsMesh;
  public lifespan: number;
  public lines: AbstractMesh | null;
  constructor(ball: Mesh, position: Vector3, scene: Scene) {
    const mesh = ball;
    mesh.position = position;
    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.SPHERE,
      { mass: 0.1, restitution: 1.023, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh, aggregate };
    this.lifespan = 1000;
    this.lines = null;
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
    if (this.lines) {
      this.lines.dispose();
    }
  }

  update(): void {
    this.lifespan = this.lifespan - 1;
  }
}
