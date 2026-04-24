import { IArena } from '../types/Types';
import {
  ImportMeshAsync,
  AbstractMesh,
  Scene,
  Mesh,
  StandardMaterial,
  Color4
} from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import Errors from '../utils/Error';
import { createStandardMaterial } from '../utils/Create';

/* v8 ignore start */
export class Arena implements IArena {
  private _arena!: AbstractMesh;
  private _goal_1!: AbstractMesh;
  private _goal_2!: AbstractMesh;

  constructor() {}

  async initMesh(scene: Scene) {
    const model = this.importMesh(scene);

    await model
      .then(result => {
        if (result.meshes.length !== gameConfig.arenaMeshesCount)
          throw Error(Errors.INVALID_ARENA_FORMAT);
        const material = createStandardMaterial(
          gameConfig.arenaMaterialName,
          scene
        );
        for (const index of result.meshes) {
          this.configureMesh(index as Mesh, material);
        }
        for (const key in this) {
          if (typeof this[key] === 'undefined') {
            throw new Error(Errors.MISSING_ARENA_MESH);
          }
        }
      })
      .catch(error => {
        console.error(error);
        throw new Error(Errors.FAILED_ARENA_IMPORT);
      });
  }

  private importMesh(scene: Scene) {
    try {
      const model = ImportMeshAsync(gameConfig.arenaImportpath, scene);
      return model;
    } catch (e: any) {
      console.error(e);
      throw new Error(Errors.FAILED_ARENA_IMPORT);
    }
  }

  private configureMesh(mesh: Mesh, material: StandardMaterial) {
    if (mesh.id === gameConfig.rootMesh) return; // we don't need to change root
    if (mesh.id === gameConfig.areneId) {
      mesh.flipFaces(true);
    }
    mesh.material = material;
    if (mesh.id === gameConfig.areneId) {
      mesh.isPickable = false;
      mesh.visibility = 0.2;
      mesh.enableEdgesRendering();
      mesh.edgesWidth = 4.0;
      mesh.edgesColor = new Color4(0, 0, 1, 1);
      this._arena = mesh;
    } else if (mesh.id === gameConfig.goalId1) {
      mesh.isPickable = true;
      mesh.visibility = 0.2;
      mesh.enableEdgesRendering();
      mesh.edgesWidth = 4.0;
      mesh.edgesColor = new Color4(1, 0, 1, 1);
      if (mesh.position.z < 0) {
        mesh.sideOrientation = 1;
      }
      this.goal_1 = mesh;
    } else if (mesh.id === gameConfig.goalId2) {
      mesh.isPickable = true;
      mesh.visibility = 0.2;
      mesh.enableEdgesRendering();
      mesh.edgesWidth = 4.0;
      mesh.edgesColor = new Color4(1, 1, 0, 1);
      mesh.isPickable = true;
      if (mesh.position.z < 0) {
        mesh.sideOrientation = 1;
      }
      this.goal_2 = mesh;
    }
  }

  public get arena(): AbstractMesh {
    return this._arena;
  }

  private set arena(value: AbstractMesh) {
    this._arena = value;
  }

  public get goal_1(): AbstractMesh {
    return this._goal_1;
  }

  private set goal_1(value: AbstractMesh) {
    this._goal_1 = value;
  }

  public get goal_2(): AbstractMesh {
    return this._goal_2;
  }

  private set goal_2(value: AbstractMesh) {
    this._goal_2 = value;
  }
}
/* v8 ignore stop */
