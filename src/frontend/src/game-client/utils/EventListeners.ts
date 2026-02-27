import { AbstractEngine, Scene } from '@babylonjs/core';

/* v8 ignore start */
export function engineResizeListener(engine: AbstractEngine) {
  window.addEventListener('resize', function () {
    engine.resize();
  });
}

export function debugLayerListener(scene: Scene) {
  if (process.env.NODE_ENV !== 'production') {
    window.addEventListener('keydown', ev => {
      //Shift+Ctrl+Alt+I
      if (ev.shiftKey && ev.ctrlKey && ev.altKey && ev.key === 'I') {
        if (scene.debugLayer.isVisible()) {
          scene.debugLayer.hide();
        } else {
          scene.debugLayer.show();
        }
      }
    });
  }
}
/* v8 ignore stop */
