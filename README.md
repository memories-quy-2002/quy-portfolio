# Quý's portfolio prototype

Bilingual static portfolio with Home, Projects, Tech Stack, Experience, Education, Contact, and three project case studies. Every route has a generated HTML document; client navigation progressively enhances these links with transitions. Language is a local device preference. The Contact page links the downloadable CV; direct email stays hidden until an address is supplied.

## Development and build

Use pnpm (`pnpm-lock.yaml` is the canonical lockfile):

```sh
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm typecheck
pnpm check
```

`pnpm dev` rebuilds the site, then serves the generated `dist/` directory with Vite. Run the build again after changing source files while the dev server is running. The builder reads page content from `src/content.js`, browser code from `src/client/`, styles from `src/styles/`, and static files from `public/`. It recreates `dist/` on each build; treat that folder as generated output.

`pnpm lint` checks JavaScript syntax. `pnpm typecheck` reports that type checking is skipped because this project has no TypeScript sources or compiler. `pnpm check` runs lint, typecheck, tests, and build in sequence; `pnpm preview` serves the already built site locally.

To regenerate the downloadable CV, run `python scripts/build-resume.py` before `pnpm build`. It writes the PDF to `public/assets/documents/`, where the normal build copies it to the output.

## Content and imagery

Project technology and capabilities for Digital E and Food Recipes were checked against their public repository READMEs on 2026-10-04. Digital E and Food Recipes project descriptions now follow owner-provided LinkedIn details. Employment and education dates reflect the same source; eCoffee case study uses the owner's previously shared implementation context.

- https://github.com/memories-quy-2002/digital-e-shop
- https://github.com/memories-quy-2002/Food-recipes
- Digital E screenshot: https://digital-e.vercel.app/
- Food Recipes screenshot: https://foodrecipes1.vercel.app/account

The current Food Recipes gallery uses user-provided production captures of recipe discovery and a Banana Oat Pancakes detail screen, with pantry ingredient entry and account access as additional screens. A public production check on October 10, 2026 searched for “oats” and returned 3 matching recipes; this confirms that query only, and results depend on the live catalog. No generated visuals are presented as production screenshots.

Technology logos: Devicon v2.17.0 (MIT). Interface icons: Lucide (ISC). Licenses are included under public/assets. Brand logos are unmodified; FPT and TMA images are from their official websites.

- https://fptsoftware.com/-/media/project/fpt-software/fso/uplift/home/logo_fpt_text_black.png
- https://www.tmasolutions.com/TMA-favicon.webp
- https://devicon.dev/
- https://lucide.dev/

Design research: Dennis Snellenberg’s work index and Bruno Simon’s portfolio. Their expressive presentation informed the direction; their assets and layouts were not copied.

Hero artwork: original image generated for this portfolio. Brief: premium glass and brushed-metal knot, cyan rim lighting, navy backdrop, centered sculptural composition, no text, logos, people, or interface chrome.

## Motion and accessibility

Client navigation uses a layered full-screen curtain driven by the Web Animations API, with a CSS fallback. The route swaps after the curtain covers the current page. Navigation cancellation prevents stale callbacks from overwriting the latest route. IntersectionObserver enables scroll reveals. Reduced-motion preferences disable animation. Mobile navigation includes an expanded state and Escape handling. Deep links work independently of enhanced client navigation.

## October 5 visual upgrade

Home and Projects retain vertical project presentations. Digital E has production captures for the storefront, catalog, and product detail. Food Recipes now leads with user-provided production captures of recipe discovery and a recipe detail page, followed by pantry ingredient entry and account access. The pantry caption explicitly discloses the failing recipe feed and does not imply successful recipe matching.

Case studies have keyboard-operable image galleries and native modal dialogs. Project links use the browser View Transition API for shared image/title transitions where supported, with the existing curtain as fallback. Hero pointer movement is bounded and disabled for touch and reduced motion. Case study navigation tracks the visible chapter. Technology details link to relevant projects; employment details can be expanded.

Automated `pnpm test` checks generated route markup, case-study content and evidence, local technology assets, and selected CSS contracts. It does not automate gallery, modal, focus-return, or navigation-transition behavior. A manual browser review on October 10, 2026 covered mobile navigation at 390 px, direct Vietnamese routing, and desktop layout at 1280 px and 1440 px; the 1280 px artwork overflow was corrected in the stylesheet. These manual checks do not replace repeatable browser journeys or prove native animation behavior across browsers.

Further design reference: https://bruno-simon.com/ (interactive portfolio experience) and https://brittanychiang.com/ (project/experience context). No reference site imagery or source was copied.

HCMUT logo: official brand identity page https://stagging.hcmut.edu.vn/gioi-thieu/nhan-dien-thuong-hieu ; original standard mark https://stagging.hcmut.edu.vn/assets/logo.png .
Fragment history within a case study preserves the mounted page and bypasses page transitions. Contact banner line breaks are replaced with spaces for the inline title.

## Profile refresh · 5 October 2026

Experience dates, role titles, education timeline, GPA, and credentials reflect the owner-provided LinkedIn profile text. Unknown personal contact information is omitted. The downloadable CV uses the same verified dates. Digital-E's profile summary and technology list follow the owner-provided LinkedIn project entry.

## SEO and two active domains

Both `https://nguyenquyportfolio.vercel.app` and `https://www.nguyenmanhphuquy.info` should remain accessible on the **same Vercel project**. There is intentionally **no redirect** from the Vercel hostname to the custom hostname. The custom hostname is the canonical URL for search engines; serving the same content from both hosts without a redirect is expected, and Google may choose to index only the canonical address.

The static builder generates per-route EN/VI titles, descriptions, canonical and reciprocal hreflang links, Open Graph/Twitter tags, `sitemap.xml`, `robots.txt`, and a Person JSON-LD schema. The generated `seo.js` manifest keeps metadata in sync when client navigation uses `history.pushState`. Update the `siteUrl` constant in `scripts/build-pages.cjs` if the primary SEO domain ever changes.

Run `pnpm check` for SEO regression coverage. After deployment, verify `/robots.txt`, `/sitemap.xml`, and the English/Vietnamese routes on both hosts. Add the custom domain in Google Search Console, verify ownership and submit `https://www.nguyenmanhphuquy.info/sitemap.xml`. DNS and Search Console setup are external steps, not controlled by repository code.
