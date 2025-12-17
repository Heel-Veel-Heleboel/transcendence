import { IArena, PhysicsMesh } from './types';
import {
  ImportMeshAsync,
  Scene,
  Mesh,
  PhysicsShapeType,
  PhysicsAggregate,
  StandardMaterial
} from '@babylonjs/core';

export class Arena implements IArena {
  private _physicsMesh!: PhysicsMesh[];

  public get physicsMesh(): PhysicsMesh[] {
    return this._physicsMesh;
  }

  public set physicsMesh(value: PhysicsMesh[]) {
    this._physicsMesh = value;
  }

  constructor(scene: Scene) {
    this._physicsMesh = [];
    this.initMesh(scene);
  }

  async initMesh(scene: Scene) {
    const model = ImportMeshAsync('/arena.gltf', scene);
    model.then(result => {
      console.log(result);
      for (let i = 1; i < result.meshes.length; i++) {
        const mesh = result.meshes[i] as Mesh;
        mesh.flipFaces(true);
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
        this._physicsMesh.push({ mesh, aggregate });
        console.log(mesh);
        console.log(mesh.getIndices());
        console.log(mesh.getPositionData());
      }
    });
  }
}
