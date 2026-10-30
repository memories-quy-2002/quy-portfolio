'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const built = spawnSync(process.execPath, ['scripts/build-pages.cjs'], { cwd: root, encoding: 'utf8' });
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const page = route => fs.readFileSync(path.join(root, 'dist', route, 'index.html'), 'utf8');

test('case studies open with role, scope, problem and outcome evidence', () => {
  for (const route of ['case-studies/digital-e-shop', 'case-studies/food-recipes', 'case-studies/ecoffee']) {
    const html = page(route);
    assert.match(html, /My role|Vai trò của tôi/);
    assert.match(html, /Scope|Phạm vi/);
    assert.match(html, /Outcome|Kết quả/);
  }
});

test('Food Recipes case study scopes its production pantry evidence to the checked query', () => {
  const html = page('case-studies/food-recipes');
  assert.match(html, /searched for “oats” and returned 3 matching recipes/i);
  assert.doesNotMatch(html, /recipe-feed error|currently reports a database error/i);
});

test('case-study pages publish a project-specific social preview image', () => {
  const expectedImages = {
    'case-studies/digital-e-shop': '/assets/digital-home-1280.webp',
    'case-studies/food-recipes': '/assets/food-discovery-1280.webp',
    'case-studies/ecoffee': '/assets/ecoffee-customer-1280.webp',
  };

  for (const [route, image] of Object.entries(expectedImages)) {
    assert.match(page(route), new RegExp(`<meta property="og:image" content="https://www\\.nguyenmanhphuquy\\.info${image.replaceAll('/', '\\/')}"`));
  }
});

test('every indexable page publishes one matching Open Graph and Twitter preview image', () => {
  const routes = [
    '', 'vi',
    'projects', 'vi/projects',
    'tech-stack', 'vi/tech-stack',
    'experience', 'vi/experience',
    'education', 'vi/education',
    'contact', 'vi/contact',
    'case-studies/digital-e-shop', 'vi/case-studies/digital-e-shop',
    'case-studies/food-recipes', 'vi/case-studies/food-recipes',
    'case-studies/ecoffee', 'vi/case-studies/ecoffee',
  ];

  for (const route of routes) {
    const html = page(route);
    const openGraphImages = [...html.matchAll(/<meta property="og:image" content="([^"]+)"/g)].map(([, image]) => image);
    const twitterImages = [...html.matchAll(/<meta name="twitter:image" content="([^"]+)"/g)].map(([, image]) => image);
    assert.equal(openGraphImages.length, 1, `${route || '/'} should publish one og:image`);
    assert.equal(twitterImages.length, 1, `${route || '/'} should publish one twitter:image`);
    assert.equal(twitterImages[0], openGraphImages[0], `${route || '/'} should use the same image for both platforms`);
    assert.match(openGraphImages[0], /^https:\/\/www\.nguyenmanhphuquy\.info\/assets\//, `${route || '/'} should use an absolute production image URL`);
    const assetPath = new URL(openGraphImages[0]).pathname.slice(1).split('/').join(path.sep);
    assert.ok(fs.existsSync(path.join(root, 'dist', assetPath)), `${route || '/'} should point to a generated image asset`);
  }
});

test('case study introductions show a project screenshot before the facts row', () => {
  const expectedImages = {
    'case-studies/digital-e-shop': '/assets/digital-home.webp',
    'case-studies/food-recipes': '/assets/food-discovery.webp',
    'case-studies/ecoffee': '/assets/ecoffee-customer.webp',
  };

  for (const [route, image] of Object.entries(expectedImages)) {
    const html = page(route);
    const heading = html.match(/<section class="case-heading reveal">([\s\S]*?)<\/section>/)?.[1];
    assert.ok(heading, `${route} should render a case heading`);
    assert.match(heading, /class="case-hero-visual"/, `${route} should render its hero visual`);
    assert.ok(heading.indexOf(image) < heading.indexOf('class="case-facts"'), `${route} should show its visual before project facts`);
    assert.match(html, /expressive\.css\?v=59/, `${route} should load the updated visual stylesheet`);
    assert.match(html, /app\.js\?v=52/, `${route} should load the updated page renderer`);
  }
});

test('case studies explain technical decisions and render a flow diagram', () => {
  for (const route of ['case-studies/digital-e-shop', 'case-studies/food-recipes', 'case-studies/ecoffee']) {
    const html = page(route);
    assert.match(html, /Trade-off|Đánh đổi/);
    assert.match(html, /aria-label=".*flow.*"|aria-label=".*luồng.*"/i);
    assert.match(html, /architecture-node/);
  }
});

test('case studies link to the next project and Engineering Notes is removed', () => {
  assert.match(page('case-studies/digital-e-shop'), /Next project/);
  assert.match(page('case-studies/food-recipes'), /href="\/case-studies\/ecoffee\/"/);
  const home = page('');
  assert.doesNotMatch(home, /Engineering Notes|engineering-notes/);
  assert.doesNotMatch(page('projects'), /Engineering Notes|engineering-notes/);
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  assert.doesNotMatch(app, /engineeringNotes|engineering-notes/);
  assert.equal(fs.existsSync(path.join(root, 'dist', 'engineering-notes')), false);
  const stack = page('tech-stack');
  assert.match(stack, /gRPC/);
  assert.match(page('experience'), /CT Group Hi-Tech/);
});

test('each case study keeps a distinct next project and shows one alternate project', () => {
  const expectedAlternate = {
    'case-studies/digital-e-shop': 'ecoffee',
    'case-studies/food-recipes': 'digital-e-shop',
    'case-studies/ecoffee': 'food-recipes',
  };

  for (const [route, alternate] of Object.entries(expectedAlternate)) {
    const html = page(route);
    const related = html.match(/<div class="project-grid related">([\s\S]*?)<\/div><\/section>/)?.[1];
    assert.ok(related, `${route} should render related-project navigation`);
    const projectIds = [...related.matchAll(/data-project="([^"]+)"/g)].map(([, id]) => id);
    assert.deepEqual(projectIds, [alternate], `${route} should show only the non-next alternative`);
  }

  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /\.project-grid\.related \.project-stage\{display:none\}/);
});

