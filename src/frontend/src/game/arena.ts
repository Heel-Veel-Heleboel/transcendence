import { IArena } from './types';
import {
  AbstractMesh,
  Mesh,
  MeshBuilder,
  ImportMeshAsync,
  Scene,
  PhysicsShapeType,
  PhysicsAggregate
} from '@babylonjs/core';

export class Arena implements IArena {
  private _mesh!: AbstractMesh;
  public aggregate: PhysicsAggregate;

  public get mesh(): AbstractMesh {
    return this._mesh;
  }

  public set mesh(value: AbstractMesh) {
    this._mesh = value;
  }

  constructor(scene: Scene) {
    this.mesh = MeshBuilder.CreateGround(
      'ground',
      { width: 10, height: 10 },
      scene
    );
    // this.initMesh(scene);
    this.aggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.BOX,
      { mass: 0 },
      scene
    );
  }

  async initMesh(scene: Scene) {
    const model = ImportMeshAsync('/arena.gltf', scene);
    model.then(result => {
      console.log(result);
      this.mesh = result.meshes[1];
      if (this.mesh.material) {
        this.mesh.material.wireframe = true;
      }
      console.log(this.mesh);
      console.log(this.mesh.getIndices());
      console.log(this.mesh.getPositionData());
    });
  }
}
