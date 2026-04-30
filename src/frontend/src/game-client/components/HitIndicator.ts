import {
  Scene,
  Vector3,
  StandardMaterial,
  Vector3Distance,
  LinesMesh,
  Plane,
  Color3,
  Ray
} from '@babylonjs/core';
import { Hack } from './Hack';

import { HitIndicatorConfig } from '../types/Types';
import gameConfig from '../utils/GameConfig';
import {
  createColor3,
  createColorLerp,
  createDisc,
  createNewLines,
  createSphere,
  createStandardMaterial,
  createUpdatedLines,
  createVector3Zero
} from '../utils/Create';
import p5 from 'p5';

/* v8 ignore start */
export class HitIndicator {
  private _goalPosition!: Vector3;
  private _goalPlane!: Plane;
  private _radius!: number;
  private _rotation!: boolean;
  private _scene!: Scene;
  private _hitDiskMaterial!: StandardMaterial;
  private _hackLerpStart: Color3;
  private _hackLerpEnd: Color3;
  private _absGoalDistance: number;

  constructor(config: HitIndicatorConfig) {
    this.goalPosition = config.goalPosition;
    this.goalPlane = new Plane(
      config.goalPosition.x,
      config.goalPosition.y,
      config.goalPosition.z,
      Vector3Distance(this.goalPosition, createVector3Zero())
    );
    this.radius = config.radius;
    this.rotation = config.rotation;
    this.scene = config.scene;
    this.hitDiskMaterial = createStandardMaterial(
      gameConfig.hitDiskMaterialName,
      this.scene
    );
    this.hitDiskMaterial.alpha = gameConfig.hitDiskAlpha;

    // NOTE: to color Hack indicator boundingbox
    const fc = gameConfig.hitIndicatorFrontColor;
    const bc = gameConfig.hitIndicatorBackColor;
    this.scene.getBoundingBoxRenderer().frontColor.set(fc.r, fc.g, fc.b);
    this.scene.getBoundingBoxRenderer().backColor.set(bc.r, bc.g, bc.b);
    this._hackLerpStart = new Color3(1, 0, 0);
    this._hackLerpEnd = new Color3(0, 1, 0);
    this._absGoalDistance = Math.abs(this.goalPosition.z);
  }

  detectIncomingHits(hack: Hack) {
    if (hack.isDead() || typeof hack.linearVelocity === 'undefined') {
      return;
    }

    const origin = hack.mesh.position;
    const direction = hack.linearVelocity.normalize();
    const ray = new Ray(origin, direction, this._absGoalDistance);
    const hits = this.scene.multiPickWithRay(ray);
    let isHit = false;

    if (hits) {
      for (const hit of hits) {
        if (hit.pickedMesh?.name === 'keyGridMesh') {
          isHit = true;
          const point = hit.pickedPoint as Vector3;
          this.createHitIndicatorLines(hack, point);
          this.createHitIndicatorDisk(hack, point, hit.distance);
          this.changeHackColor(hack, hit.distance);
        }
      }
    }

    if (isHit === false) {
      this.disposeHitIndicators(hack);
      this.resetHackColor(hack);
    }
  }

  private resetHackColor(hack: Hack) {
    if (hack.mesh.material) {
      const material = hack.mesh.material as StandardMaterial;
      Color3.LerpToRef(
        this._hackLerpStart,
        this._hackLerpEnd,
        1,
        material.ambientColor
      );
      material.diffuseColor = material.ambientColor;
      hack.mesh.material = material;
    }
  }

  private changeHackColor(hack: Hack, distance: number) {
    if (hack.mesh.material) {
      const material = hack.mesh.material as StandardMaterial;
      const ratio = p5.prototype.map(distance, 0, this._absGoalDistance, 0, 1);
      Color3.LerpToRef(
        this._hackLerpStart,
        this._hackLerpEnd,
        ratio,
        material.ambientColor
      );
      material.diffuseColor = material.ambientColor;
      hack.mesh.material = material;
    }
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
      hack.lines = createUpdatedLines(gameConfig.hitLinesMeshName, options);
    } else {
      const options = {
        points: [hack.mesh.absolutePosition, intersectionPoint],
        updatable: true
      };

      const lines = createNewLines(
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
    const distanceRatio = p5.prototype.map(
      distance,
      this._absGoalDistance / 4,
      this._absGoalDistance,
      1,
      0
    );
    if (hack.hitDisk === null) {
      const disc = createDisc(
        gameConfig.hitDiskMeshName,
        {
          radius: hack.mesh.getBoundingInfo().diagonalLength / 2,
          sideOrientation: Number(this.rotation)
        },
        this.scene
      );
      disc.isPickable = false;
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
      this.hitDiskMaterial.diffuseColor = createColorLerp(
        createColor3(sc.r, sc.g, sc.b),
        createColor3(ec.r, ec.g, ec.b),
        distanceRatio
      );
    }
  }

  debugSphere() {
    const sphere = createSphere(
      gameConfig.hitIndicatorDebugMeshName,
      {
        diameter: this.radius
      },
      this.scene
    );
    const material = createStandardMaterial(
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
