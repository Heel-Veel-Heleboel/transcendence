import { AbstractEngine, Scene, TransformNode } from '@babylonjs/core';

export function getCanvas() {
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  return canvas;
}

export function engineResize(engine: AbstractEngine) {
  return () => engine.resize();
}

export function initializeResolution(engine: AbstractEngine) {
  // initial resolution is blurry, no clue why, hacky fix in order to make resolution sharp
  setTimeout(() => {
    engine.resize();
  }, 10);
}

export function prepareImportGLTF(scene: Scene) {
  // An extra step is needed in order to be able to physicalize meshes coming from gltf.
  // Insert an extra node transform just before the __root__
  // so conversion between Righ or Left handedness are transparent for the physics engine.
  const trParent = new TransformNode('tr', scene);
  const root = scene.getMeshByName('__root__');
  if (root) {
    root.scaling.scaleInPlace(100);
    root.position.y = 4;
    root.setParent(trParent);
  }
}