test('case study walkthrough is omitted when no real media is configured', () => {
  for (const route of ['case-studies/digital-e-shop', 'case-studies/food-recipes', 'case-studies/ecoffee']) {
    assert.doesNotMatch(page(route), /<video\b|youtube\.com\/embed|vimeo\.com\/video/);
  }
});

// Each rendered technology chip must have a locally available brand asset.
test('all case-study technology chips include a local logo', () => {
  for (const route of ['case-studies/digital-e-shop', 'case-studies/food-recipes', 'case-studies/ecoffee']) {
    const html = page(route);
    const groups = [...html.matchAll(/<div class="tags">([\s\S]*?)<\/div>/g)];
    assert.ok(groups.length, route);
    for (const [, group] of groups) {
      for (const [, chip] of group.matchAll(/<span>([\s\S]*?)<\/span>/g)) {
        const image = chip.match(/src="(\/assets\/logos\/[^"?]+\.svg)"/);
        assert.ok(image, `Missing logo in ${route}: ${chip}`);
        assert.ok(fs.existsSync(path.join(root, 'dist', image[1])), image[1]);
      }
    }
  }
});

test('Digital E and Food Recipes show the requested case-study technology stacks', () => {
  const expected = {
    'case-studies/digital-e-shop': ['React', 'NestJS', 'MySQL', 'TypeScript', 'Prisma', 'Firebase', 'Tailwind CSS', 'Docker', 'Vercel', 'Cloudflare Workers'],
    'case-studies/food-recipes': ['React', 'NestJS', 'PostgreSQL', 'TypeScript', 'Prisma', 'Redux Toolkit', 'TanStack Query', 'Tailwind CSS', 'Docker', 'Playwright'],
  };

  for (const [route, technologies] of Object.entries(expected)) {
    const html = page(route);
    const factsStart = html.indexOf('<div class="case-facts">');
    const tagsStart = html.indexOf('<div class="tags">', factsStart);
    const tagsEnd = html.indexOf('</div>', tagsStart);
    assert.ok(factsStart >= 0 && tagsStart >= 0 && tagsEnd > tagsStart, `${route} should render technology facts`);
    const technologyMarkup = html.slice(tagsStart, tagsEnd);
    const rendered = [...technologyMarkup.matchAll(/data-tag="([^"]+)"/g)].map(([, name]) => name);
    assert.deepEqual(rendered, technologies, `${route} should use the requested technology order`);
  }
});

