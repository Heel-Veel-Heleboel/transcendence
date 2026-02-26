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
import { Hack } from './Hack';

import { IHitIndicator } from '../types/Types';
import gameConfig from '../utils/GameConfig';

/* v8 ignore start */
export class HitIndicator implements IHitIndicator {
  public goalPosition: Vector3;
  public goalPlane: Plane;
  public radius: number;
  public rotation: boolean;
  public scene: Scene;
  private hitDiskMaterial: StandardMaterial;

  constructor(
    goalPosition: Vector3,
    radius: number,
    rotation: boolean,
    scene: Scene
  ) {
    this.goalPosition = goalPosition;
    this.goalPlane = new Plane(
      goalPosition.x,
      goalPosition.y,
      goalPosition.z,
      Vector3Distance(this.goalPosition, Vector3.Zero())
    );
    this.radius = radius;
    this.rotation = rotation;
    this.scene = scene;
    this.hitDiskMaterial = new StandardMaterial(
      gameConfig.hitDiskMaterialName,
      this.scene
    );
    this.hitDiskMaterial.alpha = gameConfig.hitDiskAlpha;
    // to color Hack indicator boundingbox
    const fc = gameConfig.hitIndicatorFrontColor;
    const bc = gameConfig.hitIndicatorBackColor;
    scene.getBoundingBoxRenderer().frontColor.set(fc.r, fc.g, fc.b);
    scene.getBoundingBoxRenderer().backColor.set(bc.r, bc.g, bc.b);
  }

  debugSphere() {
    const sphere = MeshBuilder.CreateSphere(
      gameConfig.hitIndicatorDebugMeshName,
      {
        diameter: this.radius
      },
      this.scene
    );
    const material = new StandardMaterial(
      gameConfig.hitIndicatorDebugMaterialName,
      this.scene
    );
    material.wireframe = true;
    sphere.material = material;
    if (sphere.material) {
      sphere.material.wireframe = true;
    }
    sphere.position = this.goalPosition;
  }

  // NOTE: acknowledgement: https://github.com/rvan-mee/miniRT/blob/master/src/render/intersect/intersect_plane.c
  goalPlaneIntersection(hack: Hack) {
    const perpendicularity = Vector3Dot(
      hack.linearVelocity,
      this.goalPlane.normal
    );
    const diff = this.goalPosition.subtract(hack.mesh.absolutePosition);
    const distance = this.goalPlane.dotCoordinate(diff) / perpendicularity;
    return distance;
  }

  detectIncomingHits(hack: Hack) {
    if (hack.isDead() || hack.linearVelocity === undefined) {
      return;
    }
    const distance = this.goalPlaneIntersection(hack);
    if (Math.abs(distance) > this.radius / 2 || distance < 0) {
      this.disposeHitIndicators(hack);
      return;
    }
    const intersectionPoint = hack.linearVelocity
      .scale(distance)
      .add(hack.mesh.absolutePosition);
    this.createHitIndicatorLines(hack, intersectionPoint);
    this.createHitIndicatorDisk(hack, intersectionPoint, distance);
  }

  disposeHitIndicators(hack: Hack) {
    hack.lines?.dispose();
    hack.lines = null;
    hack.mesh.showBoundingBox = false;
    hack.hitDisk?.dispose();
    hack.hitDisk = null;
  }

  createHitIndicatorLines(hack: Hack, intersectionPoint: Vector3) {
    if (hack.lines !== null) {
      const options = {
        points: [hack.mesh.absolutePosition, intersectionPoint],
        updatable: true,
        // NOTE: no scene parameter needed with options.instance, used for updates
        instance: hack.lines as LinesMesh
      };
      hack.lines = MeshBuilder.CreateLines(
        gameConfig.hitLinesMeshName,
        options
      );
    } else {
      const options = {
        points: [hack.mesh.absolutePosition, intersectionPoint],
        updatable: true
      };

      const lines = MeshBuilder.CreateLines(
        gameConfig.hitLinesMeshName,
        options,
        this.scene
      );
      hack.lines = lines;
      hack.mesh.showBoundingBox = true;
    }
  }

  createHitIndicatorDisk(
    hack: Hack,
    intersectionPoint: Vector3,
    distance: number
  ) {
    const distanceRatio = Math.max(0, 1 / distance) + 0.1;
    if (hack.hitDisk === null) {
      const disc = MeshBuilder.CreateDisc(
        gameConfig.hitDiskMeshName,
        {
          radius: hack.mesh.getBoundingInfo().diagonalLength / 2,
          sideOrientation: Number(this.rotation)
        },
        this.scene
      );
      disc.material = this.hitDiskMaterial;
      disc.position = intersectionPoint;
      hack.hitDisk = disc;
    } else {
      hack.hitDisk.position = intersectionPoint;
      if (hack.hitDisk.material) {
        hack.hitDisk.material.alpha = distanceRatio;
      }
      const sc = gameConfig.hitDiskStartColor;
      const ec = gameConfig.hitDiskEndColor;
      this.hitDiskMaterial.diffuseColor = Color3.Lerp(
        new Color3(sc.r, sc.g, sc.b),
        new Color3(ec.r, ec.g, ec.b),
        distanceRatio
      );
    }
  }
}
/* v8 ignore stop */
