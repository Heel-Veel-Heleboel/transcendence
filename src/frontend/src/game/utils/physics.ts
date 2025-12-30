import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin, Vector3, Scene } from '@babylonjs/core';

export async function initializePhysics(scene: Scene) {
  const havokInstance = await HavokPhysics();
  const havokPlugin = new HavokPlugin(true, havokInstance);
  scene.enablePhysics(new Vector3(0, 0, 0), havokPlugin);
}
