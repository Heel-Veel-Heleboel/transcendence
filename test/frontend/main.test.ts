import { describe, it, expect, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@testing-library/dom';
import * as main from '../../src/frontend/src/main.ts';

describe('document EventListener', () => {
  it('DOMContentLoaded', () => {
    // setup: prepare data fro test
    document.body.innerHTML = `
      <button id="optionCool">Cool</button>
    `;

    // Spy on window.location.assign (jsdom-safe)
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    openSpy;

    // Register the event listener
    main.registerOptionLogin();

    // Simulate click
    let btn = document.getElementById('optionLogin') as HTMLButtonElement;

    userEvent.click(btn);

    // Assert window.open was called correctly
    expect(openSpy).toHaveBeenCalledWith(
      'http://localhost:5173/src/menu.html',
      '_blank',
      'noopener,noreferrer'
    );

    openSpy.mockRestore();
  });
});
