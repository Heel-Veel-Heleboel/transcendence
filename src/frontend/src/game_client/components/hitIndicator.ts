import {
  Scene,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Vector3Distance,
  LinesMesh
} from '@babylonjs/core';
import { Ball } from './ball';

import { IHitIndicator } from '../types/types';

/* v8 ignore start */
export class HitIndicator implements IHitIndicator {
  public goalPosition: Vector3;
  public radius: number;
  public scene: Scene;

  constructor(goalPosition: Vector3, radius: number, scene: Scene) {
    this.goalPosition = goalPosition;
    this.radius = radius;
    this.scene = scene;
  }

  debugSphere() {
    const sphere = MeshBuilder.CreateSphere(
      'sphere',
      {
        diameter: this.radius
      },
      this.scene
    );
    const material = new StandardMaterial('wireframe', this.scene);
    material.wireframe = true;
    sphere.material = material;
    if (sphere.material) {
      sphere.material.wireframe = true;
    }
    sphere.position = this.goalPosition;
  }

  detectIncomingHits(ball: Ball) {
    const distance = Vector3Distance(
      ball.physicsMesh.mesh.absolutePosition,
      this.goalPosition
    );
    if (distance > this.radius / 2) {
      if (ball.lines !== null) {
        ball.lines.dispose();
        ball.lines = null;
        ball.physicsMesh.mesh.showBoundingBox = false;
      }
      return;
    }
    if (ball.lines !== null) {
      if (ball.isDead()) {
        return;
      }
      const options = {
        points: [
          ball.physicsMesh.mesh.absolutePosition,
          ball.linearVelocity.addInPlace(ball.physicsMesh.mesh.absolutePosition)
        ],
        updatable: true,
        // no scene parameter needed with options.instance, used for updates
        instance: ball.lines as LinesMesh
      };
      ball.lines = MeshBuilder.CreateLines('lines', options);
    } else {
      const options = {
        points: [
          ball.physicsMesh.mesh.absolutePosition,
          ball.linearVelocity.addInPlace(ball.physicsMesh.mesh.absolutePosition)
        ],
        updatable: true
      };

      const lines = MeshBuilder.CreateLines('lines', options, this.scene);
      ball.lines = lines;
      ball.physicsMesh.mesh.showBoundingBox = true;
    }
  }
}
/* v8 ignore stop */
