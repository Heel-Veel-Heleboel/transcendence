import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as module from '../../src/frontend/src/state.ts';

const mainElementName = 'app';

function createRandomString() {
  // Posted by doubletap, modified by community. See post 'Timeline' for change history
  // Retrieved 2025-12-08, License - CC BY-SA 4.0

  //Can change 7 to 2 for longer results.
  const r = (Math.random() + 1).toString(36).substring(7);
  return r;
}

function addMockChildren(div: HTMLDivElement) {
  const element = createMockElement('div', HTMLDivElement);
  element.setAttribute('id', createRandomString());
  div.appendChild(element);
}

function addTemplateToDocument(template: HTMLTemplateElement) {
  document.head.appendChild(template);
}

function addTemplateContent(template: HTMLTemplateElement, content: string) {
  template.innerHTML = content;
}

function createMockTemplate(name: string) {
  const template = createMockElement('template', HTMLTemplateElement);
  template.setAttribute('id', name);
  return template;
}

function createMockDocument() {
  const appElement = createMockElement('div', HTMLDivElement);
  appElement.setAttribute('id', mainElementName);
  document.body.appendChild(appElement);
}
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

describe('createScene', () => {
  const templateName = 'random';
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('loadTemplate - template not existing', () => {
    createMockDocument();

    module.loadTemplate(templateName);

    const mainElement = document.getElementById(mainElementName);
    expect(mainElement).to.not.equal(null);
    expect(mainElement?.innerHTML).toEqual('');
  });

  it('loadTemplate - container not existing', () => {
    const template = createMockTemplate('random');
    addTemplateToDocument(template);

    module.loadTemplate(templateName);
    expect(document.body.innerHTML).toEqual('');
  });

  it('loadTemplate - container one child should be deleted', () => {
    createMockDocument();
    const mainElement = document.getElementById(
      mainElementName
    ) as HTMLDivElement;
    if (mainElement) {
      addMockChildren(mainElement);
    }
    const template = createMockTemplate(templateName);
    const content = createRandomString();
    addTemplateContent(template, content);
    addTemplateToDocument(template);

    module.loadTemplate(templateName);

    const loadedTemplate = document.getElementById(templateName);
    expect(loadedTemplate).to.not.equal(null);
    expect(document.getElementById(mainElementName)?.innerHTML).toEqual(
      content
    );
  });

  it('loadTemplate - container two children should be deleted', () => {
    createMockDocument();
    const mainElement = document.getElementById(
      mainElementName
    ) as HTMLDivElement;
    if (mainElement) {
      addMockChildren(mainElement);
      addMockChildren(mainElement);
    }
    const template = createMockTemplate(templateName);
    const content = createRandomString();
    addTemplateContent(template, content);
    addTemplateToDocument(template);

    module.loadTemplate(templateName);

    const loadedTemplate = document.getElementById(templateName);
    expect(loadedTemplate).to.not.equal(null);
    expect(document.getElementById(mainElementName)?.innerHTML).toEqual(
      content
    );
  });

  it('loadTemplate - container multiple children should be deleted', () => {
    createMockDocument();
    const mainElement = document.getElementById(
      mainElementName
    ) as HTMLDivElement;
    if (mainElement) {
      addMockChildren(mainElement);
      addMockChildren(mainElement);
      addMockChildren(mainElement);
    }
    const template = createMockTemplate(templateName);
    const content = createRandomString();
    addTemplateContent(template, content);
    addTemplateToDocument(template);

    module.loadTemplate(templateName);

    const loadedTemplate = document.getElementById(templateName);
    expect(loadedTemplate).to.not.equal(null);
    expect(document.getElementById(mainElementName)?.innerHTML).toEqual(
      content
    );
  });

  it('loadTemplate - valid case', () => {
    createMockDocument();
    const template = createMockTemplate(templateName);
    const content = createRandomString();
    addTemplateContent(template, content);
    addTemplateToDocument(template);

    module.loadTemplate(templateName);

    const loadedTemplate = document.getElementById(templateName);
    expect(loadedTemplate).to.not.equal(null);
    expect(document.getElementById(mainElementName)?.textContent).toEqual(
      content
    );
  });
});
