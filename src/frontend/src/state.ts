export function loadTemplate(name: string) {
  const template = document.getElementById(name) as HTMLTemplateElement;
  const container = document.getElementById('app');
  if (template && container) {
    const content = document.importNode(template.content, true);
    while (container.firstChild) {
      if (container.lastChild) {
        container.removeChild(container.lastChild);
      }
    }
    container.innerHTML = '';
    container.appendChild(content);
  }
}
