import { IBall, PhysicsMesh } from './types.ts';
import * as BABYLON from '@babylonjs/core';

export class Ball implements IBall {
  public physicsMesh: PhysicsMesh;

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
  }

  // checkBorders(arena: Arena): void {
  //   if (this.mesh.position.x < arena[0].position.x) {
  //     this.acceleration.x = inverseNum(this.acceleration.x);
  //   }
  //   if (this.mesh.position.x > arena[1].position.x) {
  //     this.acceleration.x = inverseNum(this.acceleration.x);
  //   }
  //   if (this.mesh.position.y > arena[2].position.y) {
  //     this.acceleration.y = inverseNum(this.acceleration.y);
  //   }
  //   if (this.mesh.position.y < arena[3].position.y) {
  //     this.acceleration.y = inverseNum(this.acceleration.y);
  //   }
  //   if (this.mesh.position.z > arena[4].position.z) {
  //     this.acceleration.z = inverseNum(this.acceleration.z);
  //   }
  //   if (this.mesh.position.z < arena[5].position.z) {
  //     this.acceleration.z = inverseNum(this.acceleration.z);
  //   }
  // }

  update(): void {
    // this.velocity.addInPlace(this.acceleration);
    // this.velocity.normalize();
    // this.mesh.position.addInPlace(this.acceleration);
    console.log('here');
    this.aggregate.body.applyForce(
      new BABYLON.Vector3(-0.1, -1, 0),
      this.mesh.absolutePosition
    );
  }
}
