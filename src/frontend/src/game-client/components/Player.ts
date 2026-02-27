import { IPlayer, IPlayerConfig } from '../types/Types';
import {
  Scene,
  MeshBuilder,
  AbstractMesh,
  Vector3,
  StandardMaterial
} from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';

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
    const player = MeshBuilder.CreateBox(
      gameConfig.playerMeshName,
      {
        height: config.goalDimensions.y / this.ratioDiv,
        width: config.goalDimensions.x / this.ratioDiv,
        depth: config.goalDimensions.z / this.ratioDiv
      },
      scene
    );
    player.position = new Vector3(
      config.goalPosition.x,
      config.goalPosition.y,
      config.goalPosition.z
    );
    const material = new StandardMaterial(gameConfig.playerMaterialName, scene);
    material.wireframe = true;
    player.material = material;
    this.mesh = player;
    this.lifespan = gameConfig.playerLifespanStart;
    this.mana = gameConfig.playerManaStart;
  }

  dispose(): void {
    this.mesh.dispose();
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }
}
/* v8 ignore stop */
