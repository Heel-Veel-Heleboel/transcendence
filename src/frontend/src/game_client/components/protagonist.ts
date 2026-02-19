import {
  IPlayerConfig,
  IProtagonist,
  IProtagonistConfig
} from '../types/types.ts';
import { GridMaterial } from '@babylonjs/materials';
import { Scene, Mesh, MeshBuilder, Vector3 } from '@babylonjs/core';
import earcut from 'earcut';
import { KeyGrid } from '../systems/keyGrid.ts';
import { Hud } from './hud.ts';
import { HitIndicator } from './hitIndicator.ts';
import gameConfig from '../utils/gameConfig.ts';
import { Player } from './player.ts';
import { Room } from '@colyseus/sdk';

/* v8 ignore start */
export class Protagonist extends Player implements IProtagonist {
  public keyGrid: KeyGrid;
  public keyGridMesh: Mesh;
  public hud: Hud;
  public hitIndicator: HitIndicator;
  public room: Room;
  public rotation: number;

  constructor(config: IProtagonistConfig, scene: Scene) {
    super(config, scene);
    this.hud = config.hud;
    this.room = config.room;
    this.hitIndicator = new HitIndicator(
      this.goalPosition,
      this.goalDimensions.x * 2,
      scene
    );
    let sideOrientation;
    if (this.mesh.position.z > 0) {
      sideOrientation = Mesh.BACKSIDE;
      this.rotation = Math.PI;
    } else {
      sideOrientation = Mesh.FRONTSIDE;
      this.rotation = 0;
    }
    this.keyGrid = new KeyGrid(config.keys, {
      goalPosition: config.goalPosition,
      goalDimensions: config.goalDimensions
    });
    this.keyGridMesh = MeshBuilder.CreatePlane(
      'keyGridMesh',
      {
        height: config.goalDimensions.y,
        width: config.goalDimensions.x,
        sideOrientation: sideOrientation
      },
      scene
    );
    this.keyGridMesh.position = config.goalPosition;
    const gridMaterial = new GridMaterial('grid', scene);
    gridMaterial.opacity = 0.99;
    gridMaterial.majorUnitFrequency = 0.99;
    if (this.keyGrid.length % 2) {
      gridMaterial.gridRatio = this.goalDimensions.x / this.ratioDiv;
      const offset = gridMaterial.gridRatio / 2;
      gridMaterial.gridOffset = new Vector3(offset, offset, 0);
    } else {
      gridMaterial.gridRatio = this.goalDimensions.x / this.ratioDiv;
    }
    this.keyGridMesh.material = gridMaterial;
  }

  async initGridColumnsHints(scene: Scene) {
    const font = await fetch(gameConfig.hintFontPath);
    const fontData = await font.json();
    console.log(fontData);
    for (let i = 0; i < this.keyGrid.length; i++) {
      const text = MeshBuilder.CreateText(
        'myText',
        this.keyGrid.columns.charAt(i),
        fontData,
        {
          size: this.goalDimensions.x / this.ratioDiv,
          resolution: 20,
          depth: 0.1
        },
        scene,
        earcut
      );
      const startPos = this.goalPosition.x - this.goalDimensions.x / 2;
      const xPosIndex = (this.goalDimensions.x / this.ratioDiv) * i;
      const xPosOffset = this.goalDimensions.x / this.ratioDiv / 2;
      const xPos = startPos + xPosIndex + xPosOffset;
      if (text) {
        text.position = new Vector3(
          xPos,
          this.goalPosition.y + this.goalDimensions.y / 2,
          this.goalPosition.z
        );
        text.rotation.y = this.rotation;
      }
      // NOTE: not sure which material is going to used for hints yet, therefore
      // commented out
      // const material = new BABYLON.StandardMaterial('wireframe', scene);
      // text.material = material;
      // if (text.material) {
      //   text.material.wireframe = true;
      // }
    }
  }

  async initGridRowsHints(scene: Scene) {
    const fontData = await (await fetch(gameConfig.hintFontPath)).json();
    for (let i = 0; i < this.keyGrid.length; i++) {
      const text = MeshBuilder.CreateText(
        'myText',
        this.keyGrid.rows.charAt(i),
        fontData,
        {
          size: this.goalDimensions.x / this.ratioDiv,
          resolution: 20,
          depth: 0.1
        },
        scene,
        earcut
      );
      const startPos = this.goalPosition.y + this.goalDimensions.y / 2;
      const yPosIndex = (this.goalDimensions.y / this.ratioDiv) * i;
      const yPosOffset = this.goalDimensions.y / this.ratioDiv;
      const yPos = startPos - yPosIndex - yPosOffset;
      if (text) {
        text.position = new Vector3(
          this.goalPosition.x -
            this.goalDimensions.x / 2 -
            this.goalDimensions.x / this.ratioDiv / 2,
          yPos,
          this.goalPosition.z
        );
        text.rotation.y = this.rotation;
      }
      // NOTE: not sure which material is going to used for hints yet, therefore
      // commented out
      // const material = new StandardMaterial('wireframe', scene);
      // text.material = material;
      // if (text.material) {
      //   text.material.wireframe = true;
      // }
    }
  }

  movePrecise(coord: { x: number; y: number }) {
    const pos = {
      x: (this.mesh.position.x += coord.x),
      y: (this.mesh.position.y += coord.y)
    };
    this.room.send('set-position', pos);
  }

  move(coord: { x: number; y: number }) {
    this.room.send('set-position', coord);
  }
}
/* v8 ignore stop */
