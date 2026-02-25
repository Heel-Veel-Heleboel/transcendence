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
    this.hitIndicator = new HitIndicator(
      this.goalPosition,
      this.goalDimensions.x * 2,
      this.rotation,
      scene
    );
    this.keyGrid = new KeyGrid({
      keys: config.keys,
      dimensions: {
        goalPosition: config.goalPosition,
        goalDimensions: config.goalDimensions
      },
      rotation: this.rotation
    });
    this.keyGridMesh = MeshBuilder.CreatePlane(
      'keyGridMesh',
      {
        height: config.goalDimensions.y,
        width: config.goalDimensions.x,
        sideOrientation: Number(this.rotation)
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

  async initGridHints(scene: Scene) {
    const font = await fetch(gameConfig.hintFontPath);
    const fontData = await font.json();
    this.keyGrid.grid.forEach((values, keys) => {
      const content = keys.replace('+', '');
      const text = MeshBuilder.CreateText(
        'myText',
        content,
        fontData,
        {
          size: this.goalDimensions.x / (this.ratioDiv * 4),
          resolution: 20,
          depth: 0.1
        },
        scene,
        earcut
      );
      if (text) {
        text.position = new Vector3(values.x, values.y, this.goalPosition.z);
        text.rotation.y = this.rotation ? Math.PI : 0;
        const material = new StandardMaterial('transparent', scene);
        text.material = material;
        if (text.material) {
          // text.material.wireframe = true;
          text.material.alpha = 0.15;
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
