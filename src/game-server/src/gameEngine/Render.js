"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderLoop = renderLoop;
function renderLoop(engine, scene) {
    engine.runRenderLoop(function () {
        scene.render();
    });
}
