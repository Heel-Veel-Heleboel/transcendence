import { IArena } from '../types/Types';
import {
  ImportMeshAsync,
  AbstractMesh,
  Scene,
  Mesh,
  StandardMaterial
} from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import Errors from '../utils/Error';

/* v8 ignore start */
export class Arena implements IArena {
  public _arena!: AbstractMesh;
  public _goal_1!: AbstractMesh;
  public _goal_2!: AbstractMesh;

  public get arena(): AbstractMesh {
    return this._arena;
  }

  public set arena(value: AbstractMesh) {
    this._arena = value;
  }

  public get goal_1(): AbstractMesh {
    return this._goal_1;
  }

  public set goal_1(value: AbstractMesh) {
    this._goal_1 = value;
  }

  public get goal_2(): AbstractMesh {
    return this._goal_2;
  }

  public set goal_2(value: AbstractMesh) {
    this._goal_2 = value;
  }

  constructor() {}

  async initMesh(scene: Scene) {
    const model = ImportMeshAsync(gameConfig.arenaImportpath, scene);

    await model
      .then(result => {
        if (result.meshes.length !== gameConfig.arenaMeshesCount)
          throw Error(Errors.INVALID_ARENA_FORMAT);
        const material = new StandardMaterial(
          gameConfig.arenaMaterialName,
          scene
        );
        material.wireframe = true;
        for (const index of result.meshes) {
          this.configureMesh(index as Mesh, material);
        }
      })
      .catch(error => {
        console.error('failed to import arena mesh');
        console.error(error);
      });
  }

  configureMesh(mesh: Mesh, material: StandardMaterial) {
    if (mesh.id === gameConfig.rootMesh) return; // we don't need to change root
    if (mesh.id === gameConfig.areneId) {
      mesh.flipFaces(true);
    }
    mesh.material = material;
    if (mesh.material) {
      mesh.material.wireframe = true;
    }
    if (mesh.id === gameConfig.areneId) {
      this._arena = mesh;
    } else if (mesh.id === gameConfig.goalId1) {
      this.goal_1 = mesh;
    } else if (mesh.id === gameConfig.goalId2) {
      this.goal_2 = mesh;
    }
  }
}
/* v8 ignore stop */
