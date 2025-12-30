import { describe, it, expect, vi, afterEach } from 'vitest';
import { Game } from '../../src/frontend/src/game/systems/game.ts';
import * as canvasModule from '../../src/frontend/src/game/utils/canvas.ts';
import * as createModule from '../../src/frontend/src/game/utils/create.ts';
import * as physicsModule from '../../src/frontend/src/game/utils/physics.ts';
import * as eventModule from '../../src/frontend/src/game/utils/eventListeners.ts';
import { NullEngine, Scene } from '@babylonjs/core';

describe('Game Class', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initGame', async () => {
    const game = new Game();

    const canvasSpy = vi
      .spyOn(canvasModule, 'getCanvas')
      .mockImplementation(() => {
        return document.createElement('canvas');
      });
    const engineSpy = vi
      .spyOn(createModule, 'createEngine')
      .mockImplementation(() => {
        return new NullEngine();
      });
    const physicsSpy = vi
      .spyOn(physicsModule, 'initializePhysics')
      .mockImplementation(() => {
        return Promise.resolve();
      });
    const importSpy = vi
      .spyOn(canvasModule, 'prepareImportGLTF')
      .mockImplementation(() => {});
    const sceneSpy = vi.spyOn(game, 'initScene').mockImplementation(() => {
      const engine = new NullEngine();
      const scene = new Scene(engine);
      return Promise.resolve(scene);
    });
    const resizeSpy = vi
      .spyOn(eventModule, 'engineResizeListener')
      .mockImplementation(() => {});
    const debugSpy = vi
      .spyOn(eventModule, 'debugLayerListener')
      .mockImplementation(() => {});
    const resolutionSpy = vi
      .spyOn(canvasModule, 'initializeResolution')
      .mockImplementation(() => {});
    await game.initGame();
    expect(canvasSpy).toHaveBeenCalled();
    expect(engineSpy).toHaveBeenCalled();
    expect(physicsSpy).toHaveBeenCalled();
    expect(sceneSpy).toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalled();
    expect(resizeSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
    expect(resolutionSpy).toHaveBeenCalled();
  });
});
