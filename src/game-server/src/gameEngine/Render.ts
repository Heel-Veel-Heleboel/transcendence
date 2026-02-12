import { NullEngine, Scene } from '@babylonjs/core';

export function renderLoop(engine: NullEngine, scene: Scene) {
  engine.runRenderLoop(() => {
    scene.render();
  });
}
