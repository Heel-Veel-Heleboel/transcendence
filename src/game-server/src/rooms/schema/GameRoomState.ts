import { MapSchema, Schema, type } from '@colyseus/schema';
import { Ball } from '#entities/Ball.js';

export class GameRoomState extends Schema {
  @type({ map: Ball }) balls = new MapSchema<Ball>();
}
