import {
  KeyboardInfo,
  KeyboardEventTypes,
  UniversalCamera,
  Vector3
} from '@babylonjs/core';
import { IKeyManager } from '../types/Types.ts';
import {
  checkLeft,
  checkRight,
  checkDown,
  checkUp
} from '../utils/KeyManagerUtils.ts';
import gameConfig from '../utils/GameConfig.ts';
import { Protagonist } from '../components/Protagonist.ts';
import { GameClient } from './GameClient.ts';

/* v8 ignore start */
export class KeyManager implements IKeyManager {
  public client: GameClient;
  public windowFrames: number;
  public buffer: string[];
  public deltaTime: number;
  public actions: Map<string, { x: number; y: number }>;
  private powerMoves: string;
  private gameMode: string;
  public precisionKeys: string;
  public cameraPositions: string;
  public player: Protagonist;
  private getFrameCount: Function;
  public precisionMove: number;

  constructor(
    client: GameClient,
    frameCountCallback: Function,
    player: Protagonist,
    gameMode: string,
    windowFrames = 7
  ) {
    this.client = client;
    this.client.scene.onKeyboardObservable.add(this.onKeyDown.bind(this));
    this.windowFrames = windowFrames;
    this.gameMode = gameMode;
    this.deltaTime = 0;
    this.buffer = [];
    this.getFrameCount = frameCountCallback;
    this.player = player;
    this.actions = player.keyGrid.grid;
    this.powerMoves = '1234';
    this.cameraPositions = '56789';
    this.precisionKeys = player.keyGrid.precisionKeys;
    this.precisionMove = player.ratioDiv / gameConfig.handlePrecisionRatio;
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
    this.actions.set(sequence.join(gameConfig.keyGridSeperator), coords);
  }

  handleKey(key: string): void {
    this.buffer.push(key.toLowerCase());
  }

  handlePrecisionKey(key: string) {
    const keys = this.precisionKeys.split(gameConfig.keyGridPrecisionSeperator);
    const index = keys.indexOf(key);
    switch (index) {
      case 0:
        if (checkUp(this.precisionMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: 0, y: this.precisionMove });
        break;
      case 1:
        if (checkDown(this.precisionMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: 0, y: -this.precisionMove });
        break;
      case 2:
        if (checkLeft(this.precisionMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: -this.precisionMove, y: 0 });
        break;
      case 3:
        if (checkRight(this.precisionMove, this.player)) {
          break;
        }
        this.player.movePrecise({ x: this.precisionMove, y: 0 });
        break;
    }
  }

  resolve() {
    let sequenceKey = this.buffer.join('+');
    let sequencePresent = false;
    console.log(sequenceKey);
    if (this.gameMode === 'powerup' && this.powerMoves.includes(sequenceKey)) {
      this.powerMove(sequenceKey);
      this.reset();
      return;
    }
    if (this.cameraPositions.includes(sequenceKey)) {
      this.moveGoalCamera(sequenceKey);
      this.reset();
      return;
    }
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

  moveGoalCamera(move: string) {
    const camera = this.client.goalCamera as UniversalCamera;
    const direction = this.client.goalCamera.position.z > 0 ? true : false;
    if (move === '5') {
      //
    }
    if (move === '6') {
      camera.position = this.client.goalCameraPositions[0];
      const z = direction ? 100 : -100;
      const target = new Vector3(0, 0, z);
      camera.setTarget(target);
    }
    if (move === '7') {
      camera.position = this.client.goalCameraPositions[1];
      const z = direction ? 66 : -66;
      const target = new Vector3(0, 0, z);
      camera.setTarget(target);
    }
    if (move === '8') {
      camera.position = this.client.goalCameraPositions[2];
      const x = direction ? 80 : -80;
      const target = new Vector3(x, 0, 0);
      camera.setTarget(target);
    }
    if (move === '9') {
      camera.position = this.client.goalCameraPositions[3];
      const z = direction ? 66 : -66;
      const target = new Vector3(0, 0, z);
      camera.setTarget(target);
    }
  }

  powerMove(move: string) {
    this.player.powerMove(move);
  }

  reset() {
    this.buffer.length = 0;
    this.deltaTime = 0;
  }
}
/* v8 ignore stop */
