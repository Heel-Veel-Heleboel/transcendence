import { Scene, KeyboardInfo, KeyboardEventTypes } from '@babylonjs/core';
import { IKeyManager } from './types';
import { Player } from './player.ts';

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
    // Normalize sequence: ["q","e"] → "q+e"
    this.actions.set(sequence.join('+'), coords);
  }

  handleKey(key: string): void {
    console.log(key);
    this.buffer.push(key.toLowerCase());
  }

  checkUpperY(yMove: number) {
    return (
      this.player.physicsMesh.aggregate.transformNode.absolutePosition.y +
        yMove >=
      this.player.goalPosition.y +
        this.player.goalDimensions.y / 2 -
        this.player.goalDimensions.y / this.player.ratioDiv / 2
    );
  }

  checkUpperX(xMove: number) {
    return (
      this.player.physicsMesh.aggregate.transformNode.absolutePosition.x +
        xMove >=
      this.player.goalPosition.x +
        this.player.goalDimensions.x / 2 -
        this.player.goalDimensions.x / this.player.ratioDiv / 2
    );
  }

  checkLowerY(yMove: number) {
    return (
      this.player.physicsMesh.aggregate.transformNode.absolutePosition.y +
        yMove <=
      this.player.goalPosition.y -
        this.player.goalDimensions.y / 2 +
        this.player.goalDimensions.y / this.player.ratioDiv / 2
    );
  }

  checkLowerX(xMove: number) {
    return (
      this.player.physicsMesh.aggregate.transformNode.absolutePosition.x +
        xMove <=
      this.player.goalPosition.x -
        this.player.goalDimensions.x / 2 +
        this.player.goalDimensions.x / this.player.ratioDiv / 2
    );
  }

  handlePrecisionKey(key: string) {
    const index = this.precisionKeys.indexOf(key);
    const xMove = this.player.ratioDiv / 25;
    const yMove = this.player.ratioDiv / 25;
    switch (index) {
      case 0:
        if (this.checkUpperY(yMove)) {
          break;
        }
        this.player.movePrecise({ x: 0, y: yMove });
        console.log(
          this.player.physicsMesh.aggregate.transformNode.absolutePosition.y
        );
        break;
      case 1:
        if (this.checkLowerX(xMove)) {
          break;
        }
        this.player.movePrecise({ x: -xMove, y: 0 });
        break;
      case 2:
        if (this.checkLowerY(yMove)) {
          break;
        }
        this.player.movePrecise({ x: 0, y: -yMove });
        break;
      case 3:
        if (this.checkUpperX(xMove)) {
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
    console.log('resolve: ' + sequenceKey);

    this.reset();
  }

  reset() {
    this.buffer.length = 0;
    this.deltaTime = 0;
  }
}
