import { IArena } from './types';
import {
  AbstractMesh,
  Mesh,
  MeshBuilder,
  ImportMeshAsync,
  Scene,
  PhysicsShapeType,
  PhysicsAggregate,
  PhysicsMotionType,
  Vector3,
  StandardMaterial
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

  constructor(scene: Scene, pos: Vector3, rot: Vector3, rad: number) {
    this.mesh = MeshBuilder.CreateGround(
      'ground',
      { width: 10, height: 10 },
      scene
    );
    this.mesh.position = pos;
    this.mesh.rotate(rot, rad);
    const material = new StandardMaterial('wireframe', scene);
    material.wireframe = true;
    this.mesh.material = material;
    if (this.mesh.material) {
      this.mesh.material.wireframe = true;
    }
    // this.initMesh(scene);
    this.aggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.BOX,
      { mass: 0.0, restitution: 1.0, friction: 0.0 },
      scene
    );
    this.aggregate.body.setAngularDamping(0.0);
    this.aggregate.body.setLinearDamping(0.0);
    console.log(this.aggregate);
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
