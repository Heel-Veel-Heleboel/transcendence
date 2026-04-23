import { Schema, type } from '@colyseus/schema';
import {
  Scene,
  Vector3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType
} from '@babylonjs/core';
import { IPlayer, IPlayerConfig } from '#types/player.js';
import { PhysicsMesh } from '#types/physics.js';

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
  @type('number') score: number;
  @type('number') powerShots: number;
  @type('boolean') connected: boolean;
  @type('string') username: string;

  public physicsMesh: PhysicsMesh;
  public goalPosition: Vector3;
  public goalDimensions: Vector3;
  public ratioDiv: number;
  public isHost: boolean;
  public isDead: boolean;
  public manaRegen: number;
  public isImmun: boolean;

  constructor(config: IPlayerConfig, username: string, scene: Scene) {
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
    this.isHost = config.isHost;

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
    padel.position.addInPlace(new Vector3(0, 0, 1));

    const aggregate = new PhysicsAggregate(
      padel,
      PhysicsShapeType.MESH,
      { mass: 0, restitution: 1, friction: 0.0 },
      scene
    );
    aggregate.body.setAngularDamping(0.0);
    aggregate.body.setLinearDamping(0.0);

    this.physicsMesh = { mesh: padel, aggregate: aggregate };
    this.posX = this.physicsMesh.mesh.absolutePosition.x;
    this.posY = this.physicsMesh.mesh.absolutePosition.y;
    this.posZ = this.physicsMesh.mesh.absolutePosition.z;
    this.lifespan = 100;
    this.mana = 0;
    this.manaRegen = 0.01;
    this.score = 0;
    this.connected = true;
    this.isDead = false;
    this.username = username;
  }

  move(coord: { x: number; y: number }) {
    this.physicsMesh.mesh.position = new Vector3(
      coord.x,
      coord.y,
      this.physicsMesh.mesh.absolutePosition.z
    );
  }

  updateMana(n: number): void {
    if (this.isDead) {
      return;
    }
    let newValue = this.mana + n;
    if (this.isOverflow(newValue)) {
      newValue = 100;
    }
    if (newValue < 0) {
      newValue = 0;
      this.isDead = true;
    }
    this.mana = newValue;
  }

  updateLife(n: number): void {
    if (this.isDead) {
      return;
    }
    let newValue = this.lifespan + n;
    if (this.isOverflow(newValue)) {
      newValue = 100;
    }
    if (newValue <= 0) {
      newValue = 0;
      this.isDead = true;
    }
    this.lifespan = newValue;
  }

  updateScore(n: number): void {
    this.score += n;
  }

  updateManaRegen(n: number) {
    this.manaRegen = n;
  }

  isOverflow(n: number): boolean {
    if (n > 100) {
      return true;
    }
    return false;
  }

  update(): void {
    this.posX = this.physicsMesh.mesh.absolutePosition.x;
    this.posY = this.physicsMesh.mesh.absolutePosition.y;
    this.posZ = this.physicsMesh.mesh.absolutePosition.z;
  }

  powerup1() {
    this.updateLife(20);
    this.updateMana(-20);
  }

  powerup2() {
    this.updateManaRegen(0.02);
    this.updateMana(-50);
  }

  powerup2Reset() {
    this.updateManaRegen(0.01);
  }

  powerup3() {
    this.isImmun = true;
    this.updateMana(-75);
  }

  powerup3Reset() {
    this.isImmun = false;
  }

  powerup4() {
    console.log('powerup4');
    this.updateMana(-100);
    this.powerShots = 5;
  }

  powerup4Shot() {
    if (this.powerShots > 0) {
      this.powerShots--;
    }
  }

  dispose(): void {
    this.physicsMesh.mesh.dispose();
    this.physicsMesh.aggregate.dispose();
  }
}
/* v8 ignore stop */
