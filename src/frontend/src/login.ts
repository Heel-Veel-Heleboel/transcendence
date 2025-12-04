import { initGame } from './game.ts';
import * as module from './login.ts';
import { loadTemplate } from './state.ts';

export function registerOptionGame() {
  document
    .getElementById('optionStart')
    ?.addEventListener('click', function () {
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

export function gotoGame() {
  console.log('here in game');
  loadTemplate('game');
  initGame();
}

export function gotoLogin() {
  console.log('here in login');
  loadTemplate('menu');
}
