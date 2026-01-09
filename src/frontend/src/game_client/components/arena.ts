import { IArena, PhysicsMesh } from '../types/types.ts';
import {
  ImportMeshAsync,
  Scene,
  Mesh,
  PhysicsShapeType,
  PhysicsAggregate,
  StandardMaterial
} from '@babylonjs/core';
import gameConfig from '../utils/gameConfig.ts';
import Errors from '../utils/error.ts';

/* v8 ignore start */
export class Arena implements IArena {
  public _arena!: PhysicsMesh;
  public _goal_1!: PhysicsMesh;
  public _goal_2!: PhysicsMesh;

  public get arena(): PhysicsMesh {
    return this._arena;
  }

  public set arena(value: PhysicsMesh) {
    this._arena = value;
  }

  public get goal_1(): PhysicsMesh {
    return this._goal_1;
  }

  public set goal_1(value: PhysicsMesh) {
    this._goal_1 = value;
  }

  public get goal_2(): PhysicsMesh {
    return this._goal_2;
  }

  public set goal_2(value: PhysicsMesh) {
    this._goal_2 = value;
  }

  constructor() {}

  async initMesh(scene: Scene) {
    const model = ImportMeshAsync(gameConfig.arenaImportpath, scene);
    await model.then(result => {
      if (result.meshes.length !== gameConfig.arenaMeshesCount)
        throw Error(Errors.INVALID_ARENA_FORMAT);
      for (const index of result.meshes) {
        const mesh = index as Mesh;
        if (mesh.id === gameConfig.rootMesh) continue;
        if (mesh.id === gameConfig.areneId) {
          mesh.flipFaces(true);
        }
        const material = new StandardMaterial('wireframe', scene);
        material.wireframe = true;
        mesh.material = material;
        if (mesh.material) {
          mesh.material.wireframe = true;
        }
        const aggregate = new PhysicsAggregate(
          mesh,
          PhysicsShapeType.MESH,
          { mass: 0.0, restitution: 1.0, friction: 0.0 },
          scene
        );
        aggregate.body.setAngularDamping(0.0);
        aggregate.body.setLinearDamping(0.0);
        if (mesh.id === gameConfig.areneId) {
          this._arena = { mesh, aggregate };
        } else if (mesh.id === gameConfig.goalId1) {
          aggregate.body.setCollisionCallbackEnabled(true);
          this.goal_1 = { mesh, aggregate };
        } else if (mesh.id === gameConfig.goalId2) {
          aggregate.body.setCollisionCallbackEnabled(true);
          this.goal_2 = { mesh, aggregate };
        }
      }
    });
  }
}
/* v8 ignore stop */
