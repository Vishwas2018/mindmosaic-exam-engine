# Evidence: Chapter 1 six-scene scroll-driven hero (PR #40)

Branch `feat/landing-ch1-six-scene-scroll`, compared with `origin/dev` at `cd136c09ca21b71fb8bfb9d2e011e4b15e6a916e`.

Everything here was captured from **production builds** (`next build` + `next start`), driving real wheel events (`page.mouse.wheel`, 50px steps every 70ms, about 700px/s, a moderate wheel), not `scrollTo` jumps. Headless Chromium with ANGLE/D3D11 GPU rasterisation on a Windows desktop. It is **not** a real trackpad, a phone, or other browsers; the owner's approval on real hardware is still required.

- `video/` 29 MP4s (H.264, 960px wide, no audio).
- `sheets/` contact sheets (frames at 5 fps for the segment clips, 4 fps and 2 fps for the others) used to inspect each seam. They were taken from the recordings of the final build (PR head `52aeafa1`).
- `tools/` the scripts that produced them.

## Recordings

Segment definitions (after): chapter progress `q` ranges on the 500svh pinned section.

| Segment | What | after | before |
|---|---|---|---|
| A | initial load to first scroll | `after-{1440,1366,1920}-A.mp4` | `before-*-A.mp4` |
| B | Learn → Practise → Prepare (q 0.04–0.42) | `after-*-B.mp4` | `before-*-B.mp4` (the single-photograph hero, 0–950px) |
| C | Prepare → Understand → Progress (q 0.27–0.72) | `after-*-C.mp4` | none (the old hero has one photograph) |
| D | Progress → Explore (q 0.58–0.86) | `after-*-D.mp4` | none |
| E | Explore → Chapter 2 (q 0.78 → release → Chapter 2 pinned) | `after-*-E.mp4` | `before-*-E.mp4` (hero → Chapter 2, 500–2300px) |

Other viewports and modes (after only): `after-tablet-1024x768.mp4` (a full Chapter 1 pass), `after-tablet-768x1024.mp4`, `after-mobile-375x812.mp4`, `after-reduced-1440.mp4` (prefers-reduced-motion), `after-reverse-1440.mp4` (down Learn → Progress then back up).

Each video starts with the page loading at the top (the very first frame can be blank: that is the browser opening the page); segments B–E then jump to just before their start and wheel through. The first one to two seconds of those clips are therefore the top of the page, not a defect.

## What the recordings show (frame-by-frame review at 1440x900)

Reviewed by inspecting the contact sheets:

- **Before (E):** the headline fades out at roughly 50–78% of the pinned scroll and the photograph is then shown alone, with the mosaic dots, for about 630px of scrolling (frames 12–17 of `sheet-before-1440-E.jpg`) before Chapter 2's heading appears.
- **After:** the headline, subheading, CTAs and availability line are present in every frame, including while the stage scrolls away. The six photographs cross-fade with the previous photograph staying fully opaque underneath, so there is no washed-out frame and no frame of page background. Captions swap with one always readable; two are never legible together. No duplicated heading, no layout shift, no sticky-release jump.
- **Reverse (`sheet-reverse.jpg`):** the same photographs and captions are retraced on the way back up, with the same cross-fades.
- **Not seen in any clip:** a blank frame, ghosted copy, a grey placeholder, a photograph decoding late.

## Measurements

### Dead (copy-free) scroll between the hero and Chapter 2, 1440x900, 15px wheel samples

| | longest stretch with no readable body copy on screen |
|---|---|
| before (`origin/dev`) | **630px** (y 585–1215) |
| after | **none** (no stretch of 20px or more through the whole of Chapter 1 and the release) |

### Frame behaviour while scrolling (no screen recorder running; `tools/jank.mjs`, 4 runs each)

Wheel stream as above, requestAnimationFrame gaps and main-thread long tasks (PerformanceObserver `longtask`):

| | frames | p95 frame | frames > 25 ms | frames > 50 ms | worst frame | main-thread tasks >= 50 ms |
|---|---|---|---|---|---|---|
| before: hero to Chapter 2 (0-2300px), 4 runs | 256-259 | 33.2-33.3 ms | 13-16 | 2-3 | 100-117 ms | 0 |
| after: Chapter 1 to Chapter 2 (0-5000px), 4 runs | 532-534 | **16.8 ms** | 19-21 | 6-9 | 83-133 ms | **0** |

