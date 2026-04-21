import { MapSchema, Schema, type } from '@colyseus/schema';
import { Hack } from '#entities/hack.js';
import { Player } from '#rooms/entities/player.js';

export class GameRoomState extends Schema {
  @type({ map: Hack }) hacks = new MapSchema<Hack>();
  @type({ map: Player }) players = new MapSchema<Player>();
}
