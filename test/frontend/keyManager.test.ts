import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  Scene,
  NullEngine,
  KeyboardInfo,
  KeyboardEventTypes
} from '@babylonjs/core';
import { KeyManager } from '../../src/frontend/src/game/systems/keyManager.ts';
import * as KeyManagerUtils from '../../src/frontend/src/game/utils/KeyManagerUtils.ts';

const Player = vi.fn();
Player.prototype.movePrecise = vi.fn(
  (args: { x: number; y: number }) => `${args.x}, and ${args.y}`
);
Player.prototype.move = vi.fn((coords: string) => coords);
Player.prototype.keyGrid = vi.fn();
Player.prototype.keyGrid.grid = new Map([['q+a', { x: 0, y: 0 }]]);
Player.prototype.keyGrid.precisionKeys = 'WASD';
Player.prototype.goalDimensions = vi.fn();
Player.prototype.goalDimensions.x = 0;
Player.prototype.goalDimensions.y = 0;
Player.prototype.goalPosition = vi.fn();
Player.prototype.goalPosition.x = 0;
Player.prototype.goalPosition.y = 0;
Player.prototype.physicsMesh = vi.fn();
Player.prototype.physicsMesh.aggregate = vi.fn();
Player.prototype.physicsMesh.aggregate.transformNode = vi.fn();
Player.prototype.physicsMesh.aggregate.transformNode.absolutePosition = vi.fn();
Player.prototype.physicsMesh.aggregate.transformNode.absolutePosition.x = 10;
Player.prototype.physicsMesh.aggregate.transformNode.absolutePosition.y = 10;

