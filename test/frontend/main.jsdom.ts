import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/dom';
import * as module from '../../src/frontend/src/main.ts';

//method: https://stackoverflow.com/questions/72277787/spying-on-mocking-import-of-an-import
vi.mock('../../src/frontend/src/state.ts');
vi.mock('../../src/frontend/src/login.ts');

describe('document EventListener', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('main', () => {
    const spy = vi.spyOn(module, 'initApp').mockImplementation(() => {});

    module.main();
    window.document.dispatchEvent(
      new Event('DOMContentLoaded', {
        bubbles: true,
        cancelable: true
      })
    );

    expect(spy).toHaveBeenCalled();
  });

  it('initApp', async () => {
    const { loadTemplate } = await import('../../src/frontend/src/state.ts');
    const { initLogin } = await import('../../src/frontend/src/login.ts');

    module.initApp();
    expect(loadTemplate).toHaveBeenCalledWith('login');
    expect(initLogin).toHaveBeenCalled();
  });
});
