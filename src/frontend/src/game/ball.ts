import { IBall } from './types.ts';
import * as BABYLON from '@babylonjs/core';
import { inverseNum } from './utils.ts';
import { Arena } from './arena.ts';

export class Ball implements IBall {
  public mesh: BABYLON.Mesh;
  public aggregate: BABYLON.PhysicsAggregate;
  public acceleration: BABYLON.Vector3;
  public velocity: BABYLON.Vector3;

  constructor(
    ball: BABYLON.Mesh,
    position: BABYLON.Vector3,
    scene: BABYLON.Scene
  ) {
    this.mesh = ball;
    this.mesh.position = position;
    this.aggregate = new BABYLON.PhysicsAggregate(
      this.mesh,
      BABYLON.PhysicsShapeType.SPHERE,
      { mass: 1, restitution: 0.75 },
      scene
    );
    this.acceleration = new BABYLON.Vector3(0, -1, 0);
    this.velocity = new BABYLON.Vector3();
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
      new BABYLON.Vector3(0, -10, 0),
      this.mesh.absolutePosition
    );
  }
}
