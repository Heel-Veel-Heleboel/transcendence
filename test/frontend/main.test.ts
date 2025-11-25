/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import '@testing-library/dom';
import { actions, registerOptionCool } from '../../src/frontend/src/main.ts';

describe('document EventListener', () => {
  it('calls actions.gotoNu when clicked', async () => {
    document.body.innerHTML = `<button id="optionCool">Cool</button>`;
    const user = userEvent.setup();
    const spy = vi.spyOn(actions, 'gotoNu').mockImplementation(() => {});
    registerOptionCool();
    await user.click(document.getElementById('optionCool')!);
    expect(spy).toHaveBeenCalled();
  });
});
