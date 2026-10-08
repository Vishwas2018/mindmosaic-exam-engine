# Evidence: Chapter 1 six-scene scroll-driven hero (PR #40)

Branch `feat/landing-ch1-six-scene-scroll`, compared with `origin/dev` at `cd136c09ca21b71fb8bfb9d2e011e4b15e6a916e`.

Everything here was captured from **production builds** (`next build` + `next start`), driving real wheel events (`page.mouse.wheel`, 50px steps every 70ms, about 700px/s, a moderate wheel), not `scrollTo` jumps. Headless Chromium with ANGLE/D3D11 GPU rasterisation on a Windows desktop. It is **not** a real trackpad, a phone, or other browsers; the owner's approval on real hardware is still required.

- `video/` 29 MP4s (H.264, 960px wide, no audio).
- `sheets/` contact sheets (frames at 5 fps for the segment clips, 4 fps / 2 fps for the others) used to inspect each seam.
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

Each video starts with the page loading at the top; segments B–E then jump to just before their start and wheel through. The first one to two seconds of those clips are therefore the top of the page, not a defect.

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

### Frame cadence (requestAnimationFrame deltas while wheeling each segment)

Median frame 16.7 ms in every clip. Frames over 25 ms / over 50 ms:

| viewport | segment | before | after |
|---|---|---|---|
| 1440x900 | A load → first scroll | 14 / 0 | 13 / 1 |
| 1440x900 | B | 10 / 0 | 10 / 0 |
| 1440x900 | C | – | 0 / 0 |
| 1440x900 | D | – | 0 / 0 |
| 1440x900 | E | 3 / 1 | 4 / 1 |
| 1366x768 | B / C / D / E | 8/0 · – · – · 3/2 | 8/0 · 0/0 · 0/0 · 6/2 |
| 1920x1080 | B / C / D / E | 13/0 · – · – · 0/0 | 0/0 · 0/0 · 0/0 · 1/0 |

The only long frames in the after clips are in segment A (page load) and segment E (the hand-off into Chapter 2, where Chapter 2's own photographs mount); the six-scene scroll itself (B, C, D) is steady. Software rasterisation (no GPU) was not measured for this PR.

### Load, layout and payload (median of 5 cold-context runs, local production server, no network throttling)

| | LCP | CLS | images at load + 1.2 s | after scrolling the whole hero |
|---|---|---|---|---|
| desktop 1440x900, before | 504 ms | 0 | 3 files, 55 KB | 8 files, 166 KB |
| desktop 1440x900, after | **424 ms** | 0 | 5 files, 129 KB | 10 files, 295 KB |
| mobile 375x812, before | 400 ms | 0 | 5 files, 33 KB | 7 files, 48 KB |
| mobile 375x812, after | **388 ms** | 0 | 11 files, 46 KB | 13 files, 61 KB |

The extra desktop payload (about 74 KB at load, 129 KB after the scroll) is scenes 2 and 3 being fetched ahead of need, and the other three as the visitor reaches them: never all six up front. On mobile the extra files are six small lazy thumbnails. During the desktop scroll: script time 101 ms (before) vs 82 ms (after), style recalculations 161 vs 105, layouts 26 vs 29.

### Cold cache, slow and failed images (`tools/cold.mjs`, plus the Playwright suite)

- Image-optimiser cache cleared, fast wheel (300px / 20ms): minimum photograph coverage 1.000; no undecoded photograph visible.
- Cold, Fast-3G-like network (1.6 Mbps, 150 ms) and a fast wheel: the only frames with an undecoded photograph were at the very top while scene 1 itself was still downloading (headline and CTAs readable on the page background; no grey placeholder). Scenes 2–6 never showed before decoding. The picture appears when it arrives, with no fade.
- Cold, same slow network, moderate wheel: minimum coverage 1.000.
- Playwright (`e2e/landing.spec.ts`, "Chapter 1 six-scene scroll"): a request for scene 3 aborted → coverage never below 0.99, the layer reports `data-photo-state="error"`, later scenes still cover correctly; scenes 2–4 delayed by 2.5 s during a fast scroll → coverage never below 0.99 and nothing visible before it is ready.

### Face budget (rendered, not just declared)

The home page renders 12 photographs (the six hero scenes and the six Chapter 2 scenes). Face-visible: **one**, hero scene 01 Learn. The registry also catalogues the parent photograph (`parent-laptop-clean.webp`) as face-visible, which the page does not currently render; counting it, the catalogue is two, which is the budget. The unit test checks the catalogue; this audit checks the render (`tools/faces.mjs`, desktop 1440, mobile 375 and reduced motion all render the same 12).

## Known limits

- Captured on one machine, headless, GPU-accelerated. Real hardware, trackpads and Safari/Firefox are unverified.
- The six photographs are the historical 1672x941 files, never upscaled, and are marked `interim`.
- 2560-wide renders will need `2560` added to `images.deviceSizes` (not changed here).
