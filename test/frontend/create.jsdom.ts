import { describe, it, expect, vi, afterEach } from 'vitest';
import { getCanvas } from '../../src/frontend/src/game/utils/canvas';
import {
  createBgMusic,
  createEngine,
  createCamera,
  createArena,
  createBall,
  createLight
} from '../../src/frontend/src/game/utils/create';
import {
  NullEngine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  Sound
} from '@babylonjs/core';
import { Arena } from '../../src/frontend/src/game/components/arena';
import { Ball } from '../../src/frontend/src/game/components/ball';

// source - https://github.com/BabylonJS/Babylon.js/tree/master/packages/dev/core/test/unit
vi.mock('@babylonjs/core', async () => {
  const actual =
    await vi.importActual<typeof import('@babylonjs/core')>('@babylonjs/core');

  return {
    ...actual,
    Engine: vi.fn((...args) => new actual.NullEngine(...args)) // redirect construction
  };
});

vi.mock('../../src/frontend/src/game/components/arena');
vi.mock('../../src/frontend/src/game/components/ball');

function createMockCanvas() {
  return '<canvas id="renderCanvas"></canvas>';
}

describe('create', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('createEngine', () => {
    document.body.innerHTML = createMockCanvas();
    const canvas = getCanvas();
    const engine = createEngine(canvas);
    expect(engine).toBeInstanceOf(NullEngine);
  });

  it('createCamera', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);

    const camera = createCamera(scene, 10);
    expect(camera).toBeInstanceOf(ArcRotateCamera);
  });

  it('createArena', () => {
    const arena = createArena();

    expect(arena).toBeInstanceOf(Arena);
  });

  it('createBall', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const ball = createBall(scene, new Vector3(1, 1, 1), 10);

    expect(ball).toBeInstanceOf(Ball);
  });

  it('createLight', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const light = createLight(scene);

    expect(light).toBeInstanceOf(HemisphericLight);
  });

  it('createBgMusic', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const music = createBgMusic(scene);

    expect(music).toBeInstanceOf(Sound);
  });
});
