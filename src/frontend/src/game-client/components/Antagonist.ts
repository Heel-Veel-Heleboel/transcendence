import { IAntagonist, IPlayerConfig } from '../types/Types';
import { Scene } from '@babylonjs/core';
import { Player } from './Player';

/* v8 ignore start */
export class Antagonist extends Player implements IAntagonist {
  constructor(config: IPlayerConfig, scene: Scene) {
    super(config, scene);
  }
}
/* v8 ignore stop */
