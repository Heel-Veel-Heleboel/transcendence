import { GameEngine } from './game-engine.js';

export function renderLoop(gameEngine: GameEngine) {
  console.log(`Room: ${gameEngine.gameRoom.roomId} - starting render loop`);
  gameEngine.engine.runRenderLoop(() => {
    gameEngine.gameRoom.state.hacks.forEach((value, _key) => {
      value.update();
    });
    gameEngine.gameRoom.state.players.forEach((value, _key) => {
      value.update();
    });
    gameEngine.scene.render();
  });
}
