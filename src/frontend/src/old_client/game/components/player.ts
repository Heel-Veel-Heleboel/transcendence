import { IPlayer, PhysicsMesh, PlayerConfig } from '../types/types.ts';
import { GridMaterial } from '@babylonjs/materials';
import {
  Scene,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  Vector3,
  StandardMaterial,
  PhysicsShapeType
} from '@babylonjs/core';
import earcut from 'earcut';
import { KeyGrid } from '../systems/keyGrid.ts';
import { Hud } from './hud.ts';
import { HitIndicator } from './hitIndicator.ts';
import gameConfig from '../utils/gameConfig.ts';

/* v8 ignore start */
export class Player implements IPlayer {
  public physicsMesh: PhysicsMesh;
  public lifespan: number;
  public goalPosition: Vector3;
  public goalDimensions: Vector3;
  public keyGrid: KeyGrid;
  public keyGridMesh: Mesh;
  public ratioDiv: number;
  public hud: Hud;
  public hitIndicator: HitIndicator;

  constructor(config: PlayerConfig, scene: Scene) {
    this.goalPosition = config.goalPosition;
    this.goalDimensions = config.goalDimensions;
    this.ratioDiv = config.keys.length;
    this.keyGrid = new KeyGrid(config.keys, {
      goalPosition: config.goalPosition,
      goalDimensions: config.goalDimensions
    });
    this.hud = config.hud;
    this.hitIndicator = new HitIndicator(
      this.goalPosition,
      this.goalDimensions.x * 2,
      scene
    );
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
    const aggregate = new PhysicsAggregate(
      padel,
      PhysicsShapeType.MESH,
      { mass: 0, restitution: 1, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh: padel, aggregate };
    this.lifespan = 1000;

    let sideOrientation;
    if (padel.position.z > 0) {
      sideOrientation = Mesh.BACKSIDE;
    } else {
      sideOrientation = Mesh.FRONTSIDE;
    }
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
    const fontData = await (await fetch(gameConfig.hintFontPath)).json();
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
    this.physicsMesh.aggregate.transformNode.position.x += coord.x;
    this.physicsMesh.aggregate.transformNode.position.y += coord.y;
  }

  move(coord: { x: number; y: number }) {
    this.physicsMesh.aggregate.transformNode.position = new Vector3(
      coord.x,
      coord.y,
      this.physicsMesh.aggregate.transformNode.absolutePosition.z
    );
  }

  dispose(): void {
    this.physicsMesh.mesh.dispose();
    this.physicsMesh.aggregate.dispose();
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }
}
/* v8 ignore stop */
