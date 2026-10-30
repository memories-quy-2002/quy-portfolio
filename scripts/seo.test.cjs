'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const siteUrl = 'https://www.nguyenmanhphuquy.info';
const routes = ['/', '/projects/', '/tech-stack/', '/experience/', '/education/',
  '/contact/', '/case-studies/digital-e-shop/', '/case-studies/food-recipes/',
  '/case-studies/ecoffee/'];
const built = spawnSync(process.execPath, ['scripts/build-pages.cjs'], { cwd: root, encoding: 'utf8' });
if (built.status !== 0) throw new Error(built.stderr || built.stdout);
const read = file => fs.readFileSync(path.join(root, 'dist', file), 'utf8');
const page = route => read(path.join(route.slice(1), 'index.html'));
const manifestSource = read('seo.js');
const manifestMatch = /^window\.PortfolioSeo = Object\.freeze\((.*)\);\s*$/s.exec(manifestSource);
assert.ok(manifestMatch, 'SEO manifest must contain JSON in a browser script');
const manifest = JSON.parse(manifestMatch[1]);

test('all eighteen localized pages use the custom domain as canonical', () => {
  for (const route of routes) {
    for (const localized of [route, '/vi' + route]) {
      const html = page(localized);
      const canonical = siteUrl + localized;
      assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'), localized);
      assert.ok(html.includes('<meta property="og:url" content="' + canonical + '">'), localized);
      assert.doesNotMatch(html, /nguyenquyportfolio\.vercel\.app/);
      assert.equal(manifest[localized].canonicalUrl, canonical);
      assert.equal(manifest[localized].title, /<title>([^<]+)<\/title>/.exec(html)?.[1]);
      assert.ok(html.includes('<script src="/seo.js?v=1" defer></script>'));
    }
  }
});

test('hreflang is reciprocal for EN, VI and x-default', () => {
  for (const route of routes) {
    const en = siteUrl + route;
    const vi = siteUrl + '/vi' + route;
    for (const localized of [route, '/vi' + route]) {
      const html = page(localized);
      assert.ok(html.includes('<link rel="alternate" hreflang="en" href="' + en + '">'), localized);
      assert.ok(html.includes('<link rel="alternate" hreflang="vi-VN" href="' + vi + '">'), localized);
      assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="' + en + '">'), localized);
    }
  }
});

test('sitemap contains 18 localized URLs and robots references only the new host', () => {
  const xml = read('sitemap.xml');
  const robots = read('robots.txt');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  assert.equal(urls.length, routes.length * 2);
  for (const route of routes) {
    assert.ok(urls.includes(siteUrl + route));
    assert.ok(urls.includes(siteUrl + '/vi' + route));
  }
  assert.ok(robots.includes('Sitemap: ' + siteUrl + '/sitemap.xml'));
  assert.doesNotMatch(xml + robots, /nguyenquyportfolio\.vercel\.app/);
});

test('person schema uses the canonical identity on both homepages', () => {
  for (const route of ['/', '/vi/']) {
    const schemaText = /<script id="portfolio-person-schema" type="application\/ld\+json">([^<]+)<\/script>/.exec(page(route))?.[1];
    assert.ok(schemaText, route);
    const person = JSON.parse(schemaText);
    assert.equal(person['@type'], 'Person');
    assert.equal(person['@id'], siteUrl + '/#person');
    assert.equal(person.url, siteUrl + '/');
    assert.ok(person.sameAs.some(url => url.includes('linkedin.com')));
    assert.ok(person.sameAs.some(url => url.includes('github.com')));
  }
  assert.doesNotMatch(page('/projects/'), /id="portfolio-person-schema"/);
  assert.equal(manifest['/projects/'].person, null);
});

test('social previews reference real assets on the canonical origin', () => {
  for (const route of routes) {
    for (const localized of [route, '/vi' + route]) {
      const metadata = manifest[localized];
      assert.ok(metadata.imageUrl.startsWith(siteUrl + '/assets/'));
      assert.ok(page(localized).includes('<meta name="twitter:image" content="' + metadata.imageUrl + '">'));
      assert.ok(fs.existsSync(path.join(root, 'dist', new URL(metadata.imageUrl).pathname.slice(1))));
    }
  }
});

test('404 is noindex without a canonical link; no forced legacy-domain redirect is added', () => {
  const notFound = read('404.html');
  assert.match(notFound, /<meta name="robots" content="noindex,follow">/);
  assert.doesNotMatch(notFound, /<link rel="canonical"/);
  assert.equal(manifest['/404/'].canonicalUrl, null);
  const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  assert.ok(!(vercel.redirects || []).some(rule => JSON.stringify(rule).includes('nguyenquyportfolio.vercel.app')));
});
