import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  Scene,
  NullEngine,
  KeyboardInfo,
  KeyboardEventTypes
} from '@babylonjs/core';
import { KeyManager } from '../../src/frontend/src/game/systems/keyManager.ts';

const Player = vi.fn();
Player.prototype.movePrecise = vi.fn(
  (args: { x: number; y: number }) => `${args.x}, and ${args.y}`
);
Player.prototype.move = vi.fn((coords: string) => coords);
Player.prototype.keyGrid = vi.fn();
Player.prototype.keyGrid.grid = new Map([['test', { x: 0, y: 0 }]]);
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('constructor', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();

    const keyManager = new KeyManager(scene, callback, player);

    expect(keyManager.deltaTime).toEqual(0);
    expect(keyManager.buffer).toEqual(new Array());
    expect(keyManager.player).toEqual(player);
    expect(keyManager.actions).toEqual(player.keyGrid.grid);
    expect(keyManager.precisionKeys).toEqual(player.keyGrid.precisionKeys);
  });

  it('onKeyDown - wrong KeyboardEventType', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
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
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
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
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
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
    // const spy = vi.spyOn(module, 'callbackMock');

    keyManager.onKeyDown(kInfo);
    expect(callback).toHaveBeenCalled();
  });

  it('register - zero keys', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = [];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);
    expect(keyManager.actions.get(sequence.join('+'))).toEqual(undefined);
  });

  it('register - one key', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = ['q'];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);
    expect(keyManager.actions.get(sequence.join('+'))).toEqual(coords);
  });

  it('register - two keys', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = ['q', 'a'];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);
    expect(keyManager.actions.get(sequence.join('+'))).toEqual(coords);
  });

  it('register - three keys', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
    const keyManager = new KeyManager(scene, callback, player);
    const sequence = ['q', 'a', 'c'];
    const coords = { x: 10, y: 10 };

    keyManager.register(sequence, coords);
    expect(keyManager.actions.get(sequence.join('+'))).toEqual(coords);
  });

  it('handleKey - add to empty buffer', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
    const keyManager = new KeyManager(scene, callback, player);
    const key = 'a';

    keyManager.handleKey(key);
    expect(keyManager.buffer).toEqual(new Array(key));
  });

  it('handleKey - add to non-empty buffer', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const player = new Player();
    const callback = vi.fn();
    const keyManager = new KeyManager(scene, callback, player);
    const firstKey = 'a';
    const secondKey = 'b';

    keyManager.handleKey(firstKey);
    keyManager.handleKey(secondKey);
    expect(keyManager.buffer).toEqual(new Array(firstKey, secondKey));
  });
});
