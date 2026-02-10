import { describe, it, expect, vi, afterEach } from 'vitest';
import { GameClient } from '../src/game_client/systems/gameClient.ts';
import * as canvasModule from '../src/game_client/utils/canvas.ts';
import * as physicsModule from '../src/game_client/utils/physics.ts';
import * as eventModule from '../src/game_client/utils/eventListeners.ts';
import * as renderModule from '../src/game_client/utils/render.ts';
import { NullEngine, Scene } from '@babylonjs/core';

describe('GameClient Class', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initGame', async () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const game = new GameClient(scene);

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
    const renderSpy = vi
      .spyOn(renderModule, 'renderLoop')
      .mockImplementation(() => {});
    const resolutionSpy = vi
      .spyOn(canvasModule, 'initializeResolution')
      .mockImplementation(() => {});
    await game.initGame();
    expect(physicsSpy).toHaveBeenCalled();
    expect(sceneSpy).toHaveBeenCalled();
    expect(importSpy).toHaveBeenCalled();
    expect(resizeSpy).toHaveBeenCalled();
    expect(debugSpy).toHaveBeenCalled();
    expect(renderSpy).toHaveBeenCalled();
    expect(resolutionSpy).toHaveBeenCalled();
  });
});
