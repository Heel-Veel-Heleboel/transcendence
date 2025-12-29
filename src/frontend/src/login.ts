import { Game } from './game/systems/game.ts';
import * as module from './login.ts';
import { loadTemplate } from './state.ts';

export function registerOptionGame() {
  document.getElementById('optionGame')?.addEventListener('click', function () {
    module.gotoGame();
  });
}

export function registerOptionLogin() {
  document
    .getElementById('optionLogin')
    ?.addEventListener('click', function () {
      module.gotoLogin();
    });
}

export function initLogin() {
  module.registerOptionGame();
  module.registerOptionLogin();
}

export async function gotoGame() {
  console.log('here in game');
  loadTemplate('game');
  const game = new Game();
  await game.initGame();
}

export function gotoLogin() {
  console.log('here in login');
  loadTemplate('menu');
}
