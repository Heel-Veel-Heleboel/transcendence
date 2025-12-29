import { IArena, PhysicsMesh } from '../types/types.ts';
import {
  ImportMeshAsync,
  Scene,
  Mesh,
  PhysicsShapeType,
  PhysicsAggregate,
  StandardMaterial
} from '@babylonjs/core';

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
    const model = ImportMeshAsync('/arena.gltf', scene);
    await model.then(result => {
      console.log(result);
      if (result.meshes.length != 4) throw Error('arena wrongly formatted');
      for (let i = 1; i < result.meshes.length; i++) {
        const mesh = result.meshes[i] as Mesh;
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
        this._arena = { mesh, aggregate };
        if (mesh.id === 'goal_1') {
          aggregate.body.setCollisionCallbackEnabled(true);
          this.goal_1 = { mesh, aggregate };
          console.log('here');
        }
        if (mesh.id === 'goal_2') {
          aggregate.body.setCollisionCallbackEnabled(true);
          this.goal_2 = { mesh, aggregate };
        }
      }
      console.log('finished');
    });
  }
}
