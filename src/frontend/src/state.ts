export function loadTemplate(name: string) {
  const template = document.getElementById(name);
  const container = document.getElementById('app');
  if (template && container) {
    const content = document.importNode(template.content, true);
    container.innerHTML = '';
    container.appendChild(content);
  }
}
