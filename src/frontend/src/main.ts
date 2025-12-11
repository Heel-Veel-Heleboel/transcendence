import { initLogin } from './login.ts';
import * as module from './main.ts';
import { loadTemplate } from './state.ts';

export function initApp() {
  loadTemplate('login');
  initLogin();
}

export function main() {
  document.addEventListener('DOMContentLoaded', module.initApp);
}

module.main();
