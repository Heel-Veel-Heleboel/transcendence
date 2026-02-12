import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin, Vector3, Scene } from '@babylonjs/core';

/* v8 ignore start */
export async function initializePhysics(scene: Scene) {
  const havokInstance = await HavokPhysics();
  const hk = new HavokPlugin(true, havokInstance);
  scene.enablePhysics(new Vector3(0, 0, 0), hk);
}
/* v8 ignore stop */
