import { describe, it, expect, vi, afterEach } from 'vitest';
import { engineResizeListener } from '../../src/frontend/src/game/utils/eventListeners';
import { NullEngine } from '@babylonjs/core';
import * as canvasModule from '../../src/frontend/src/game/utils/canvas';

describe('create', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('engineResizeListener', () => {
    const engine = new NullEngine();
    const spy = vi.spyOn(canvasModule, 'engineResize');

    engineResizeListener(engine);

    expect(spy).toHaveBeenCalled();
  });

  // it('loops through all options and test all registration', async () => {
  //   const registrations = {
  //     Game: module.registerOptionGame,
  //     Login: module.registerOptionLogin
  //   };
  //
  //   for (const [key, value] of Object.entries(registrations)) {
  //     const buttonId = ('option' + key) as string;
  //     const callBackFunction = ('goto' + key) as never;
  //     const setupFunction = value;
  //     document.body.innerHTML = createMockButton(buttonId);
  //     const user = userEvent.setup();
  //     const spy = vi
  //       .spyOn(module, callBackFunction)
  //       .mockImplementation(() => {});
  //     setupFunction();
  //     const element = document.getElementById(buttonId);
  //     if (!element) {
  //       throw new Error('Button Element necessary for test is null');
  //     }
  //
  //     await user.click(element);
  //     expect(
  //       spy,
  //       `${callBackFunction} should be called with ${buttonId} button`
  //     ).toHaveBeenCalled();
  //   }
  // });
});
