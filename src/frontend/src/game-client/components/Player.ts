import { IPlayer, IPlayerConfig } from '../types/Types';
import {
  Scene,
  MeshBuilder,
  AbstractMesh,
  Vector3,
  StandardMaterial
} from '@babylonjs/core';

/* v8 ignore start */
export class Player implements IPlayer {
  public mesh: AbstractMesh;
  public lifespan: number;
  public mana: number;
  public goalPosition: Vector3;
  public goalDimensions: Vector3;
  public ratioDiv: number;

  constructor(config: IPlayerConfig, scene: Scene) {
    this.goalPosition = config.goalPosition;
    this.goalDimensions = config.goalDimensions;
    this.ratioDiv = config.keys.length;
    const padel = MeshBuilder.CreateBox(
      'padel',
      {
        height: config.goalDimensions.y / this.ratioDiv,
        width: config.goalDimensions.x / this.ratioDiv,
        depth: config.goalDimensions.z / this.ratioDiv
      },
      scene
    );
    padel.position = new Vector3(
      config.goalPosition.x,
      config.goalPosition.y,
      config.goalPosition.z
    );
    padel.position.addInPlace(new Vector3(0, 0, (padel.position.z / 20) * -1));
    const material = new StandardMaterial('wireframe', scene);
    material.wireframe = true;
    padel.material = material;
    if (padel.material) {
      padel.material.wireframe = true;
    }
    this.mesh = padel;
    this.lifespan = 1000;
    this.mana = 0;
  }

  dispose(): void {
    this.mesh.dispose();
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }
}
/* v8 ignore stop */
