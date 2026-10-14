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
const vietnamesePageDescriptions = {
  '/': 'Nguyễn Mạnh Phú Quý là Kỹ sư phần mềm tại TP. Hồ Chí Minh, tập trung vào backend, TypeScript, Node.js và phát triển sản phẩm full-stack.',
  '/projects/': 'Các dự án phần mềm tiêu biểu của Nguyễn Mạnh Phú Quý: thương mại điện tử, nền tảng công thức nấu ăn và hệ thống quản lý chuỗi cà phê.',
  '/tech-stack/': 'Công nghệ frontend, backend, dữ liệu, kiểm thử và triển khai được Nguyễn Mạnh Phú Quý sử dụng trong các dự án phần mềm.',
  '/experience/': 'Kinh nghiệm và đóng góp kỹ thuật của Nguyễn Mạnh Phú Quý trong phát triển phần mềm tại TP. Hồ Chí Minh.',
  '/education/': 'Quá trình học Khoa học Máy tính, chứng chỉ và chương trình sau đại học của Nguyễn Mạnh Phú Quý.',
  '/contact/': 'Liên hệ Nguyễn Mạnh Phú Quý về cơ hội Software Engineer, dự án frontend, backend và full-stack.',
  '/case-studies/digital-e-shop/': 'Case study Digital E: cửa hàng điện tử và dashboard vận hành full-stack, với kiến trúc, thanh toán, tồn kho và các quyết định kỹ thuật.',
  '/case-studies/food-recipes/': 'Case study Food Recipes: nền tảng khám phá công thức, lập kế hoạch bữa ăn, danh sách mua sắm và quản lý thực phẩm.',
  '/case-studies/ecoffee/': 'Case study eCoffee: nền tảng chuỗi cà phê đa vai trò cho khách hàng, cửa hàng, giao hàng và quản lý tồn kho.',
  [notFoundRoute]: 'Không tìm thấy trang trong portfolio kỹ sư phần mềm của Nguyễn Mạnh Phú Quý.',
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

function createRenderContext(language) {
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

function renderPage(route, contentRoute = route, language = 'en') {
  const { document, window, elements } = createRenderContext(language);
  const context = vm.createContext({
    document,
    window,
    URL,
    location: { pathname: route, hash: '' },
    localStorage: { getItem: key => key === 'portfolio-language' ? language : null },
    history: { scrollRestoration: 'auto' },
  });
  vm.runInContext(source, context);
  const descriptions = language === 'vi' ? vietnamesePageDescriptions : pageDescriptions;
  const pageDescription = descriptions[contentRoute] || descriptions[notFoundRoute];
  const pageTitle = route === notFoundRoute
    ? 'Page not found · Nguyễn Mạnh Phú Quý'
    : document.title;

  const fontStylesheet = 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&amp;family=Bricolage+Grotesque:opsz,wght@12..96,400..800&amp;display=swap';
  const fontStylesheetLink = `<link rel="preload" href="${fontStylesheet}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${fontStylesheet}"></noscript>`;
  const robots = route === notFoundRoute ? 'noindex,follow' : 'index,follow';
  const socialType = contentRoute.startsWith('/case-studies/') ? 'article' : 'website';
  const baseUrl = 'https://nguyenquyportfolio.vercel.app';
  const canonicalUrl = `${baseUrl}${route === notFoundRoute ? '/' : route}`;
  const canonicalMetadata = route === notFoundRoute ? '' : `<link rel="canonical" href="${canonicalUrl}">`;
  const socialUrlMetadata = route === notFoundRoute ? '' : `<meta property="og:url" content="${canonicalUrl}">`;
  const vietnameseRoute = `/vi${contentRoute}`;
  const alternateMetadata = route === notFoundRoute ? ''
    : `<link rel="alternate" hreflang="en" href="${baseUrl}${contentRoute}"><link rel="alternate" hreflang="vi-VN" href="${baseUrl}${vietnameseRoute}"><link rel="alternate" hreflang="x-default" href="${baseUrl}${contentRoute}">`;
  const caseStudySocialImages = {
    '/case-studies/digital-e-shop/': {
      src: '/assets/digital-home-1280.webp',
      alt: ['Digital E production storefront', 'Giao diện cửa hàng production của Digital E'],
    },
    '/case-studies/food-recipes/': {
      src: '/assets/food-discovery-1280.webp',
      alt: ['Food Recipes recipe discovery screen', 'Màn hình khám phá công thức của Food Recipes'],
    },
    '/case-studies/ecoffee/': {
      src: '/assets/ecoffee-customer-1280.webp',
      alt: ['eCoffee customer storefront', 'Giao diện khách hàng eCoffee'],
    },
  };
  const socialImage = caseStudySocialImages[contentRoute] || {
    src: '/assets/hero-ring-v2-1280.webp',
    alt: [
      "Abstract teal and silver sculpture representing Nguyễn Mạnh Phú Quý's software engineering portfolio",
      'Hình khối trừu tượng màu xanh ngọc và bạc đại diện cho portfolio kỹ sư phần mềm của Nguyễn Mạnh Phú Quý',
    ],
  };
  const socialImageUrl = `${baseUrl}${socialImage.src}`;
  const socialImageMetadata = `${socialUrlMetadata}<meta property="og:image" content="${socialImageUrl}"><meta property="og:image:type" content="image/webp"><meta property="og:image:alt" content="${socialImage.alt[language === 'vi' ? 1 : 0]}">`;
  const structuredData = contentRoute === '/'
    ? `<script type="application/ld+json">${JSON.stringify(personSchema)}</script>`
    : '';

  return `<!doctype html>\n<html lang="${language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0b1422"><meta name="author" content="Nguyễn Mạnh Phú Quý"><meta name="robots" content="${robots}"><meta name="description" content="${pageDescription}">${canonicalMetadata}${alternateMetadata}<meta property="og:type" content="${socialType}"><meta property="og:locale" content="${language === 'vi' ? 'vi_VN' : 'en_US'}"><meta property="og:title" content="${pageTitle}"><meta property="og:description" content="${pageDescription}">${socialImageMetadata}<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${pageTitle}"><meta name="twitter:description" content="${pageDescription}"><meta name="twitter:image" content="${socialImageUrl}">${structuredData}<script>try{const savedTheme=localStorage.getItem('portfolio-theme');if(savedTheme==='light'||savedTheme==='dark')document.documentElement.dataset.theme=savedTheme;}catch{}</script><title>${pageTitle}</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>${fontStylesheetLink}<link rel="stylesheet" href="/styles.css?v=46"><link rel="stylesheet" href="/expressive.css?v=53"><script src="/content.js?v=46" defer></script><script src="/motion.js?v=47" defer></script><script src="/app.js?v=50" defer></script></head><body><a class="skip-link" href="#main">Skip to main content</a><header id="header">${elements.header.innerHTML}</header><main id="main" class="page-shell" tabindex="-1">${elements.main.innerHTML}</main><footer id="footer">${elements.footer.innerHTML}</footer><button id="back-to-top" class="back-to-top" type="button" aria-label="${language === 'vi' ? 'Lên đầu trang' : 'Back to top'}" title="${language === 'vi' ? 'Lên đầu trang' : 'Back to top'}"><span class="icon" style="--icon:url('/assets/icons/move-up-right.svg')" aria-hidden="true"></span></button></body></html>\n`;
}

function writePage(route, contentRoute = route, language = 'en') {
  const outputPath = route === notFoundRoute
    ? path.join(outputDirectory, '404.html')
    : path.join(outputDirectory, route, 'index.html');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, renderPage(route, contentRoute, language));
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

for (const route of routes) {
  writePage(route, route, 'en');
  writePage(`/vi${route}`, route, 'vi');
}
writePage(notFoundRoute, notFoundRoute, 'en');

const sitemap = routes.map(route => {
  const englishUrl = `https://nguyenquyportfolio.vercel.app${route}`;
  const vietnameseUrl = `https://nguyenquyportfolio.vercel.app/vi${route}`;
  return `<url><loc>${englishUrl}</loc><xhtml:link rel="alternate" hreflang="en" href="${englishUrl}"/><xhtml:link rel="alternate" hreflang="vi-VN" href="${vietnameseUrl}"/><xhtml:link rel="alternate" hreflang="x-default" href="${englishUrl}"/></url><url><loc>${vietnameseUrl}</loc><xhtml:link rel="alternate" hreflang="en" href="${englishUrl}"/><xhtml:link rel="alternate" hreflang="vi-VN" href="${vietnameseUrl}"/><xhtml:link rel="alternate" hreflang="x-default" href="${englishUrl}"/></url>`;
}).join('');
fs.writeFileSync(path.join(outputDirectory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${sitemap}</urlset>\n`);
fs.writeFileSync(path.join(outputDirectory, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: https://nguyenquyportfolio.vercel.app/sitemap.xml\n');

console.log(`Generated ${routes.length * 2} localized portfolio pages, sitemap, robots.txt, and a 404 page.`);

