import { InstancedMesh, Vector3 } from '@babylonjs/core';
import p5 from 'p5';

export class NetworkPacket {
  public birthFrameCount: number;
  public internalFrameCount: number;
  public instance: InstancedMesh;
  public origin: Vector3;
  public destination: Vector3;
  public direction: Vector3;
  public dead: boolean;

  constructor(
    instance: InstancedMesh,
    destination: Vector3,
    birthFrameCount: number
  ) {
    this.birthFrameCount = birthFrameCount;
    this.internalFrameCount = 0;
    this.instance = instance;
    this.origin = instance.position.clone();
    this.destination = destination;
    this.direction = this.destination.subtract(this.origin).scale(0.01);
    this.dead = false;
  }

  move() {
    this.instance.position.addInPlace(this.direction);
    const phi = (this.internalFrameCount++ * 1 + 0) % (Math.PI * 2);
    console.log('phi', phi);
    const ratio = 0.5 * (Math.sin(phi) + 1);
    console.log('ratio', ratio);
    this.instance.visibility = ratio;
    const originDestinationDistance = Vector3.Distance(
      this.origin,
      this.destination
    );
    const originPositionDistance = Vector3.Distance(
      this.origin,
      this.instance.position
    );
    if (originDestinationDistance === 0 || originPositionDistance === 0) {
      this.dead = true;
    }
    if (originPositionDistance > originDestinationDistance) {
      this.dead = true;
    }
  }

  isDead(frameCount: number) {
    if (this.dead) {
      this.dispose();
      return true;
    }
    if (frameCount - this.birthFrameCount > 1500) {
      this.dispose();
      return true;
    }
    return false;
  }

  dispose() {
    this.instance.dispose();
  }
}
