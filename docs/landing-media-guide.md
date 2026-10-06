# Landing media guide

Where the landing page's pictures live, how to change them, and what size they should be. You do not need to touch component code for any of this.

**Registry (the one list of pictures):** `src/features/landing/media.ts`
**Files:** `public/landing/media/<chapter-folder>/`
**Motion numbers (zoom, scroll timing):** `src/features/landing/cinematic/config.ts`

Each chapter of the landing page has its own folder. File names carry a version (`-v1`, `-v2`...) so a changed picture is a new file and browsers never show a stale copy.

## The story order (transitional)

The cinematic landing page is being built one chapter at a time:

1. **Chapter 1** - MindMosaic introduction (built).
2. **Chapter 2** - Programs / pathways (built; see the Chapter 2 section below).
3. **Chapter 3** - How MindMosaic works.
4. **Chapter 4** - Progress / parents.

Chapters 1 and 2 are built. After Chapter 2 the home page still shows the existing sections in story order (How it works and the rest) until Chapters 3 and 4 replace them. Chapter 2 replaced both the old "Choose your pathway." placeholder and the old Programs section ("Find the right program."), which is no longer on the home page. The order lives in `sections` in `src/features/landing/content.ts`.

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

---

## Chapter 2: Choose your pathway

**What it is.** One pinned screen that tells six programme scenes as you scroll normally (about 6.8 screens of scrolling on desktop). Nothing auto-plays and scrolling is never taken over. Phones and tablets, and anyone who asks for reduced motion, get the same six scenes stacked as ordinary page content.

**Components.** `ChapterTwoPrograms.tsx` (the chapter), `ProgramScene.tsx` (one scene), `ProgramSceneProgress.tsx` (the 01-06 progress bar), `chapter-two-visuals.tsx` (the product screens). Scene copy and facts: `src/features/landing/chapter2-scenes.ts`. Timing: `chapter2` block in `src/features/landing/cinematic/config.ts`.

**Honest status.** A scene's "Available" or "In development" is read from the programme list in `content.ts` (`programmes`), the same data the Programs page uses. To change a status, change it there; the scene follows. Only NAPLAN-style and ICAS-style (Years 3 and 5) are Available. Scholarship preparation is mentioned only as a planned direction.

**Folder:** `public/landing/media/chapter-02-programs/<programme>/`

| Scene | Visual | Registry slot | File | Selection | Asset status |
| --- | --- | --- | --- | --- | --- |
| 01 NAPLAN-style | Photograph + real practice-paper UI | `landingMedia.chapter2.naplan` | `naplan/ch02-naplan-primary-v1.webp` | active | **stand-in** |
| 02 ICAS-style | Photograph + extension-question UI | `landingMedia.chapter2.icas` | `icas/ch02-icas-primary-v1.webp` | active | **stand-in** |
| 03 Curriculum learning | DOM lesson UI only, no photograph | none | none | n/a | n/a (no image) |
| 04 AMC-style | Photograph + pattern-problem UI | `landingMedia.chapter2.amc` | `amc/ch02-amc-primary-v1.webp` | active | **stand-in** |
| 05 Singapore Maths | DOM bar model only, no photograph | none | none | n/a | n/a (no image) |
| 06 Selective & scholarship | Photograph + skill-category UI | `landingMedia.chapter2.selective` | `selective-scholarships/ch02-selective-primary-v1.webp` | active | **stand-in** |

Nothing in Chapter 2 is `interim` or `production`. All four photographs are existing face-free campaign pictures copied in so the layout could be judged. The newly generated NAPLAN study image was not available in the repository, so the NAPLAN slot is a stand-in too. The AMC stand-in shows faint handwritten sketches; the final AMC image must have no readable maths. No folder exists for Curriculum or Singapore Maths because they use no image.

Asset status and selection mean the same as in Chapter 1 (see above). Each Chapter 2 scene has a single candidate today, so each is simply `active`.

### Replace one programme image

1. Export the new picture as WebP, 16:9 or 4:3, ideally 2000 px wide or more (about 1600 px is enough: it shows in a panel roughly 56% of the screen). Photography only: no logos, no interface, no readable text or maths.
2. Save it in that programme's folder with the next version, for example `naplan/ch02-naplan-primary-v2.webp`. Keep `-v1` until you are happy.
3. In `src/features/landing/media.ts`, find the scene in `chapter2Candidates`, change `revision: "v1"` to `"v2"`, update `sceneDescription`, adjust the focal points if needed, and set `assetStatus`: `interim` if it is the intended scene but below final size, `production` only if it is final and approved. Remove the `STAND-IN` note.
4. Faces: the whole home page may show at most two face-visible photographs (Chapter 1 uses one). Keep Chapter 2 pictures face-free unless that budget is revisited; set `treatment` honestly.

### Focal points and motion

`focalMobile`, `focalTablet`, `focalDesktop` work as in Chapter 1: keep the subject visible when the picture is cropped. In Chapter 2 the picture sits in a rounded panel, not full bleed. `motionPreset`: `sceneSettle` (starts 3.5% in and settles; used for NAPLAN and AMC), `sceneDrift` (holds, then pushes in 2.5%; ICAS and Selective), `still` (no zoom).

### Loading

While the stage is pinned, only the scene on screen and its neighbours load their photograph, and only once the chapter is near the screen, so the four images never download together. On phones the images use ordinary lazy loading.

### Tuning the scroll story

All numbers are in `cinematicMotion.chapter2`: total scroll height (`desktopScrollHeightSvh`), where each layer starts (`layerStarts`), the cross-fade width (`crossfade`), copy rise and lift, photo zoom windows, product-UI scale and the progressive build window. Layer starts must stay in increasing order; a unit test checks it.