test('architecture maps show repository-backed paths and eCoffee evidence status', () => {
  const digital = page('case-studies/digital-e-shop');
  assert.match(digital, /Firebase Authentication/);
  assert.match(digital, /PayOS checkout &amp; webhook|PayOS checkout & webhook/);
  assert.match(digital, /docs\/ARCHITECTURE\.md/);
  const food = page('case-studies/food-recipes');
  assert.match(food, /Direct image upload/);
  assert.match(food, /Signed upload grant → object storage/);
  assert.doesNotMatch(food, /short-lived signed grant/);
  assert.match(food, /PostgreSQL \+ Prisma/);
  const coffee = page('case-studies/ecoffee');
  assert.match(coffee, /Target · partly verified/);
  assert.match(coffee, /Transactional outbox/);
  assert.match(coffee, /not an exactly-once claim/);
  for (const html of [digital, food, coffee]) {
    assert.match(html, /architecture-track/);
    assert.match(html, /architecture-connector/);
    assert.match(html, /aria-label="[^"]*(?:flow|luồng)[^"]*"/i);
    assert.doesNotMatch(html, /<span class="architecture-node-role"|<p>Feature modules cover|<p>Persists recipe data/);
  }
});

test('Experience uses the supplied CT Group Hi-Tech and TMA logos', () => {
  const html = page('experience');
  for (const [company, asset] of [
    ['CT Group Hi-Tech', '/assets/logos/ct-group-hi-tech.svg'],
    ['TMA Solutions', '/assets/logos/tma-solutions.svg'],
  ]) {
    assert.ok(html.includes(`<h2>${company}</h2>`));
    assert.ok(html.includes(`src="${asset}"`));
    assert.ok(fs.existsSync(path.join(root, 'dist', asset)));
  }
  assert.match(html, /data-company="ct-group"/);
});


test('header and footer present the updated personal brand consistently', () => {
  const home = page('');
  assert.match(home, /aria-label="Nguyễn Mạnh Phú Quý"/);
  assert.match(home, /class="brand-mark" aria-hidden="true">PQ<\/span>/);
  assert.match(home, /class="brand-label">Phú Quý<\/span>/);
  assert.match(home, /class="footer-full-name">Nguyễn Mạnh Phú Quý<\/span>/);
  assert.match(home, /© 2026 Nguyễn Mạnh Phú Quý/);
  assert.match(home, /<title>Nguyễn Mạnh Phú Quý \| Software Engineer & Full-stack Developer<\/title>/);
  assert.doesNotMatch(home, /quý<span>\.dev|Quý Nguyễn/);
});


