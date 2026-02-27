import HavokPhysics from '@babylonjs/havok';
import { Scene } from '@babylonjs/core';
import { createHavokPlugin, createVector3Zero } from './Create';

/* v8 ignore start */
export async function initializePhysics(scene: Scene) {
  const havokInstance = await HavokPhysics();
  const havokPlugin = createHavokPlugin(true, havokInstance);
  scene.enablePhysics(createVector3Zero(), havokPlugin);
}
/* v8 ignore stop */
