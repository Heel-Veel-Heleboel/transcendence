import { describe, it, expect, vi } from 'vitest';
import * as module from '../../src/frontend/src/main.ts';

describe('initApp', () => {
  it('calls each register function once', () => {
    const spyCool = vi.spyOn(module, 'registerOptionCool');
    const spyGame = vi.spyOn(module, 'registerOptionGame');
    const spyLogin = vi.spyOn(module, 'registerOptionLogin');
    module.initApp();

    expect(spyCool).toHaveBeenCalledOnce();
    expect(spyGame).toHaveBeenCalledOnce();
    expect(spyLogin).toHaveBeenCalledOnce();
  });
});
