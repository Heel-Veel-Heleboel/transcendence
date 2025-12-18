import { Scene, KeyboardInfo, KeyboardEventTypes } from '@babylonjs/core';
import { IKeyManager } from './types';

export class KeyManager implements IKeyManager {
  public windowFrames: number;
  public buffer: string[];
  public deltaTime: number;
  public actions: Map<string, Function>;
  private getFrameCount: Function;

  constructor(scene: Scene, frameCountCallback: Function, windowFrames = 50) {
    scene.onKeyboardObservable.add(this.onKeyDown.bind(this));
    this.windowFrames = windowFrames;
    this.deltaTime = 0;
    this.buffer = [];
    this.actions = new Map();
    this.getFrameCount = frameCountCallback;
  }

  onKeyDown(kbInfo: KeyboardInfo) {
    if (kbInfo.type !== KeyboardEventTypes.KEYDOWN) return;
    this.handleKey(kbInfo.event.key);
    this.deltaTime = this.getFrameCount();
  }

  register(sequence: string[], callback: Function): void {
    // Normalize sequence: ["q","e"] → "q+e"
    this.actions.set(sequence.join('+'), callback);
  }

  handleKey(key: string): void {
    this.buffer.push(key.toLowerCase());
  }

  resolve() {
    const sequenceKey = this.buffer.join('+');

    if (this.actions.has(sequenceKey)) {
      const callback = this.actions.get(sequenceKey);
      if (callback) callback();
    }
    console.log('resolve: ' + sequenceKey);

    this.reset();
  }

  reset() {
    this.buffer.length = 0;
    this.deltaTime = 0;
  }
}
