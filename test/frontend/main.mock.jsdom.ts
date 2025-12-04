import { describe, it, expect, vi } from 'vitest';
import * as module from '../../src/frontend/src/main.ts';

//method: https://stackoverflow.com/questions/72277787/spying-on-mocking-import-of-an-import
vi.mock('../../src/frontend/src/state.ts');

describe('initApp', () => {
  it('calls each register function once', async () => {
    const { loadTemplate } = await import('../../src/frontend/src/state.ts');
    module.initApp();
    expect(loadTemplate).toHaveBeenCalledWith('login');
  });
});
