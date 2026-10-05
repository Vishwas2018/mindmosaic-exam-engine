# Landing media guide

Where the landing page's pictures live, how to change them, and what size they should be. You do not need to touch component code for any of this.

**Registry (the one list of pictures):** `src/features/landing/media.ts`
**Files:** `public/landing/media/<chapter-folder>/`
**Motion numbers (zoom, scroll timing):** `src/features/landing/cinematic/config.ts`

Each chapter of the landing page has its own folder. File names carry a version (`-v1`, `-v2`...) so a changed picture is a new file and browsers never show a stale copy.

## The story order (transitional)

The cinematic landing page is being built one chapter at a time:

1. **Chapter 1** - MindMosaic introduction (built; this guide).
2. **Chapter 2** - Programs / pathways.
3. **Chapter 3** - How MindMosaic works.
4. **Chapter 4** - Progress / parents.

Until Chapters 2 to 4 are built, the home page shows Chapter 1, then a short placeholder hand-off headed **"Choose your pathway."**, then the existing sections in story order: Programs ("Find the right program."), How it works, and the rest. The placeholder is temporary: the real Chapter 2 will replace **both** the placeholder and the current Programs presentation. The order lives in `sections` in `src/features/landing/content.ts`.

---

## Chapter 1: the intro

**What it is.** The first screen of the home page: one fixed photograph behind the headline "Learn with purpose. Practise with confidence." The picture never rotates. It zooms very slightly as you scroll (on desktop it stays pinned while that happens), then small mosaic pieces assemble along the bottom edge as the page hands over to Chapter 2.

**Which component uses it.** `src/features/landing/components/ChapterOneIntro.tsx`, reading the slot `landingMedia.chapter1.intro.primary`. The component holds no image path.

**Folder:** `public/landing/media/chapter-01-intro/`

| Option | File | What it shows | Selection | Asset status |
| --- | --- | --- | --- | --- |
| A | `ch01-hero-alt-a-v1.webp` | Solo study scene | alternate | **stand-in** |
| **B** | **`ch01-hero-primary-v1.webp`** | **Two students working together at a laptop** | **ACTIVE now** | **interim** |
| C | `ch01-hero-alt-b-v1.webp` | Editorial, reflective desk scene | alternate | **stand-in** |

Only the active picture is loaded by visitors. Alternates sit in the folder and cost nothing.

### Two separate labels: selection and asset status

Every picture carries two independent labels in the registry (`media.ts`):

**Selection** says whether the page is showing it:
- `active`: the picture on the page right now (exactly one).
- `alternate`: stored, not shown.

**Asset status** says how finished the file is:
- `stand-in`: a temporary substitute. It is not the scene we intend to use.
- `interim`: it is the intended scene, but below the final production specification (for example, too small).
- `production`: the approved final file, meeting the production requirements below.

They do not affect each other. If you switch Chapter 1 to Option A today, Option A becomes `active` but is still a `stand-in`: choosing a picture does not make it final. Only change `assetStatus` when the file itself changes (for example to `production` once a genuine 2560 x 1440 file is in place). `selection` is never edited by hand: it follows `CHAPTER_1_ACTIVE_OPTION`.

### Stand-in status (A and C)

The two originally generated alternates (solo child study scene; editorial reflective study scene) have not been added to the repository. Options A and C currently hold existing face-free photographs of the same kind (a solo desk scene and a globe-and-books desk), marked `assetStatus: "stand-in"` in the registry. They are not the generated images. When you have the real files, add them as `ch01-hero-alt-a-v2.webp` and `ch01-hero-alt-b-v2.webp`, set each option's `revision` to `v2`, change that option's `assetStatus` from `"stand-in"` to `"interim"` (or `"production"` if the file meets the production size) and remove the `STAND-IN` note.

### Picture requirements

- Format: WebP (`.webp`). Aspect ratio: 16:9 landscape.
- **Production target: 2560 x 1440 (preferred), 2400 x 1350 (minimum).**
- **Current files are interim: 1672 x 941** (option B is `interim`; none is `production`). Replace them with full-size renders of the same scenes before launch. Never upscale a small image to hit the size.
- Keep the **left 45%** calm and bright: the headline sits there. Keep the subject(s) on the **right**.
- Photography only. No logos, no interface screenshots, no text inside the picture: the real MindMosaic logo is drawn by the page. Keep it rich and warm, not grey or washed out.
- At most two photographs on the whole home page may show faces (design rule 39.2). Chapter 1's active picture uses one of those two. If you choose a face-free option, check its `treatment` in the registry.

### Switch to another Chapter 1 picture (A or C)

1. Open `src/features/landing/media.ts`.
2. Change `CHAPTER_1_ACTIVE_OPTION` from `"optionB"` to `"optionA"` or `"optionC"`.
3. Save. Nothing else changes.

### Replace a picture with a new version (v2)

1. Export the new image to the specs above.
2. Name it with the next version and drop it in the chapter folder, e.g. `ch01-hero-primary-v2.webp`. Keep the old `-v1` file until you are happy.
3. In `media.ts`, find that option and change `revision: "v1"` to `revision: "v2"`.
4. If the subject sits somewhere different, adjust the focal points (below).
5. Update `sceneDescription` to describe the new scene.

### Accessibility: `sceneDescription` vs `alt`

The Chapter 1 photograph is **decorative**. The headline, copy and buttons already say everything the picture is there to support, so a screen reader should skip it. That is why every Chapter 1 slot has:

- `decorative: true`
- `alt: ""` (this is what the page puts on the image; do not fill it in)
- `sceneDescription: "..."` (for you and the team: what the picture shows. It is **never** shown on the page or read by a screen reader)

Do not paste the description into `alt`: that would make screen-reader users hear the scene as redundant noise. The registry's type enforces it: a `decorative: true` slot cannot have a non-empty `alt`. A future picture that carries meaning of its own would use `decorative: false` with a real `alt`.

### Focal points

`focalMobile`, `focalTablet`, `focalDesktop` say which part of the picture stays on screen when it is cropped to each screen shape. They are CSS positions: `"80% 50%"` means 80% across, 50% down. Raise the first number to show more of the picture's right side. Check the phone view after any change: both faces should stay visible.

### Motion preset

`motionPreset` picks the zoom recipe by name from `src/features/landing/cinematic/config.ts`:

- `heroBreath` (default): starts at 1.05, settles to 1.00 through the chapter, re-expands slightly to 1.025 at the hand-off.
- `still`: no zoom.

Timing numbers (when the copy fades, when the mosaic assembles, the desktop pin height and breakpoint) are in the same file, so later chapters reuse them.

### What each field in a slot means

`label` owner-facing name · `basePath` file path without the version · `revision` the `v1`/`v2` part · `sceneDescription` owner note on the scene · `decorative` + `alt` accessibility contract · `focalMobile/Tablet/Desktop` crop position · `motionPreset` zoom recipe · `selection` `active` or `alternate` (derived) · `assetStatus` `stand-in`, `interim` or `production` · `treatment` whether faces show · `notes` free text.

### Other notes

- Reduced motion: visitors who ask their device for reduced motion get the same page with no zoom, no pinning and no moving pieces.
- Phones and tablets do not pin: the picture sits above the copy and the section scrolls normally.
