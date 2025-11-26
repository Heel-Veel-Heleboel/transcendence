import { describe, it, expect, vi, expectTypeOf } from 'vitest';
import { createEngine, getCanvas } from '../../src/frontend/src/game.ts';
import * as BABYLON from '@babylonjs/core';
//

function createMockCanvas() {
  return '<canvas id="renderCanvas"></canvas>';
}

describe('createScene', () => {
  it('getCanvas', () => {
    document.body.innerHTML = createMockCanvas();
    const canvas = getCanvas();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  // it('getCanvas', () => {
  //   document.body.innerHTML = createMockCanvas();
  //   const canvas = getCanvas();
  //   const engine = createEngine(canvas);
  //   // expect(engine).toBeInstanceOf(BABYLON.AbstractEngine);
  // });
});
