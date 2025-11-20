const initApp = (): void => {
  document.getElementById('optionCool')?.addEventListener('click', function () {
    window.location.href = 'https://nu.nl';
  });

  document
    .getElementById('optionStart')
    ?.addEventListener('click', function () {
      window.location.href = 'src/game.html';
    });

  document
    .getElementById('optionLogin')
    ?.addEventListener('click', function () {
      window.location.href = 'src/menu.html';
    });
};

document.addEventListener('DOMContentLoaded', initApp);
