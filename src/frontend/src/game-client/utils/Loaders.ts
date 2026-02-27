import { Scene } from '@babylonjs/core';
import { createTransformNode } from './Create';
import gameConfig from './GameConfig';

/* v8 ignore start */
// NOTE:
// An extra step is needed in order to be able to physicalize meshes coming from gltf.
// Insert an extra node transform just before the __root__
// so conversion between Right or Left handedness are transparent for the physics engine.
export function prepareImportGLTF(scene: Scene) {
  const trParent = createTransformNode(gameConfig.rootTransformNodeName, scene);
  const root = scene.getMeshByName(gameConfig.rootMesh);
  if (root) {
    root.scaling.scaleInPlace(100);
    root.position.y = 4;
    root.setParent(trParent);
  }
}

/* v8 ignore stop */