test('CT Group logo stays compact inside the framed experience tile', () => {
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /experience-top \.company-mark-ct-group img\{width:auto;height:auto;max-width:42px;max-height:52px/);
  assert.match(css, /experience-top \.company-mark-ct-group\{width:112px;height:68px/);
});

test('Experience logos preserve their source colors and masked tag icons use the accent', () => {
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /\.company-mark-tma img\{filter:none\}/);
  assert.match(css, /\.experience-top \.company-mark-tma\{[^}]*background:#0c3e50[^}]*border:1px solid #2d6570/);
  assert.match(css, /\.tags \.tag-icon\{[^}]*background:currentColor;color:#9bc5ce\}/);
  assert.match(css, /\.experience-card\[data-company="ct-group"\] \.tags \.tag-icon\{color:#9fc7ff\}/);
});

test('Navigation and footer hover feedback uses stable, padded hit areas', () => {
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /@media\(min-width:1101px\)\{\.site-nav\{gap:4px\}\.site-nav a\{padding:8px 8px;min-height:44px;border-radius:7px/);
  assert.match(css, /\.site-nav a:hover\{background:#74e8d118\}/);
  assert.match(css, /\.footer-links a,\.footer-social a\{min-height:40px;padding:7px 9px;border-radius:7px/);
  assert.doesNotMatch(css, /\.site-nav a:hover\{[^}]*padding:/);
});

test('Experience cards use even timeline spacing and relevant icons', () => {
  const html = page('experience');
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /--experience-gap:32px/);
  assert.match(css, /height:calc\(100% \+ var\(--experience-gap\)\)/);
  assert.equal((html.match(/class="experience-card reveal"/g) || []).length, 3);
  assert.doesNotMatch(html, /Career break|Professional development/);
  assert.match(html, /data-tag="React"[^>]*>[\s\S]*?assets\/logos\/react\.svg/);
  assert.match(html, /data-tag="Git"[^>]*>[\s\S]*?assets\/icons\/code-xml\.svg/);
  for (const iconName of ['cpu', 'layers', 'code-xml', 'book-open', 'move-up-right', 'monitor']) {
    assert.ok(fs.existsSync(path.join(root, 'dist', 'assets', 'icons', `${iconName}.svg`)), iconName);
  }
});

test('Footer has clear navigation, social links, and a back-to-top action', () => {
  const html = page('/');
  assert.match(html, /class="footer-main"/);
  assert.match(html, /aria-label="Footer navigation"/);
  assert.match(html, /class="footer-social"/);
  assert.match(html, /linkedin\.com\/in\/memories2002/);
  assert.match(html, /github\.com\/memories-quy-2002/);
  assert.match(html, /<button id="back-to-top" class="back-to-top"[^>]*aria-label="Back to top"/);
  assert.match(html, /expressive\.css\?v=59/);
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /footer-social a:first-child img\{filter:none\}/);
});

test('Theme toggle is available on every route and persists the selected theme', () => {
  for (const route of ['', 'experience', 'projects', 'tech-stack', 'contact', 'education', 'case-studies/digital-e-shop', 'case-studies/food-recipes', 'case-studies/ecoffee']) {
    const html = page(route);
    assert.match(html, /data-theme-toggle/);
    assert.match(html, /portfolio-theme/);
    assert.match(html, /expressive\.css\?v=59/);
  }
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  const home = page('/');
  assert.match(app, /function applyTheme\(/);
  assert.match(app, /localStorage\.setItem\('portfolio-theme',theme\)/);
  assert.match(app, /data-theme-toggle/);
  assert.match(home, /Switch to light mode/);
  assert.match(home, /assets\/icons\/sun\.svg/);
  for (const icon of ['sun', 'moon']) assert.ok(fs.existsSync(path.join(root, 'dist', 'assets', 'icons', `${icon}.svg`)));
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  for (const selector of [
    'html[data-theme="light"] .project-summary h3',
    'html[data-theme="light"] .principle',
    'html[data-theme="light"] .credential-card',
    'html[data-theme="light"] .architecture-node h3',
  ]) assert.ok(css.includes(selector), selector);
  assert.doesNotMatch(css, /engineering-note|note-summary/);
});

test('home hero renders the interactive orbital systems visualization', () => {
  const home = page('/');
  const app = fs.readFileSync(path.join(root, 'dist', 'app.js'), 'utf8');
  assert.match(home, /data-system-visual/);
  assert.match(home, /class="system-core"/);
  assert.match(home, /\/assets\/hero\/orbit\/core\.webp/);
  assert.match(app, /data-system-node/);
  for (const asset of ['core', 'cloud', 'code', 'database', 'events', 'gear', 'server']) {
    assert.ok(fs.existsSync(path.join(root, 'dist', 'assets', 'hero', 'orbit', asset + '.webp')), asset);
  }
});

test('light navigation and case-study feature cards use light surfaces with dark text', () => {
  const css = fs.readFileSync(path.join(root, 'dist', 'expressive.css'), 'utf8');
  assert.match(css, /html\[data-theme="light"\] \.site-nav\{background:transparent\}/);
  assert.match(css, /html\[data-theme="light"\] \.site-nav\.open\{background:#f8fbfd/);
  assert.match(css, /html\[data-theme="light"\] \.case-section \.feature-grid>div\{color:var\(--ink\);background:linear-gradient/);
  for (const route of ['case-studies/digital-e-shop', 'case-studies/food-recipes', 'case-studies/ecoffee']) {
    assert.match(page(route), /class="feature-grid"/);
  }
});
