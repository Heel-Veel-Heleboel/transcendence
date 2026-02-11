import { MapSchema, Schema, type } from '@colyseus/schema';

export class Ball extends Schema {
  @type('number') id: number;
  @type('number') x: number;
  @type('number') y: number;
  @type('number') z: number;

  @type('number') xForce: number;
  @type('number') yForce: number;
  @type('number') zForce: number;
}

export class MyRoomState extends Schema {
  @type({ map: Ball }) balls = new MapSchema<Ball>();
}
