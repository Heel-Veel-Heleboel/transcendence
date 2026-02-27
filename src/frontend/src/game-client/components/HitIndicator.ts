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

import { HitIndicatorConfig } from '../types/Types';
import gameConfig from '../utils/GameConfig';

/* v8 ignore start */
export class HitIndicator {
  private _goalPosition!: Vector3;
  private _goalPlane!: Plane;
  private _radius!: number;
  private _rotation!: boolean;
  private _scene!: Scene;
  private _hitDiskMaterial!: StandardMaterial;

  constructor(config: HitIndicatorConfig) {
    this.goalPosition = config.goalPosition;
    this.goalPlane = new Plane(
      config.goalPosition.x,
      config.goalPosition.y,
      config.goalPosition.z,
      Vector3Distance(this.goalPosition, Vector3.Zero())
    );
    this.radius = config.radius;
    this.rotation = config.rotation;
    this.scene = config.scene;
    this.hitDiskMaterial = new StandardMaterial(
      gameConfig.hitDiskMaterialName,
      this.scene
    );
    this.hitDiskMaterial.alpha = gameConfig.hitDiskAlpha;

    // NOTE: to color Hack indicator boundingbox
    const fc = gameConfig.hitIndicatorFrontColor;
    const bc = gameConfig.hitIndicatorBackColor;
    this.scene.getBoundingBoxRenderer().frontColor.set(fc.r, fc.g, fc.b);
    this.scene.getBoundingBoxRenderer().backColor.set(bc.r, bc.g, bc.b);
  }

  detectIncomingHits(hack: Hack) {
    if (hack.isDead() || typeof hack.linearVelocity === 'undefined') {
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

  // NOTE: acknowledgement: https://github.com/rvan-mee/miniRT/blob/master/src/render/intersect/intersect_plane.c
  private goalPlaneIntersection(hack: Hack) {
    const perpendicularity = Vector3Dot(
      hack.linearVelocity,
      this.goalPlane.normal
    );
    const diff = this.goalPosition.subtract(hack.mesh.absolutePosition);
    const distance = this.goalPlane.dotCoordinate(diff) / perpendicularity;
    return distance;
  }

  private disposeHitIndicators(hack: Hack) {
    hack.lines?.dispose();
    hack.lines = null;
    hack.mesh.showBoundingBox = false;
    hack.hitDisk?.dispose();
    hack.hitDisk = null;
  }

  private createHitIndicatorLines(hack: Hack, intersectionPoint: Vector3) {
    if (hack.lines !== null) {
      const options = {
        points: [hack.mesh.absolutePosition, intersectionPoint],
        updatable: true,
        instance: hack.lines as LinesMesh // NOTE: no scene parameter needed with options.instance, used for updates
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

  private createHitIndicatorDisk(
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

  private set goalPosition(goalPosition: Vector3) {
    this._goalPosition = goalPosition;
  }
  private get goalPosition() {
    return this._goalPosition;
  }
  private set goalPlane(goalPlane: Plane) {
    this._goalPlane = goalPlane;
  }
  private get goalPlane() {
    return this._goalPlane;
  }
  private set radius(radius: number) {
    this._radius = radius;
  }
  private get radius() {
    return this._radius;
  }
  private set rotation(rotation: boolean) {
    this._rotation = rotation;
  }
  private get rotation() {
    return this._rotation;
  }
  private set scene(scene: Scene) {
    this._scene = scene;
  }
  private get scene() {
    return this._scene;
  }
  private set hitDiskMaterial(hitDiskMaterial: StandardMaterial) {
    this._hitDiskMaterial = hitDiskMaterial;
  }
  private get hitDiskMaterial() {
    return this._hitDiskMaterial;
  }
}
/* v8 ignore stop */
