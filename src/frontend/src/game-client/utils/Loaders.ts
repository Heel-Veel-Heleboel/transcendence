import { Scene, TransformNode } from '@babylonjs/core';

/* v8 ignore start */
export function prepareImportGLTF(scene: Scene) {
  // An extra step is needed in order to be able to physicalize meshes coming from gltf.
  // Insert an extra node transform just before the __root__
  // so conversion between Right or Left handedness are transparent for the physics engine.
  const trParent = new TransformNode('tr', scene);
  const root = scene.getMeshByName('__root__');
  if (root) {
    root.scaling.scaleInPlace(100);
    root.position.y = 4;
    root.setParent(trParent);
  }
}

/* v8 ignore stop */
