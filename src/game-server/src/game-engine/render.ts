import { GameEngine } from './game-engine.js';
import { logger } from '../logger.js';

export function renderLoop(gameEngine: GameEngine) {
  logger.debug({ roomId: gameEngine.gameRoom.roomId }, 'starting render loop');
  gameEngine.engine.runRenderLoop(() => {
    gameEngine.gameRoom.state.hacks.forEach((value, _key) => {
      value.update();
    });
    gameEngine.gameRoom.state.players.forEach((value, _key) => {
      value.update();
    });
    gameEngine.gameRoom.state.obstacles.forEach((value, _key) => {
      value.update();
    });
    gameEngine.scene.render();
  });
}
