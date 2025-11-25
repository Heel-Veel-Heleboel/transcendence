import { describe, it, expect, vi, expectTypeOf } from 'vitest';
import { createScene } from '../../src/frontend/src/game.ts';
import * as BABYLON from '@babylonjs/core';

describe('createScene', () => {
  it('creates basic Scene', async () => {
    const scene = createScene();

    expectTypeOf(scene).toEqualTypeOf(BABYLON.Scene);
  });
});
