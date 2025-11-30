import { describe, it, expect, vi, afterEach } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@testing-library/dom';
import * as module from '../../src/frontend/src/main.ts';

function createMockButton(id: string) {
  const btn = `<button id="${id}">Cool</button>`;
  return btn;
}

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

  it('calls module.gotoNu when clicked', async () => {
    const buttonId = 'optionCool' as string;
    document.body.innerHTML = createMockButton(buttonId);
    const user = userEvent.setup();
    const spy = vi.spyOn(module, 'gotoNu').mockImplementation(() => {
      return true;
    });
    module.registerOptionCool();
    const element = document.getElementById(buttonId);
    if (element) {
      await user.click(element);
      expect(spy).toHaveBeenCalled();
    } else {
      throw new Error('Button Element neccessary for test is null');
    }
  });

  it('calls module.gotoGame when clicked', async () => {
    const buttonId = 'optionStart' as string;
    document.body.innerHTML = createMockButton(buttonId);
    const user = userEvent.setup();
    const spy = vi.spyOn(module, 'gotoGame').mockImplementation(() => {
      return true;
    });
    module.registerOptionGame();
    const element = document.getElementById(buttonId);
    if (element) {
      await user.click(element);
      expect(spy).toHaveBeenCalled();
    } else {
      throw new Error('Button Element neccessary for test is null');
    }
  });

  it('calls module.gotoLogin when clicked', async () => {
    const buttonId = 'optionLogin' as string;
    document.body.innerHTML = createMockButton(buttonId);
    const user = userEvent.setup();
    const spy = vi.spyOn(module, 'gotoLogin').mockImplementation(() => {
      return true;
    });
    module.registerOptionLogin();
    const element = document.getElementById(buttonId);
    if (element) {
      await user.click(element);
      expect(spy).toHaveBeenCalled();
    } else {
      throw new Error('Button Element neccessary for test is null');
    }
  });

  it('module.gotoNu', () => {
    expect(module.gotoNu()).toBe(true);
  });

  it('module.gotoLogin', () => {
    expect(module.gotoLogin()).toBe(true);
  });

  it('module.gotoGame', () => {
    expect(module.gotoGame()).toBe(true);
  });
});
