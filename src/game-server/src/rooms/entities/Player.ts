import { IPlayer, IPlayerConfig, PhysicsMesh } from '#types/Common.js';
import { Schema, type } from '@colyseus/schema';
import {
  Scene,
  Vector3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType
} from '@babylonjs/core';

/* v8 ignore start */
export class Player extends Schema implements IPlayer {
  @type('number') posX: number;
  @type('number') posY: number;
  @type('number') posZ: number;
  @type('number') dimX: number;
  @type('number') dimY: number;
  @type('number') dimZ: number;
  @type('string') columns: string;
  @type('string') rows: string;
  @type('string') precisionKeys: string;
  @type('number') keyLength: number;
  @type('number') lifespan: number;
  @type('number') mana: number;

  public physicsMesh: PhysicsMesh;
  public goalPosition: Vector3;
  public goalDimensions: Vector3;
  public ratioDiv: number;

  constructor(config: IPlayerConfig, scene: Scene) {
    super();
    this.columns = config.keys.columns;
    this.rows = config.keys.rows;
    this.keyLength = config.keys.length;
    this.precisionKeys = config.keys.precisionKeys;
    this.goalPosition = config.goalPosition;
    this.goalDimensions = config.goalDimensions;
    this.dimX = this.goalDimensions.x;
    this.dimY = this.goalDimensions.y;
    this.dimZ = this.goalDimensions.z;
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
    const aggregate = new PhysicsAggregate(
      padel,
      PhysicsShapeType.MESH,
      { mass: 0, restitution: 1, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);
    this.physicsMesh = { mesh: padel, aggregate: aggregate };
    this.lifespan = 1000;
    this.mana = 0;
  }

  move(coord: { x: number; y: number }) {
    this.physicsMesh.mesh.position = new Vector3(
      coord.x,
      coord.y,
      this.physicsMesh.mesh.absolutePosition.z
    );
  }

  decreaseLife(amount: number): void {
    this.lifespan = this.lifespan - amount;
  }

  update(): void {
    this.posX = this.physicsMesh.mesh.absolutePosition.x;
    this.posY = this.physicsMesh.mesh.absolutePosition.y;
    this.posZ = this.physicsMesh.mesh.absolutePosition.z;
  }

  dispose(): void {
    this.physicsMesh.mesh.dispose();
    this.physicsMesh.aggregate.dispose();
  }
}
/* v8 ignore stop */
