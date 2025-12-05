import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as BABYLON from '@babylonjs/core';
import * as module from '../../src/frontend/src/game.ts';

// source
// https://github.com/BabylonJS/Babylon.js/tree/master/packages/dev/core/test/unit

vi.mock('@babylonjs/core', async () => {
  const actual =
    await vi.importActual<typeof import('@babylonjs/core')>('@babylonjs/core');

  return {
    ...actual,
    Engine: vi.fn((...args) => new actual.NullEngine(...args)) // redirect construction
  };
});

function createMockCanvas() {
  return '<canvas id="renderCanvas"></canvas>';
}

function createMockScene() {
  const engine = new BABYLON.NullEngine();
  const scene = new BABYLON.Scene(engine);
  return scene;
}

describe('createScene', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initGame', () => {
    document.body.innerHTML = createMockCanvas();
    const spyCanvas = vi.spyOn(module, 'getCanvas');
    const spyEngine = vi.spyOn(module, 'createEngine');
    const spyScene = vi.spyOn(module, 'createScene');

    module.initGame();

    expect(spyCanvas).toBeCalled();
    expect(spyEngine).toBeCalled();
    expect(spyScene).toBeCalled();
  });

  it('createScene', () => {
    const engine = new BABYLON.NullEngine();
    const scene = module.createScene(engine);

    expect(scene).toBeInstanceOf(BABYLON.Scene);
  });

  it('getCanvas', () => {
    document.body.innerHTML = createMockCanvas();
    const canvas = module.getCanvas();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('createEngine', () => {
    document.body.innerHTML = createMockCanvas();
    const canvas = module.getCanvas();
    const engine = module.createEngine(canvas);
    expect(engine).toBeInstanceOf(BABYLON.NullEngine);
  });

  it('createCamera', () => {
    const scene = createMockScene();

    const camera = module.createCamera(scene);
    expect(camera).toBeInstanceOf(BABYLON.ArcRotateCamera);
  });

  it('createPlane', () => {
    const name = 'test';
    const height = 1;
    const width = 1;
    const scene = createMockScene();
    const plane = module.createPlane(scene, name, height, width);

    expect(plane).toBeInstanceOf(BABYLON.Mesh);
    expect(plane.name).toBe(name);
    expect(plane.sideOrientation).toBe(1);
  });

  it('createArena', () => {
    const scene = createMockScene();
    const arena = module.createArena(scene);

    expect(Array.isArray(arena)).toBe(true);
    expect(arena.every(item => item instanceof BABYLON.Mesh)).toBe(true);
    expect(arena.length).toBe(6);
  });

  it('createBall', () => {
    const scene = createMockScene();
    const ball = module.createBall(scene, 0.1);

    expect(ball).toBeInstanceOf(module.Ball);
    expect(ball.mesh).toBeInstanceOf(BABYLON.Mesh);
  });
});

describe('audio', () => {
  let engine: BABYLON.NullEngine;
  let scene: BABYLON.Scene;

  beforeEach(() => {
    engine = new BABYLON.NullEngine();
    scene = new BABYLON.Scene(engine);
  });

  afterEach(() => {
    scene.dispose();
    (scene as any) = null;
    engine.dispose();
    (engine as any) = null;
  });

  it('createBgMusic', () => {
    const bg = module.createBgMusic(scene);

    expect(bg.loop).toBe(true);
    expect(bg.autoplay).toBe(true);
    expect(bg.name).toBe('mySong');
  });
});

describe('utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('inverseCoordinate - negative input', () => {
    expect(module.inverseCoordinate(-1)).toBe(1);
  });

  it('inverseCoordinate - 0 input', () => {
    expect(module.inverseCoordinate(0)).toBe(-0);
  });

  it('inverseCoordinate - positive input', () => {
    expect(module.inverseCoordinate(1)).toBe(-1);
  });

  it('inverseCoordinate - float negative input', () => {
    expect(module.inverseCoordinate(-1.5)).toBe(1.5);
  });

  it('inverseCoordinate - float positive input', () => {
    expect(module.inverseCoordinate(1.5)).toBe(-1.5);
  });

  it('inverseCoordinate - random 10 integers input', () => {
    for (let i = 0; i < 10; i++) {
      const arg = Math.floor(Math.random());
      expect(module.inverseCoordinate(arg)).toBe(-arg);
    }
  });

  it('inverseCoordinate - random 10 float input', () => {
    for (let i = 0; i < 10; i++) {
      const arg = Math.random();
      expect(module.inverseCoordinate(arg)).toBe(-arg);
    }
  });
});
