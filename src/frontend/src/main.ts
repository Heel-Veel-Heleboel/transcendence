const initApp = (): void => {
  document.getElementById('optionCool')?.addEventListener('click', function () {
    window.location.href = 'https://nu.nl';
  });

  document
    .getElementById('optionStart')
    ?.addEventListener('click', function () {
      window.location.href = 'https://www.ad.nl/';
    });

  document
    .getElementById('optionLogin')
    ?.addEventListener('click', function () {
      window.location.href = 'https://ra.co/';
    });
};

document.addEventListener('DOMContentLoaded', initApp);
