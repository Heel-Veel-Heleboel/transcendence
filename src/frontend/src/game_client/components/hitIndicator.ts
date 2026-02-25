import {
  Scene,
  MeshBuilder,
  Vector3,
  StandardMaterial,
  Vector3Distance,
  LinesMesh,
  Plane,
  Vector3Dot,
  Color3
} from '@babylonjs/core';
import { Hack } from './ball';

import { IHitIndicator } from '../types/types';

/* v8 ignore start */
export class HitIndicator implements IHitIndicator {
  public goalPosition: Vector3;
  public goalPlane: Plane;
  public radius: number;
  public scene: Scene;

  constructor(goalPosition: Vector3, radius: number, scene: Scene) {
    this.goalPosition = goalPosition;
    this.goalPlane = new Plane(
      goalPosition.x,
      goalPosition.y,
      goalPosition.z,
      Vector3Distance(this.goalPosition, Vector3.Zero())
    );
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

  // acknowledgement: https://github.com/rvan-mee/miniRT/blob/master/src/render/intersect/intersect_plane.c
  goalPlaneIntersection(ball: Hack) {
    const perpendicularity = Vector3Dot(
      ball.linearVelocity,
      this.goalPlane.normal
    );
    const diff = this.goalPosition.subtract(ball.mesh.absolutePosition);
    const distance = this.goalPlane.dotCoordinate(diff) / perpendicularity;
    return distance;
  }

  detectIncomingHits(ball: Hack) {
    if (ball.isDead()) {
      return;
    }
    if (ball.linearVelocity === undefined) {
      return;
    }
    const distance = this.goalPlaneIntersection(ball);
    if (Math.abs(distance) > this.radius / 2 || distance < 0) {
      if (ball.lines !== null) {
        ball.lines.dispose();
        ball.lines = null;
        ball.mesh.showBoundingBox = false;
        ball.hitDisk?.dispose();
        ball.hitDisk = null;
      }
      return;
    }
    const intersectionPoint = ball.linearVelocity
      .scale(distance)
      .add(ball.mesh.absolutePosition);
    if (ball.lines !== null) {
      const options = {
        points: [ball.mesh.absolutePosition, intersectionPoint],
        updatable: true,
        // no scene parameter needed with options.instance, used for updates
        instance: ball.lines as LinesMesh
      };
      ball.lines = MeshBuilder.CreateLines('lines', options);
    } else {
      const options = {
        points: [ball.mesh.absolutePosition, intersectionPoint],
        updatable: true
      };

      const lines = MeshBuilder.CreateLines('lines', options, this.scene);
      ball.lines = lines;
      ball.mesh.showBoundingBox = true;
    }
    const ratio = Math.max(0, 1 / distance);
    if (ball.hitDisk === null) {
      const disc = MeshBuilder.CreateDisc(
        'disc',
        {
          radius: ball.mesh.getBoundingInfo().diagonalLength / 2
        },
        this.scene
      );
      const material = new StandardMaterial('hitDisk', this.scene);
      material.alpha = 0.1;
      material.diffuseColor = Color3.Lerp(
        new Color3(1.0, 1.0, 0),
        new Color3(1.0, 0, 0),
        1
      );
      disc.material = material;
      disc.position = intersectionPoint;
      ball.hitDisk = disc;
    } else {
      ball.hitDisk.position = intersectionPoint;
      if (ball.hitDisk.material) {
        ball.hitDisk.material.alpha = ratio;
      }
    }
  }
}
/* v8 ignore stop */
