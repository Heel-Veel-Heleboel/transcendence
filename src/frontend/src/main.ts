import * as module from './main.ts';
import { loadTemplate } from './state.ts';

export function initApp() {
  loadTemplate('login');
}

export function main() {
  document.addEventListener('DOMContentLoaded', module.initApp);
}

module.main();
