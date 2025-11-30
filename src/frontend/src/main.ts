import * as module from './main.ts';

export function registerOptionCool() {
  document.getElementById('optionCool')?.addEventListener('click', () => {
    module.gotoNu();
  });
}

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

export function initApp() {
  module.registerOptionCool();
  module.registerOptionGame();
  module.registerOptionLogin();
}

export function main() {
  document.addEventListener('DOMContentLoaded', module.initApp);
}

export function gotoNu() {
  const tmp = true;
  return tmp;
}

export function gotoGame() {
  return true;
}

export function gotoLogin() {
  return true;
}

module.main();
