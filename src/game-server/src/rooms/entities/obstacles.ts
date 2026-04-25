import { Schema, type } from '@colyseus/schema';
import {
  Mesh,
  Scene,
  Vector3,
  PhysicsAggregate,
  PhysicsShapeType
} from '@babylonjs/core';
import { PhysicsMesh } from '#types/physics.js';

/* v8 ignore start */
export class Obstacle extends Schema {
  @type('number') lifespan: number;
  @type('number') id: number;
  @type('number') x: number;
  @type('number') y: number;
  @type('number') z: number;
  @type('number') rotationX: number;
  @type('number') rotationY: number;
  @type('number') rotationZ: number;
  @type('number') type: number;

  public physicsMesh: PhysicsMesh;

  constructor(
    id: number,
    type: number,
    mesh: Mesh,
    position: Vector3,
    scene: Scene
  ) {
    super();
    this.type = type;
    mesh.position = position;
    const rotation = new Vector3(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    mesh.rotation = rotation;
    this.rotationX = rotation.x;
    this.rotationY = rotation.y;
    this.rotationZ = rotation.z;
    this.setPosition(position);
    const aggregate = new PhysicsAggregate(
      mesh,
      PhysicsShapeType.MESH,
      { mass: 0, restitution: 1, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh, aggregate };
    this.lifespan = 750;
    this.id = id;
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
    this.x = this.physicsMesh.mesh.absolutePosition.x;
    this.y = this.physicsMesh.mesh.absolutePosition.y;
    this.z = this.physicsMesh.mesh.absolutePosition.z;
  }
}
/* v8 ignore stop */
