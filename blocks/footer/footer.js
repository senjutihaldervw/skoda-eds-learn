import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

function createDriveMatchFooter() {
  const section = document.createElement('div');
  section.className = 'section';
  section.innerHTML = `<div class="default-content-wrapper">
    <div class="footer-brand">
      <p class="footer-logo"><a href="/">Skoda DriveMatch</a></p>
      <p>Explore Skoda models, compare body styles, and build a confident shortlist for everyday driving.</p>
    </div>
    <nav class="footer-links" aria-label="Footer navigation">
      <a href="/">Home</a>
      <a href="/vehicles">Vehicles</a>
      <a href="/vehicles?body=suv">SUVs</a>
      <a href="/vehicles?body=electric-suv">Electric</a>
    </nav>
    <p class="footer-note">Sample learning project. Vehicle information is illustrative and not current pricing, availability, or offer data.</p>
  </div>`;
  return section;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  if (/Copyright © 2025 Adobe|Do not sell my personal information|AdChoices/i.test(footer.textContent)) {
    footer.replaceChildren(createDriveMatchFooter());
  }

  block.append(footer);
}
