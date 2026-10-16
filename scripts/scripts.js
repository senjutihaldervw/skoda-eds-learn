import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    main.querySelectorAll('.cards.vehicles').forEach((block) => {
      block.classList.replace('cards', 'vehicle-catalog');
    });
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    // require authored formatting for buttonization
    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

/**
 * Replaces the stock boilerplate home signals until the authored homepage is updated.
 * @param {HTMLElement} main The main container element
 */
function decorateHomePage(main) {
  if (window.location.pathname !== '/') return;
  document.body.classList.add('home-page');
  if (document.title === 'Home | AEM Boilerplate') document.title = 'Home | Skoda DriveMatch';

  const heroHeading = main.querySelector('.hero h1');
  if (!heroHeading) return;

  const stockHeading = /cong+r+ats|welcome to .*eds|welcome to aem boilerplate|boilerplate/i.test(heroHeading.textContent);
  if (!stockHeading) return;

  heroHeading.textContent = 'Explore Skoda models with confidence';
  const hero = heroHeading.closest('.hero');
  hero.classList.add('home-hero');
  hero.querySelectorAll('p').forEach((paragraph) => {
    if (!paragraph.querySelector('img, picture')) paragraph.remove();
  });

  const intro = document.createElement('p');
  intro.className = 'home-hero-copy';
  intro.textContent = 'Compare body styles, scan the latest range, and move from curiosity to shortlist without the boilerplate noise.';
  heroHeading.after(intro);

  const ctas = document.createElement('p');
  ctas.className = 'button-wrapper home-hero-actions';
  ctas.innerHTML = '<a class="button primary" href="/vehicle-catalog">Browse vehicles</a><a class="button secondary" href="#main">Learn more</a>';
  intro.after(ctas);
  main.querySelectorAll('.columns picture, .cards picture').forEach((picture) => picture.remove());

  const copyUpdates = new Map([
    ['This is another headline here for more content', 'A clearer way to shortlist'],
    ['Columns block', 'Start with what matters'],
    ['One', 'Body style'],
    ['Two', 'Space'],
    ['Three', 'Everyday driving'],
    ['Or you can just view the preview', 'Keep comparing until the right model stands out.'],
    ['Boilerplate Highlights?', 'Why DriveMatch feels easier'],
    ['Find some of our favorite staff picks below:', 'Helpful signals for choosing a model that fits your week, your journeys, and your budget.'],
    ['Unmatched speed', 'Browse the range quickly'],
    ['AEM is the fastest way to publish, create, and serve websites', 'Move through Skoda body styles and model highlights without waiting on a heavy interface.'],
    ['Content at scale', 'Compare practical details'],
    ['AEM allows you to publish more content in shorter time with smaller teams', 'Bring key vehicle information into one tidy view so the differences are easier to scan.'],
    ['Uncertainty eliminated', 'Shortlist with confidence'],
    ['Preview content at 100% fidelity, get predictable content velocity, and shorten project durations', 'Use clear cards, filters, and cues to move from browsing to a realistic choice.'],
    ['Widen the talent pool', 'Built for everyday needs'],
    ['Authors on AEM use Microsoft Word, Excel or Google Docs and need no training', 'Focus on the things drivers actually weigh up: space, comfort, utility, and style.'],
    ['The low-code way to developer productivity', 'Simple paths to action'],
    ['Say goodbye to complex APIs spanning multiple languages. Anyone with a little bit of HTML, CSS, and JS can build a site on AEM.', 'Jump straight into the catalog, then refine by the signals that matter most.'],
    ['Headless is here', 'Flexible by design'],
    ['Go directly from Microsoft Excel or Google Sheets to the web in mere seconds. Sanitize and collect form data at extreme scale with AEM Forms.', 'The experience adapts to authored vehicle content while staying clean and focused.'],
    ['Peak performance', 'Ready for the next step'],
    ["Use AEM's serverless architecture to meet any traffic need. Use AEM's PageSpeed Insights Github action to evaluate every Pull-Request for Lighthouse Score.", 'Once a model catches your eye, the journey forward is clear and uncluttered.'],
  ]);

  main.querySelectorAll('h2, p, li, strong, a').forEach((element) => {
    const text = element.textContent.trim();
    if (copyUpdates.has(text)) element.textContent = copyUpdates.get(text);
  });

  main.querySelectorAll('a[href="/"]').forEach((link) => {
    if (['Live', 'Preview'].includes(link.textContent.trim())) {
      link.textContent = link.textContent.trim() === 'Live' ? 'View catalog' : 'Compare options';
      link.href = '/vehicle-catalog';
    }
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  decorateHomePage(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
