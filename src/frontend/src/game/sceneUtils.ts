import { AbstractEngine } from '@babylonjs/core';

export function getCanvas() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  return canvas;
}

export function engineResize(engine: AbstractEngine) {
  return () => engine.resize();
}
