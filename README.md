# Evidence: Chapter 2 app-preview windows, final visual QA (PR #42)

Captured from a **production build** (`next build` + `next start`) of `feat/landing-ch2-app-previews` at `f10c0300` (PR head `3a7ac38a` + the fix commit below). Headless Chromium on Windows, real `page.mouse.wheel` input (50px every 70ms), not `scrollTo` jumps. It is not a real phone or trackpad: owner approval on a device is still required.

## What QA found at `3a7ac38a` (the commit under review) and what changed

The `BEFORE-*` screenshots show it. At phone widths the compact screens let rows shrink inside `overflow-hidden` cards:

| Screen | Defect at 375/390/430 | Fix in `f10c0300` |
|---|---|---|
| NAPLAN | **Option D lost its lower border, cut 7px** | tighter phone rhythm in the preview only (renderer untouched) |
| AMC | tops of the pattern tiles and both `?` boxes cut (about 18px), "Your working" cut mid-word; Term labels rendered 7.9px at 375 | rows `shrink-0`, decorative working area dropped on phones, term labels 11.5px |
| Selective | answer rows C and D cut at the bottom | shorter pattern cells on phones, rows `shrink-0` |

No layout redesign: desktop compositions, stationary windows, right-hand copy, Chapter 1 and the mirror-mosaic seam are unchanged.

## Contents

- `screenshots/{375,390,430}-{naplan,icas,curriculum,amc,singapore,selective}-window.png` (2x) at `f10c0300`; `sheets/sheet-*.png` one row per width.
- `video/*.webm`: continuous scroll of Chapter 2 down then back up (about 31s each) at 375, 390, 430 (natural flow) and 1440 (pinned). `video/*.log.json`: scroll position and scene against time, frame-gap statistics.
- `sheets/rec-390-*.png`, `sheets/rec-1440-all.png`: the recordings at 2 frames per second, timestamp on every frame.
- `tools/`: capture scripts. Videos are WebM (the available ffmpeg has no H.264).

## Recording review (frame by frame at 2 fps, so sub-500ms glitches could be missed)

Mobile 390 (375 and 430 recorded the same way and match):
- 0.0-3.0s hero to Chapter 2 intro: hero photo scrolls away, header gains "Start free" at 1.0s. Normal scroll, no blank frame.
- 4.0-16.0s: each scene's copy then its preview, in order NAPLAN, ICAS, Curriculum, AMC, Singapore, Selective. No overlap, no layout shift, no blank frame. Previews arrive fitted (no skeleton visible in any frame).
- 12.5s and 14.5s: the Singapore/Selective "Planned" badge wraps to two lines, intentional and readable.
- 16.0s: Selective goes straight into Chapter 3 with only the section gap between them; slightly abrupt but not a defect.
- 16.0-31.0s reverse: same sequence retraced, back to the hero at 30-31s. No glitch.
- Awkward but accepted: the Curriculum (Learn) preview is a lesson page cropped by the window, so its text and chart run out of the frame bottom (mid-scene at 9.0-9.5s and 23.0-23.5s). Deliberate scroll-content crop, no half-cut text lines.

Desktop 1440 (pinned stage):
- 1.5-2.5s and 25.5-26.0s (reverse): mirror-mosaic seam from Chapter 1 into Chapter 2, tiles mask the stage as designed.
- Windows stay on the left, copy on the right, in every frame; no window moves or scales.
- 8.5s, 10.0s, 11.5s (and 19.0-21.5s in reverse): cross-fades show two headings faintly for under half a second, as designed.
- 13.0-14.5s: Selective to "See how MindMosaic works": the Chapter 3 card sits in a lot of empty space for about 1.5s. Spare but not broken.

Frame timing (rAF gaps while scrolling): p95 16.7-16.8ms at every size; one gap over 50ms each at 375, 390 and 1440 (67, 67 and 50ms), none at 430. Their timestamps were not logged, so they are not located in the videos. No console or page errors.

## Test results (run on the same build)

- New `e2e/landing-previews-mobile.spec.ts`: 15 of 15 pass (5 checks x 375/390/430). Run against `3a7ac38a` it failed: `D20` cut off at its bottom by 7.3px, AMC `?` cut at its top by 17.9px.
- `e2e/landing.spec.ts` + the new spec: 74 passed.
- `npm run typecheck` and `npm run lint`: clean. `vitest run src/tests`: 315 files, 5598 tests pass.
- Not re-run locally: `build:webpack` variant used by the Playwright webServer (this was served from the default build), rls, auth e2e, content validators. CI on the PR covers them.
