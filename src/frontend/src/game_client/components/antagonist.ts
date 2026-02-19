import { PlayerConfig, IAntagonist } from '../types/types.ts';
import { Scene } from '@babylonjs/core';
import { Player } from './player.ts';

/* v8 ignore start */
export class Antagonist extends Player implements IAntagonist {
  constructor(config: PlayerConfig, scene: Scene) {
    super(config, scene);
  }
}
/* v8 ignore stop */
