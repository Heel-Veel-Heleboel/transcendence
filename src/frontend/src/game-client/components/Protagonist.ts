import { IProtagonist, IProtagonistConfig } from '../types/Types';
import { GridMaterial } from '@babylonjs/materials';
import {
  Scene,
  Mesh,
  MeshBuilder,
  Vector3,
  StandardMaterial
} from '@babylonjs/core';
import earcut from 'earcut';
import { KeyGrid } from '../systems/KeyGrid';
import { Hud } from './Hud';
import { HitIndicator } from './HitIndicator';
import gameConfig from '../utils/GameConfig';
import { Player } from './Player';
import { Room } from '@colyseus/sdk';

/* v8 ignore start */
export class Protagonist extends Player implements IProtagonist {
  public keyGrid: KeyGrid;
  public keyGridMesh: Mesh;
  public keyGridHints: Mesh[];
  public hud: Hud;
  public hitIndicator: HitIndicator;
  public room: Room;
  public rotation: boolean;

  constructor(config: IProtagonistConfig, scene: Scene) {
    super(config, scene);
    this.hud = config.hud;
    this.room = config.room;
    this.keyGridHints = [];
    this.rotation =
      this.mesh.position.z > 0
        ? Boolean(Mesh.BACKSIDE)
        : Boolean(Mesh.FRONTSIDE);
    this.hitIndicator = new HitIndicator({
      goalPosition: this.goalPosition,
      radius: this.goalDimensions.x * 2,
      rotation: this.rotation,
      scene: scene
    });
    this.keyGrid = new KeyGrid({
      keys: config.keys,
      dimensions: {
        goalPosition: config.goalPosition,
        goalDimensions: config.goalDimensions
      },
      rotation: this.rotation
    });
    this.keyGridMesh = MeshBuilder.CreatePlane(
      gameConfig.keyGridMeshName,
      {
        height: config.goalDimensions.y,
        width: config.goalDimensions.x,
        sideOrientation: Number(this.rotation)
      },
      scene
    );
    this.keyGridMesh.position = config.goalPosition;
    const gridMaterial = new GridMaterial(
      gameConfig.keyGridMaterialName,
      scene
    );
    gridMaterial.opacity = gameConfig.KeyGridMaterialOpacity;
    gridMaterial.majorUnitFrequency = gameConfig.KeyGridMaterialMUF;
    if (this.keyGrid.length % 2) {
      gridMaterial.gridRatio = this.goalDimensions.x / this.ratioDiv;
      const offset = gridMaterial.gridRatio / 2;
      gridMaterial.gridOffset = new Vector3(offset, offset, 0);
    } else {
      gridMaterial.gridRatio = this.goalDimensions.x / this.ratioDiv;
    }
    this.keyGridMesh.material = gridMaterial;
  }

  async initGridHints(scene: Scene) {
    const font = await fetch(gameConfig.hintFontPath);
    const fontData = await font.json();
    this.keyGrid.grid.forEach((values, keys) => {
      const content = keys.replace(gameConfig.keyGridSeperator, '');
      const text = MeshBuilder.CreateText(
        keys + 'Mesh',
        content,
        fontData,
        {
          size:
            this.goalDimensions.x /
            (this.ratioDiv * gameConfig.keyGridRatioMultipler),
          resolution: gameConfig.keyGridTextResolution,
          depth: gameConfig.keyGridTextDepth
        },
        scene,
        earcut
      );
      if (text) {
        text.position = new Vector3(values.x, values.y, this.goalPosition.z);
        text.rotation.y = this.rotation ? Math.PI : 0;
        const material = new StandardMaterial(
          gameConfig.keyGridMaterialName,
          scene
        );
        text.material = material;
        if (text.material) {
          text.material.alpha = gameConfig.keyGridTextMaterialAlpha;
          text.material.backFaceCulling = false;
        }
        this.keyGridHints.push(text);
      }
    });
  }

  movePrecise(coord: { x: number; y: number }) {
    const pos = this.rotation
      ? {
        x: (this.mesh.position.x -= coord.x),
        y: (this.mesh.position.y += coord.y)
      }
      : {
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
