export function registerOptionCool() {
  document.getElementById('optionCool')?.addEventListener('click', function () {
    window.open('https://nu.nl', '_blank', 'noopener,noreferrer');
  });
}

export function registerOptionGame() {
  document
    .getElementById('optionStart')
    ?.addEventListener('click', function () {
      window.open(
        'http://localhost:5173/src/game.html',
        '_blank',
        'noopener,noreferrer'
      );
    });
}

export function registerOptionLogin() {
  document
    .getElementById('optionLogin')
    ?.addEventListener('click', function () {
      window.open(
        'http://localhost:5173/src/menu.html',
        '_blank',
        'noopener,noreferrer'
      );
    });
}

export function initApp() {
  registerOptionCool();
  registerOptionGame();
  registerOptionLogin();
}

export function main() {
  document.addEventListener('DOMContentLoaded', initApp);
}

main();
