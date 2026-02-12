import { IArena, PhysicsMesh } from '#types/Common.js';
import {
  ImportMeshAsync,
  Scene,
  Mesh,
  PhysicsShapeType,
  PhysicsAggregate,
  StandardMaterial
} from '@babylonjs/core';

/* v8 ignore start */
export class Arena implements IArena {
  public _arena!: PhysicsMesh;
  public _goal_1!: PhysicsMesh;
  public _goal_2!: PhysicsMesh;

  constructor() {}

  async initMesh(scene: Scene) {
    const model = ImportMeshAsync('#public/arena.gltf', scene);
    await model
      .then(result => {
        if (result.meshes.length !== 4) throw Error('invalid format');
        for (const index of result.meshes) {
          const mesh = index as Mesh;
          if (mesh.id === '__root__') continue;
          if (mesh.id === 'arena') {
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
          if (mesh.id === 'arena') {
            this._arena = { mesh, aggregate };
          } else if (mesh.id === 'goal_1') {
            aggregate.body.setCollisionCallbackEnabled(true);
            this.goal_1 = { mesh, aggregate };
          } else if (mesh.id === 'goal_2') {
            aggregate.body.setCollisionCallbackEnabled(true);
            this.goal_2 = { mesh, aggregate };
          }
        }
      })
      .catch(error => {
        console.error('failed to import arena mesh');
        console.error(error);
      });
  }

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
}
/* v8 ignore stop */
