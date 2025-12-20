import { IPlayer, PhysicsMesh } from './types.ts';
import { GridMaterial } from '@babylonjs/materials';
import * as BABYLON from '@babylonjs/core';
import earcut from 'earcut';
import { KeyGrid } from './KeyGrid.ts';

export class Player implements IPlayer {
  public physicsMesh: PhysicsMesh;
  public lifespan: number;
  public goalPosition: BABYLON.Vector3;
  public goalDimensions: BABYLON.Vector3;
  public keyGrid: KeyGrid;
  public keyGridMesh: BABYLON.Mesh;
  public ratioDiv: number;

  constructor(
    goalPosition: BABYLON.Vector3,
    goalDimensions: BABYLON.Vector3,
    keyGrid: KeyGrid,
    scene: BABYLON.Scene
  ) {
    this.goalPosition = goalPosition;
    this.goalDimensions = goalDimensions;
    this.keyGrid = keyGrid;
    this.ratioDiv = keyGrid.length;
    const mesh = BABYLON.MeshBuilder.CreateBox(
      'padel',
      {
        height: goalDimensions.y / this.ratioDiv,
        width: goalDimensions.x / this.ratioDiv,
        depth: goalDimensions.z / this.ratioDiv
      },
      scene
    );
    mesh.position = new BABYLON.Vector3(
      goalPosition.x,
      goalPosition.y,
      goalPosition.z
    );
    mesh.position.addInPlace(
      new BABYLON.Vector3(0, 0, (mesh.position.z / 20) * -1)
    );
    const material = new BABYLON.StandardMaterial('wireframe', scene);
    material.wireframe = true;
    mesh.material = material;
    if (mesh.material) {
      mesh.material.wireframe = true;
    }
    const aggregate = new BABYLON.PhysicsAggregate(
      mesh,
      BABYLON.PhysicsShapeType.MESH,
      { mass: 0, restitution: 1, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh, aggregate };
    this.lifespan = 1000;

    let sideOrientation;
    if (mesh.position.z > 0) {
      sideOrientation = BABYLON.Mesh.BACKSIDE;
    } else {
      sideOrientation = BABYLON.Mesh.FRONTSIDE;
    }
    this.keyGridMesh = BABYLON.MeshBuilder.CreatePlane(
      'keyGridMesh',
      {
        height: goalDimensions.y,
        width: goalDimensions.x,
        sideOrientation: sideOrientation
      },
      scene
    );
    this.keyGridMesh.position = goalPosition;
    this.keyGridMesh.material = new GridMaterial('grid', scene);
    this.keyGridMesh.material.opacity = 0.99;
    this.keyGridMesh.material.majorUnitFrequency = 0.99;
    console.log(this.goalDimensions.x);
    if (keyGrid.length % 2) {
      this.keyGridMesh.material.gridRatio =
        this.goalDimensions.x / this.ratioDiv;
      const offset = this.keyGridMesh.material.gridRatio / 2;
      this.keyGridMesh.material.gridOffset = new BABYLON.Vector3(
        offset,
        offset,
        0
      );
    } else {
      this.keyGridMesh.material.gridRatio =
        this.goalDimensions.x / this.ratioDiv;
    }
  }

  async initGridColumnsHints(scene: BABYLON.Scene) {
    const fontData = await (
      await fetch('../../public/Monofett_Regular.json')
    ).json(); // Providing you have a font data file at that location
    for (let i = 0; i < this.keyGrid.length; i++) {
      const text = BABYLON.MeshBuilder.CreateText(
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
      text.position = new BABYLON.Vector3(
        xPos,
        this.goalPosition.y + this.goalDimensions.y / 2,
        this.goalPosition.z
      );
      const material = new BABYLON.StandardMaterial('wireframe', scene);
      // text.material = material;
      // if (text.material) {
      //   text.material.wireframe = true;
      // }
    }
  }

  async initGridRowsHints(scene: BABYLON.Scene) {
    const fontData = await (
      await fetch('../../public/Monofett_Regular.json')
    ).json(); // Providing you have a font data file at that location
    for (let i = 0; i < this.keyGrid.length; i++) {
      const text = BABYLON.MeshBuilder.CreateText(
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
      text.position = new BABYLON.Vector3(
        this.goalPosition.x -
          this.goalDimensions.x / 2 -
          this.goalDimensions.x / this.ratioDiv / 2,
        yPos,
        this.goalPosition.z
      );
      const material = new BABYLON.StandardMaterial('wireframe', scene);
      // text.material = material;
      // if (text.material) {
      //   text.material.wireframe = true;
      // }
    }
  }

  dispose(): void {
    this.physicsMesh.mesh.dispose();
    this.physicsMesh.aggregate.dispose();
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }
}
