# Transition timing optimization

Date: 2026-10-09  
Measured in Chromium through Playwright CLI against the local Vite server.

## Changes

- Shortened the curtain entrance and exit phases in `src/client/motion.js` while keeping its cover-and-reveal sequence.
- Shortened the shared project image/title view transition to 300 ms.
- Found and shortened the longer page-content entrance (500 ms) and title-rise animation (950 ms plus line delays) that continued after the shared-element transition.
- Kept the reduced-motion path unchanged.

## Before and after

| Flow | Before | After runs | Median change |
| --- | ---: | ---: | ---: |
| Curtain route navigation, complete | 795 ms | 500 / 457 / 442 ms | 457 ms, 42% faster |
| Project card to case study, complete | 813 ms | 519 / 449 / 432 ms | 449 ms, 45% faster |

Content switched at a median of 254 ms for curtain navigation and 68 ms for shared transitions in the after runs. The rest of each measurement is the visible transition completing.

Reduced-motion verification: hero ring `0s`, view-transition group `0s`, no pending reveals, and no curtain navigation.

Validation: `pnpm build`, `pnpm lint`, and the three repeated Playwright navigation measurements passed. The project test suite was not run.

Playback comparison: `navigation-motion-before.webm` and `navigation-motion-after.webm`.
