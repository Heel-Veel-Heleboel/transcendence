import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as module from '../../src/frontend/src/state.ts';
import assert from 'assert';

function createMockElement<T extends HTMLElement>(
  tag: string,
  elementType: { new (): T }
): T {
  const element = document.createElement(tag);

  if (!(element instanceof elementType)) {
    throw new Error(`Expected ${tag} to be ${elementType.name}`);
  }
  return element as T;
}

function createMockContainer() {}

function createMockChildrenElements() {}

function createMockDocument() {
  document.body.innerHTML = '';
  const appElement = createMockElement('div', HTMLDivElement);
  appElement.setAttribute('id', 'app');
}

describe('createScene', () => {
  beforeEach(() => {
    {
      createMockDocument();
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loadTemplate - template not existing', () => {});
  it('loadTemplate - container not existing', () => {});

  it('loadTemplate - container one child should be deleted', () => {});

  it('loadTemplate - container two children should be deleted', () => {});

  it('loadTemplate - container multiple children should be deleted', () => {});

  it('loadTemplate - valid case', () => {});
});