describe('KeyManager', () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const callback = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructor', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);

    expect(keyManager.deltaTime).toEqual(0);
    expect(keyManager.buffer).toEqual(new Array());
    expect(keyManager.player).toEqual(player);
    expect(keyManager.actions).toEqual(player.keyGrid.grid);
    expect(keyManager.precisionKeys).toEqual(player.keyGrid.precisionKeys);
  });

  it('onKeyDown - wrong KeyboardEventType', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const kInfo = new KeyboardInfo(KeyboardEventTypes.KEYUP, {
      altKey: false,
      code: 'code',
      ctrlKey: false,
      inputIndex: 0,
      key: 'a',
      keyCode: 26,
      metaKey: false,
      preventDefault: () => {},
      shiftKey: false,
      target: false,
      type: 'type'
    });
    const spy = vi.spyOn(keyManager, 'handleKey');

    keyManager.onKeyDown(kInfo);

    expect(spy).not.toHaveBeenCalled();
  });

  it('onKeyDown - precisionKeys', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const kInfo = new KeyboardInfo(KeyboardEventTypes.KEYDOWN, {
      altKey: false,
      code: 'code',
      ctrlKey: false,
      inputIndex: 0,
      key: 'A',
      keyCode: 26,
      metaKey: false,
      preventDefault: () => {},
      shiftKey: false,
      target: false,
      type: 'type'
    });
    const spy = vi.spyOn(keyManager, 'handlePrecisionKey');

    keyManager.onKeyDown(kInfo);
    expect(spy).toHaveBeenCalledWith(kInfo.event.key);
  });

  it('onKeyDown - deltaTime', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const kInfo = new KeyboardInfo(KeyboardEventTypes.KEYDOWN, {
      altKey: false,
      code: 'code',
      ctrlKey: false,
      inputIndex: 0,
      key: 'A',
      keyCode: 26,
      metaKey: false,
      preventDefault: () => {},
      shiftKey: false,
      target: false,
      type: 'type'
    });

    keyManager.onKeyDown(kInfo);

    expect(callback).toHaveBeenCalled();
  });

  it('register - zero keys', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = [];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);

    expect(keyManager.actions.get(sequence.join('+'))).toEqual(undefined);
  });

  it('register - one key', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = ['q'];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);

    expect(keyManager.actions.get(sequence.join('+'))).toEqual(coords);
  });

  it('register - two keys', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = ['q', 'a'];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);

    expect(keyManager.actions.get(sequence.join('+'))).toEqual(coords);
  });

  it('register - three keys', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = ['q', 'a', 'c'];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);

    expect(keyManager.actions.get(sequence.join('+'))).toEqual(coords);
  });

  it('handleKey - add to empty buffer', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = 'a';

    keyManager.handleKey(key);

    expect(keyManager.buffer).toEqual(new Array(key));
  });

  it('handleKey - add to non-empty buffer', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const firstKey = 'a';
    const secondKey = 'b';

    keyManager.handleKey(firstKey);
    keyManager.handleKey(secondKey);

    expect(keyManager.buffer).toEqual(new Array(firstKey, secondKey));
  });

  it('handlePrecisionKey - case 0', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(0);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).toHaveBeenCalled();
    expect(spyLowerX).not.toHaveBeenCalled();
    expect(spyLowerY).not.toHaveBeenCalled();
    expect(spyUpperX).not.toHaveBeenCalled();
    expect(player.movePrecise).toHaveBeenCalledWith({
      x: 0,
      y: keyManager.precisionMove
    });
  });

  it('handlePrecisionKey - case 1', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(1);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).not.toHaveBeenCalled();
    expect(spyLowerX).toHaveBeenCalled();
    expect(spyLowerY).not.toHaveBeenCalled();
    expect(spyUpperX).not.toHaveBeenCalled();
    expect(player.movePrecise).toHaveBeenCalledWith({
      x: -keyManager.precisionMove,
      y: 0
    });
  });

  it('handlePrecisionKey - case 2', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(2);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).not.toHaveBeenCalled();
    expect(spyLowerX).not.toHaveBeenCalled();
    expect(spyLowerY).toHaveBeenCalled();
    expect(spyUpperX).not.toHaveBeenCalled();
    expect(player.movePrecise).toHaveBeenCalledWith({
      x: 0,
      y: -keyManager.precisionMove
    });
  });

  it('handlePrecisionKey - case 3', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(3);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).not.toHaveBeenCalled();
    expect(spyLowerX).not.toHaveBeenCalled();
    expect(spyLowerY).not.toHaveBeenCalled();
    expect(spyUpperX).toHaveBeenCalled();
    expect(player.movePrecise).toHaveBeenCalledWith({
      x: keyManager.precisionMove,
      y: 0
    });
  });

  it('handlePrecisionKey - case 0 - break', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(0);
    const spyUpperY = vi
      .spyOn(KeyManagerUtils, 'checkUpperY')
      .mockImplementation(() => {
        return true;
      });
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).toHaveBeenCalled();
    expect(spyLowerX).not.toHaveBeenCalled();
    expect(spyLowerY).not.toHaveBeenCalled();
    expect(spyUpperX).not.toHaveBeenCalled();
    expect(player.movePrecise).not.toHaveBeenCalled();
  });

  it('handlePrecisionKey - case 1 - break', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(1);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi
      .spyOn(KeyManagerUtils, 'checkLowerX')
      .mockImplementation(() => {
        return true;
      });
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).not.toHaveBeenCalled();
    expect(spyLowerX).toHaveBeenCalled();
    expect(spyLowerY).not.toHaveBeenCalled();
    expect(spyUpperX).not.toHaveBeenCalled();
    expect(player.movePrecise).not.toHaveBeenCalled();
  });

  it('handlePrecisionKey - case 2 - break', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(2);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi
      .spyOn(KeyManagerUtils, 'checkLowerY')
      .mockImplementation(() => {
        return true;
      });
    const spyUpperX = vi.spyOn(KeyManagerUtils, 'checkUpperX');

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).not.toHaveBeenCalled();
    expect(spyLowerX).not.toHaveBeenCalled();
    expect(spyLowerY).toHaveBeenCalled();
    expect(spyUpperX).not.toHaveBeenCalled();
    expect(player.movePrecise).not.toHaveBeenCalled();
  });

  it('handlePrecisionKey - case 3 - break', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const key = player.keyGrid.precisionKeys.charAt(3);
    const spyUpperY = vi.spyOn(KeyManagerUtils, 'checkUpperY');
    const spyLowerX = vi.spyOn(KeyManagerUtils, 'checkLowerX');
    const spyLowerY = vi.spyOn(KeyManagerUtils, 'checkLowerY');
    const spyUpperX = vi
      .spyOn(KeyManagerUtils, 'checkUpperX')
      .mockImplementation(() => {
        return true;
      });

    keyManager.handlePrecisionKey(key);

    expect(spyUpperY).not.toHaveBeenCalled();
    expect(spyLowerX).not.toHaveBeenCalled();
    expect(spyLowerY).not.toHaveBeenCalled();
    expect(spyUpperX).toHaveBeenCalled();
    expect(player.movePrecise).not.toHaveBeenCalled();
  });

  it('resolve - sequence present', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const spy = vi.spyOn(keyManager, 'reset');
    keyManager.buffer = ['q', 'a'];

    keyManager.resolve();

    expect(player.move).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('resolve - reverse sequence present', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const spy = vi.spyOn(keyManager, 'reset');
    keyManager.buffer = ['a', 'q'];

    keyManager.resolve();

    expect(player.move).toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('resolve - sequence not present', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const spy = vi.spyOn(keyManager, 'reset');
    keyManager.buffer = ['z', 'l'];

    keyManager.resolve();

    expect(player.move).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('resolve - sequence not present', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    const spy = vi.spyOn(keyManager, 'reset');
    keyManager.buffer = ['z', 'l'];

    keyManager.resolve();

    expect(player.move).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalled();
  });

  it('reset', async () => {
    const player = new Player();
    const keyManager = new KeyManager(scene, callback, player);
    keyManager.buffer = ['q', 'a', 'b'];
    keyManager.deltaTime = 1000;

    keyManager.reset();

    expect(keyManager.buffer.length).toEqual(0);
    expect(keyManager.deltaTime).toEqual(0);
  });
});
