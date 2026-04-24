import { IPlayer, IPlayerConfig } from '../types/Types';
import { Scene, AbstractMesh, Vector3, Color4 } from '@babylonjs/core';
import gameConfig from '../utils/GameConfig';
import { createBox, createVector3 } from '../utils/Create';

/* v8 ignore start */
export class Player implements IPlayer {
  public mesh: AbstractMesh;
  public lifespan: number;
  public score: number;
  public mana: number;
  public powerShots: number;
  public goalPosition: Vector3;
  public goalDimensions: Vector3;
  public ratioDiv: number;
  public username: string;

  constructor(config: IPlayerConfig, scene: Scene) {
    this.goalPosition = config.goalPosition;
    this.goalDimensions = config.goalDimensions;
    this.ratioDiv = config.keys.length;
    const player = createBox(
      gameConfig.playerMeshName,
      {
        height: config.goalDimensions.y / this.ratioDiv,
        width: config.goalDimensions.x / this.ratioDiv,
        depth: config.goalDimensions.z / this.ratioDiv
      },
      scene
    );
    player.isPickable = false;
    player.position = createVector3(
      config.goalPosition.x,
      config.goalPosition.y,
      config.goalPosition.z
    );
    player.visibility = 0.2;
    player.enableEdgesRendering();
    player.edgesWidth = 4.0;
    player.edgesColor = new Color4(0, 1, 1, 1);
    this.mesh = player;
    this.lifespan = 100;
    this.mana = 0;
    this.score = 0;
    this.powerShots = 0;
    this.username = config.username;
  }

  dispose(): void {
    this.mesh.dispose();
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }
}
/* v8 ignore stop */