After covers more than twice the scrolling (all six scenes and the hand-off). The page itself never blocks the main thread for 50 ms or more during the scroll, and the typical frame is a clean 60 fps frame (p95 16.8 ms against 33 ms before). The worst frames (83-133 ms) are the same size as before and fall where Chapter 2's own photographs mount, past the end of Chapter 1.

**Caveat on the videos.** Playwright's screen recorder adds its own stalls: in the recorded clips the same pass shows one to three frames of about 270-300 ms in every segment, including ones with no page work at all, and it varies run to run with the other programs open on this desktop (a first batch of clips taken earlier on a quiet machine had none). Do not read frame timings from the videos; they are for looking at the pictures. The table above is the measurement.

### Load, layout and payload (median of 5 cold-context runs, local production server, no network throttling; `tools/perfm.mjs`)

| | LCP | CLS | images at load + 1.2 s | after scrolling the whole hero |
|---|---|---|---|---|
| desktop 1440x900, before | 504 ms | 0 | 3 files, 55 KB | 8 files, 166 KB |
| desktop 1440x900, after | **300 ms** | 0.0003 | 5 files, 129 KB | 10 files, 295 KB |
| mobile 375x812, before | 400 ms | 0 | 5 files, 33 KB | 7 files, 48 KB |
| mobile 375x812, after | **284 ms** | 0 | 5 files, 34 KB | 13 files, 61 KB |

The extra desktop payload (about 74 KB at load, 129 KB over the whole scroll) is scenes 2 and 3 being fetched ahead of need, one photograph at a time, and the other three as the visitor reaches them: never all six up front. On mobile the six small thumbnails are requested only when the scene list scrolls into view. During the desktop scroll: script time 101 ms (before) vs 65 ms (after), style recalculations 161 vs 102.

The desktop CLS of 0.0003 is the header navigation moving about 5px when the web font swaps in (`tools/cls.mjs` names the nodes); it is the header, not the hero, and is far below the 0.1 threshold.

### Cold cache, slow and failed images (`tools/cold.mjs`, plus the Playwright suite)

- Image-optimiser cache cleared, fast wheel (300px / 20ms): minimum photograph coverage 1.000; no undecoded photograph visible.
- Cold, Fast-3G-like network (1.6 Mbps, 150 ms) and a fast wheel: the only frames with an undecoded photograph were at the very top while scene 1 itself was still downloading (headline and CTAs readable on the page background; no grey placeholder). Scenes 2-6 never showed before decoding. Scene 1 appears when it arrives, with no fade (a server-rendered picture is painted by the browser as it downloads).
- Cold, same slow network, moderate wheel: minimum coverage 1.000.
- Playwright (`e2e/landing.spec.ts`, "Chapter 1 six-scene scroll"): a request for scene 3 aborted → coverage never below 0.99, the layer reports `data-photo-state="error"`, later scenes still cover correctly; scenes 2–4 delayed by 2.5 s during a fast scroll → coverage never below 0.99 and nothing visible before it is ready.

### Face budget (rendered, not just declared)

The home page renders 12 photographs (the six hero scenes and the six Chapter 2 scenes). Face-visible: **one**, hero scene 01 Learn. The registry also catalogues the parent photograph (`parent-laptop-clean.webp`) as face-visible, which the page does not currently render; counting it, the catalogue is two, which is the budget. The unit test checks the catalogue; this audit checks the render (`tools/faces.mjs`, desktop 1440, mobile 375 and reduced motion all render the same 12).

## Known limits

- Captured on one machine, headless, GPU-accelerated. Real hardware, trackpads and Safari/Firefox are unverified.
- The six photographs are the historical 1672x941 files, never upscaled, and are marked `interim`.
- 2560-wide renders will need `2560` added to `images.deviceSizes` (not changed here).

## Why the image requests are paced (a CI finding)

On CI, `e2e/screen-validation.spec.ts` ("landing shell stays stable across viewports") timed out in `page.goto` twice in a row. It was reproduced locally with a proxy that delays `/_next/image` responses (`tools/slowproxy.mjs`, `tools/shell.mjs`): browsers keep only a handful of connections per host, so a page with many images in flight queues the next navigation behind them. The old hero had the same weakness (it also hangs at a 40 s delay) but needed a far slower link to hit it. The fix: upcoming photographs are requested one at a time, and the scene list's thumbnails wait until the list scrolls into view. CI has been green since.
