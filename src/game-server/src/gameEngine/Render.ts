import { GameEngine } from './GameEngine.js';

export function renderLoop(gameEngine: GameEngine) {
  gameEngine.engine.runRenderLoop(() => {
    gameEngine.gameRoom.state.balls.forEach((value, _key) => {
      value.update();
    });
    gameEngine.scene.render();
  });
}
