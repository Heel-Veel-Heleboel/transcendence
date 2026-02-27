import { MapSchema, Schema, type } from '@colyseus/schema';
import { Ball } from '#entities/Ball.js';
import { Player } from '#rooms/entities/Player.js';

export class GameRoomState extends Schema {
  @type({ map: Ball }) balls = new MapSchema<Ball>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
