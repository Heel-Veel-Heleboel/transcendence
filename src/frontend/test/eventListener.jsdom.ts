import { describe, it, expect, vi, afterEach } from 'vitest';
import { engineResizeListener } from '../src/game_client/utils/eventListeners';
import { NullEngine } from '@babylonjs/core';
import * as canvasModule from '../src/game_client/utils/canvas';

describe('create', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('engineResizeListener', () => {
    const engine = new NullEngine();
    const spy = vi.spyOn(canvasModule, 'engineResize');

    engineResizeListener(engine);

    expect(spy).toHaveBeenCalled();
  });
});
