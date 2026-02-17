import { IBall, PhysicsMesh } from '#types/Common.js';
import { Schema, type } from '@colyseus/schema';
import {
  Mesh,
  Scene,
  Vector3,
  PhysicsAggregate,
  PhysicsShapeType
} from '@babylonjs/core';

/* v8 ignore start */
export class Ball extends Schema implements IBall {
  @type('number') lifespan: number;
  @type('number') id: number;
  @type('number') x: number;
  @type('number') y: number;
  @type('number') z: number;
  @type('number') linearVelocityX: number;
  @type('number') linearVelocityY: number;
  @type('number') linearVelocityZ: number;

  public physicsMesh: PhysicsMesh;

  constructor(ball: Mesh, position: Vector3, scene: Scene) {
    super();
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
  }

  setPosition(pos: Vector3) {
    this.x = pos._x;
    this.y = pos._y;
    this.z = pos._z;
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
/* v8 ignore stop */
