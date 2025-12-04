import { describe, it, expect, vi, afterEach } from 'vitest';
import '@testing-library/dom';
import * as module from '../../src/frontend/src/main.ts';

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
});
