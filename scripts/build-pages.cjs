'use strict';
/** Produce directly addressable HTML pages from the shared portfolio renderer. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const outputDirectory = path.join(root, 'dist');
const sourceDirectory = path.join(root, 'src');
const publicDirectory = path.join(root, 'public');
const rendererFiles = ['content.js', path.join('client', 'app.js')];
const source = rendererFiles
  .map(file => fs.readFileSync(path.join(sourceDirectory, file), 'utf8'))
  .join('\n');
const routes = [
  '/',
  '/hero-preview/',
  '/projects/',
  '/tech-stack/',
  '/experience/',
  '/education/',
  '/contact/',
  '/case-studies/digital-e-shop/',
  '/case-studies/food-recipes/',
  '/case-studies/ecoffee/',
];
const notFoundRoute = '/404/';
const description = 'Nguyễn Mạnh Phú Quý — Software Engineer. Projects, experience, education, and technology across frontend, backend, and full-stack development.';
const pageDescriptions = {
  '/': description,
  '/hero-preview/': description,
  '/projects/': 'Selected software projects by Nguyễn Mạnh Phú Quý, including full-stack e-commerce, a recipe platform, and a coffee franchise system.',
  '/tech-stack/': 'Frontend, backend, data, and delivery technologies used by software engineer Nguyễn Mạnh Phú Quý.',
  '/experience/': 'Professional experience and engineering contributions of Nguyễn Mạnh Phú Quý in Ho Chi Minh City.',
  '/education/': 'Computer Science education, certifications, and ongoing postgraduate study of Nguyễn Mạnh Phú Quý.',
  '/contact/': 'Contact Nguyễn Mạnh Phú Quý about software engineering opportunities and projects.',
  '/case-studies/digital-e-shop/': 'A full-stack electronics storefront and operations platform. Explore the architecture, checkout, inventory, and engineering decisions behind Digital E.',
  '/case-studies/food-recipes/': 'A full-stack cooking platform for recipe discovery, meal planning, shopping, and pantry workflows. Read the Food Recipes case study.',
  '/case-studies/ecoffee/': 'A multi-role coffee franchise platform spanning customer orders, store operations, delivery, and inventory. Read the eCoffee engineering case study.',
  [notFoundRoute]: 'The requested page could not be found in Nguyễn Mạnh Phú Quý’s engineering portfolio.',
};
const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Nguyễn Mạnh Phú Quý',
  jobTitle: 'Software Engineer',
  worksFor: { '@type': 'Organization', name: 'FPT Software' },
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Ho Chi Minh City University of Technology',
  },
  sameAs: [
    'https://www.linkedin.com/in/memories2002',
    'https://github.com/memories-quy-2002',
  ],
};

function createRenderContext() {
  const elements = { main: {}, header: {}, footer: {} };
  const noop = () => {};
  const control = { addEventListener: noop, style: {} };
  for (const element of Object.values(elements)) {
    Object.assign(element, {
      querySelectorAll: () => [],
      querySelector: () => control,
      focus: noop,
      setAttribute: noop,
    });
  }

  const document = {
    documentElement: { scrollHeight: 1000, dataset: {} },
    getElementById: id => elements[id],
    querySelector: () => ({}),
    addEventListener: noop,
  };
  const window = {
    matchMedia: () => ({ matches: true, addEventListener: noop }),
    addEventListener: noop,
    scrollY: 0,
    innerHeight: 900,
  };

  return { document, window, elements };
}

function renderPage(route) {
  const { document, window, elements } = createRenderContext();
  const context = vm.createContext({
    document,
    window,
    URL,
    location: { pathname: route, hash: '' },
    localStorage: { getItem: () => null },
    history: { scrollRestoration: 'auto' },
  });
  vm.runInContext(source, context);
  const pageDescription = pageDescriptions[route] || pageDescriptions[notFoundRoute];
  const pageTitle = route === notFoundRoute
    ? 'Page not found · Nguyễn Mạnh Phú Quý'
    : document.title;

  const fontStylesheet = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;family=Bricolage+Grotesque:opsz,wght@12..96,400..800&amp;display=swap';
  const fontStylesheetLink = `<link rel="preload" href="${fontStylesheet}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${fontStylesheet}"></noscript>`;
  const robots = route === notFoundRoute ? 'noindex,follow' : 'index,follow';
  const socialType = route.startsWith('/case-studies/') ? 'article' : 'website';
  const structuredData = route === '/'
    ? `<script type="application/ld+json">${JSON.stringify(personSchema)}</script>`
    : '';

  return `<!doctype html>\n<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0b1422"><meta name="author" content="Nguyễn Mạnh Phú Quý"><meta name="robots" content="${robots}"><meta name="description" content="${pageDescription}"><meta property="og:type" content="${socialType}"><meta property="og:locale" content="en_US"><meta property="og:title" content="${pageTitle}"><meta property="og:description" content="${pageDescription}"><meta name="twitter:card" content="summary_large_image">${structuredData}<script>try{const savedTheme=localStorage.getItem('portfolio-theme');if(savedTheme==='light'||savedTheme==='dark')document.documentElement.dataset.theme=savedTheme;}catch{}</script><title>${pageTitle}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${fontStylesheetLink}<link rel="stylesheet" href="/styles.css?v=44"><link rel="stylesheet" href="/expressive.css?v=44"><script src="/content.js?v=44" defer></script><script src="/motion.js?v=44" defer></script><script src="/app.js?v=44" defer></script></head><body><a class="skip-link" href="#main">Skip to main content</a><header id="header">${elements.header.innerHTML}</header><main id="main" class="page-shell" tabindex="-1">${elements.main.innerHTML}</main><footer id="footer">${elements.footer.innerHTML}</footer></body></html>\n`;
}

function writePage(route) {
  const outputPath = route === notFoundRoute
    ? path.join(outputDirectory, '404.html')
    : path.join(outputDirectory, route, 'index.html');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPage(route));
}

// `dist` is generated output. Copy stable public URLs and source assets there
// before rendering the HTML documents that reference them.
if (path.dirname(outputDirectory) !== root) {
  throw new Error(`Refusing to clean output outside the project root: ${outputDirectory}`);
}
fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory, { recursive: true });
fs.cpSync(publicDirectory, outputDirectory, { recursive: true });
for (const [sourcePath, outputName] of [
  [path.join(sourceDirectory, 'client', 'app.js'), 'app.js'],
  [path.join(sourceDirectory, 'client', 'motion.js'), 'motion.js'],
  [path.join(sourceDirectory, 'content.js'), 'content.js'],
  [path.join(sourceDirectory, 'styles', 'styles.css'), 'styles.css'],
  [path.join(sourceDirectory, 'styles', 'expressive.css'), 'expressive.css'],
]) {
  fs.copyFileSync(sourcePath, path.join(outputDirectory, outputName));
}

for (const route of [...routes, notFoundRoute]) {
  writePage(route);
}

console.log(`Generated ${routes.length} addressable portfolio pages and a 404 page.`);
