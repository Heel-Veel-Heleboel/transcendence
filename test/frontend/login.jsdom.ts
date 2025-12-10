import { describe, it, expect, vi, afterEach } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/dom';
import * as module from '../../src/frontend/src/login.ts';

vi.mock('../../src/frontend/src/game.ts');
vi.mock('../../src/frontend/src/state.ts');

function createMockButton(id: string) {
  const btn = `<button id="${id}">Cool</button>`;
  return btn;
}

describe('initLogin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registerOptionLogin should be called', () => {
    const spy = vi
      .spyOn(module, 'registerOptionLogin')
      .mockImplementation(() => {});

    module.initLogin();

    expect(spy).toHaveBeenCalled();
  });

  it('registerOptionGame should be called', () => {
    const spy = vi
      .spyOn(module, 'registerOptionGame')
      .mockImplementation(() => {});

    module.initLogin();

    expect(spy).toHaveBeenCalled();
  });
});

describe('gotoGame', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loadTemplate should be called', async () => {
    const { loadTemplate } = await import('../../src/frontend/src/state.ts');

    module.gotoGame();

    expect(loadTemplate).toHaveBeenCalledWith('game');
  });

  it('initGame should be called', async () => {
    const { initGame } = await import('../../src/frontend/src/game.ts');

    module.gotoGame();

    expect(initGame).toHaveBeenCalled();
  });
});

describe('gotoLogin', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loadTemplate should be called', async () => {
    const { loadTemplate } = await import('../../src/frontend/src/state.ts');

    module.gotoLogin();

    expect(loadTemplate).toHaveBeenCalledWith('menu');
  });
});

describe('registerOptions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loops through all options and test all registration', async () => {
    const registrations = {
      Game: module.registerOptionGame,
      Login: module.registerOptionLogin
    };

    for (const [key, value] of Object.entries(registrations)) {
      const buttonId = ('option' + key) as string;
      const callBackFunction = ('goto' + key) as never;
      const setupFunction = value;
      document.body.innerHTML = createMockButton(buttonId);
      const user = userEvent.setup();
      const spy = vi
        .spyOn(module, callBackFunction)
        .mockImplementation(() => {});
      setupFunction();
      const element = document.getElementById(buttonId);
      if (!element) {
        throw new Error('Button Element necessary for test is null');
      }

      await user.click(element);
      expect(
        spy,
        `${callBackFunction} should be called with ${buttonId} button`
      ).toHaveBeenCalled();
    }
  });
});
