import { createOptimizedPicture } from '../../scripts/aem.js';

export default async function decorate(block) {
  let markup;
  try {
    const response = await fetch(new URL('./vehicle-catalog.html', import.meta.url));
    if (!response.ok) throw new Error(`Catalog template: ${response.status}`);
    markup = new DOMParser().parseFromString(await response.text(), 'text/html');
    const required = ['input', 'select', '.vehicle-catalog-reset', '.vehicle-catalog-list', '[role="status"]', '.vehicle-catalog-empty'];
    if (!required.every((selector) => markup.querySelector(selector))
      || !markup.querySelector('.vehicle-catalog-card')?.content?.firstElementChild) {
      throw new Error('Invalid catalog template');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Vehicle catalog unavailable; keeping authored content.', error);
    return;
  }

  const list = markup.querySelector('.vehicle-catalog-list');
  const template = markup.querySelector('.vehicle-catalog-card');
  const input = markup.querySelector('input');
  const bodyFilter = markup.querySelector('select');
  const status = markup.querySelector('[role="status"]');
  const empty = markup.querySelector('.vehicle-catalog-empty');
  const resetButtons = [...markup.querySelectorAll('.vehicle-catalog-reset')];
  const bodyTypes = new Map();
  const cards = [...block.children].map((row) => {
    const bodyCell = row.children[2];
    const bodyLabel = (bodyCell?.textContent || '').trim();
    const bodyType = bodyLabel.toLocaleLowerCase();
    if (bodyType && !bodyTypes.has(bodyType)) bodyTypes.set(bodyType, bodyLabel);
    const card = template.content.firstElementChild.cloneNode(true);
    while (row.firstElementChild) card.append(row.firstElementChild);
    [...card.children].forEach((cell) => {
      cell.className = cell.children.length === 1 && cell.querySelector('picture')
        ? 'vehicle-catalog-card-image' : 'vehicle-catalog-card-body';
    });
    if (bodyCell) bodyCell.className = 'vehicle-catalog-body-type';
    card.querySelectorAll('picture > img').forEach((image) => {
      image.closest('picture').replaceWith(createOptimizedPicture(image.src, image.alt, false, [{ width: '750' }]));
    });
    const body = card.querySelector('.vehicle-catalog-card-body');
    const name = body?.querySelector('h2, h3, h4, strong') || body;
    const modelName = (name?.textContent || '').trim().toLocaleLowerCase();
    if (name && name !== body) {
      if (name.matches('strong')) {
        const description = name.nextSibling;
        if (description?.nodeType === Node.TEXT_NODE) {
          description.textContent = description.textContent.replace(/^[\s\u2014\u2013-]+/, '');
        }
        const heading = document.createElement('h2');
        heading.className = 'vehicle-catalog-name';
        heading.append(...name.childNodes);
        name.remove();
        body.prepend(heading);
      } else {
        name.classList.add('vehicle-catalog-name');
      }
    }
    list.append(card);
    return { card, name: modelName, bodyType };
  });

  [...bodyTypes].sort((first, second) => first[1].localeCompare(second[1]))
    .forEach(([value, label]) => bodyFilter.add(new Option(label, value)));
  bodyFilter.disabled = bodyTypes.size === 0;

  const filter = () => {
    const query = input.value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(({ card, name, bodyType }) => {
      const matches = name.includes(query)
        && (!bodyFilter.value || bodyType === bodyFilter.value);
      card.hidden = !matches;
      if (matches) count += 1;
    });
    status.textContent = `${count} of ${cards.length} ${cards.length === 1 ? 'vehicle' : 'vehicles'}`;
    empty.hidden = count !== 0;
    resetButtons.forEach((button) => {
      button.disabled = input.value.length === 0 && !bodyFilter.value;
    });
  };
  input.addEventListener('input', filter);
  bodyFilter.addEventListener('change', filter);
  resetButtons.forEach((button) => {
    button.addEventListener('click', () => {
      input.value = '';
      bodyFilter.value = '';
      filter();
      input.focus();
    });
  });
  template.remove();
  block.replaceChildren(...markup.body.children);
  filter();
}
