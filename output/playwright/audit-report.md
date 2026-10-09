# Visual and motion audit

Date: 2026-10-09  
Environment: local Vite server, Playwright CLI, Chromium  
UI guidance: UI/UX Pro Max checks for reduced motion, visible focus, interaction feedback, and restrained motion.

## Coverage

Audited all ten portfolio routes: Home, Hero Preview, Projects, Tech Stack, Experience, Education, Contact, and the Digital E, Food Recipes, and eCoffee case studies. Also opened the generated `404.html` page.

Captured full-page screenshots at desktop 1440×1000 and mobile 390×844. The route screenshots use reduced motion so scroll reveals do not hide below-the-fold content in full-page captures. All ten routes were also checked at mobile width in light theme and Vietnamese.

## Findings

### Medium: page transitions take about 0.8 seconds to finish

- Standard curtain navigation: URL/content changed after about 407 ms; the curtain finished after about 795 ms.
- Project-to-case-study shared image transition: URL/content changed after about 129 ms; the transition finished after about 813 ms.
- The animations run smoothly and the shared transition is supported in the tested browser. Their total duration is longer than the 150–400 ms range suggested by the UI guidance, so repeated navigation may feel slower than necessary. Consider a shorter overall duration if responsiveness is the priority; the existing cinematic pacing is a design choice.

No route-specific visual defect stood out in the captured layouts.

## Checks that passed

- All ten routes have one H1 and no horizontal overflow at desktop and mobile sizes. The same routes have no overflow in the light Vietnamese mobile pass.
- All local images decoded successfully; zero browser console or page errors were recorded across route loading.
- Mobile navigation opens; Escape closes it and restores focus to its toggle. The first Tab reaches the skip link with a visible outline.
- Case-study gallery opens a labelled dialog on desktop and mobile. Escape closes it and restores focus to the gallery trigger.
- Under `prefers-reduced-motion`, the hero ring animation computes to `0s`, reveals are not left pending, and route navigation creates no curtain or running animation.
- The hero uses a single prominent continuous 10-second ring drift in normal motion. Reduced-motion behavior is respected.

## Evidence

- Full-page route screenshots: `home-*`, `hero-preview-*`, `projects-*`, `tech-stack-*`, `experience-*`, `education-*`, `contact-*`, `digital-e-shop-*`, `food-recipes-*`, `ecoffee-*`.
- Not found page: `404-desktop.png`, `404-mobile.png`.
- Interaction states: `mobile-menu-open.png`, `gallery-modal-desktop.png`, `gallery-modal-mobile.png`, `home-light-vi-mobile.png`.
- Navigation comparison: `navigation-motion-before.webm`, `navigation-motion-after.webm`.
- Initial accessible page snapshot and browser console log: `session/`.

This was a visual and interaction audit, not a contrast-ratio or assistive-technology certification.

## Follow-up: transition timing optimization

After the audit, the curtain, shared-image, page-content, and heading entrance timings were shortened. Three Playwright runs on the same localhost routes produced these medians:

- Curtain navigation: **457 ms**, down from 795 ms (about 42% faster).
- Project-to-case-study shared transition: **449 ms**, down from 813 ms (about 45% faster).
- Reduced-motion still reports `0s` animation duration and performs route navigation without a curtain.

See [`transition-optimization.md`](transition-optimization.md) for the files changed and per-run measurements.
