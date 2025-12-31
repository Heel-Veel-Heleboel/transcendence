import { Scene, KeyboardInfo, KeyboardEventTypes } from '@babylonjs/core';
import { IKeyManager } from '../types/types';
import { Player } from '../components/player.ts';
import {
  checkLowerX,
  checkUpperX,
  checkLowerY,
  checkUpperY
} from '../utils/KeyManagerUtils.ts';

export class KeyManager implements IKeyManager {
  public windowFrames: number;
  public buffer: string[];
  public deltaTime: number;
  public actions: Map<string, { x: number; y: number }>;
  public precisionKeys: string;
  public player: Player;
  private getFrameCount: Function;

  constructor(
    scene: Scene,
    frameCountCallback: Function,
    player: Player,
    windowFrames = 10
  ) {
    scene.onKeyboardObservable.add(this.onKeyDown.bind(this));
    this.windowFrames = windowFrames;
    this.deltaTime = 0;
    this.buffer = [];
    this.getFrameCount = frameCountCallback;
    this.player = player;
    this.actions = player.keyGrid.grid;
    this.precisionKeys = player.keyGrid.precisionKeys;
  }

  onKeyDown(kbInfo: KeyboardInfo) {
    if (kbInfo.type !== KeyboardEventTypes.KEYDOWN) return;
    if (this.precisionKeys.includes(kbInfo.event.key)) {
      this.handlePrecisionKey(kbInfo.event.key);
    }
    this.handleKey(kbInfo.event.key);
    this.deltaTime = this.getFrameCount();
  }

  register(sequence: string[], coords: { x: number; y: number }): void {
    if (!sequence.length) return;
    this.actions.set(sequence.join('+'), coords);
  }

  handleKey(key: string): void {
    this.buffer.push(key.toLowerCase());
  }

  handlePrecisionKey(key: string) {
    const index = this.precisionKeys.indexOf(key);
    const xMove = this.player.ratioDiv / 25;
    const yMove = this.player.ratioDiv / 25;
    switch (index) {
      case 0:
        if (checkUpperY(yMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: 0, y: yMove });
        break;
      case 1:
        if (checkLowerX(xMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: -xMove, y: 0 });
        break;
      case 2:
        if (checkLowerY(yMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: 0, y: -yMove });
        break;
      case 3:
        if (checkUpperX(xMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: xMove, y: 0 });
        break;
    }
  }

  resolve() {
    let sequenceKey = this.buffer.join('+');
    let sequencePresent = false;
    if (this.actions.has(sequenceKey)) {
      sequencePresent = true;
    } else if (this.actions.has(sequenceKey.split('').reverse().join(''))) {
      sequencePresent = true;
      sequenceKey = sequenceKey.split('').reverse().join('');
    }
    if (sequencePresent) {
      const coords = this.actions.get(sequenceKey);
      if (coords) this.player.move(coords);
    }
    this.reset();
  }

  reset() {
    this.buffer.length = 0;
    this.deltaTime = 0;
  }
}
