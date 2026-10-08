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
3. **Chapter 3** - How MindMosaic works (built; DOM/SVG only, see below).
4. **Chapter 4** - Progress / parents (built; DOM/SVG progress mosaic only, see below).

Chapters 1 to 4 are built. Chapter 4 replaces the old ForParents section on the home page with a progressive DOM/SVG progress mosaic. The quality, trust and closing sections follow. The order lives in `sections` in `src/features/landing/content.ts`.

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
| 01 NAPLAN-style | Photograph + scene badge | `landingMedia.chapter2.naplan` | `naplan/ch02-naplan-primary-v1.webp` | active | **interim** |
| 02 ICAS-style | Photograph + scene badge | `landingMedia.chapter2.icas` | `icas/ch02-icas-primary-v1.webp` | active | **interim** |
| 03 Curriculum learning | Photograph + scene badge | `landingMedia.chapter2.curriculum` | `curriculum/ch02-curriculum-primary-v1.webp` | active | **interim** |
| 04 AMC-style | Photograph + scene badge | `landingMedia.chapter2.amc` | `amc/ch02-amc-primary-v1.webp` | active | **interim** |
| 05 Singapore Maths | Photograph + scene badge | `landingMedia.chapter2.singapore` | `singapore-maths/ch02-singapore-primary-v1.webp` | active | **interim** |
| 06 Selective & scholarship | Photograph + scene badge | `landingMedia.chapter2.selective` | `selective-scholarships/ch02-selective-primary-v1.webp` | active | **interim** |

All six Chapter 2 programme scenes now use owner-approved bespoke campaign photography. All six files are native 1672 x 941 WebP (quality 80) and marked `assetStatus: "interim"` in the registry because they are below the 2560 x 1440 production target. They will be updated to `production` once full-resolution 2560 x 1440 renders of the same scenes are supplied. No image has been artificially upscaled.

### Chapter 2 owner-approved MindMosaic laptop-screen photography exception

Under the design rules (§27), generic stock-photo clichés and fake app UI embedded in stock images are prohibited. Chapter 2 carries an explicit, owner-approved exception for bespoke campaign photography: each photograph depicts a student in a warm home-study environment with a laptop whose screen displays authentic MindMosaic application interface scenes.

Rules governing this exception:
- **Strictly decorative:** Every slot has `decorative: true` and `alt: ""`. Screen readers skip the images entirely.
- **Product truth in the DOM:** Canonical programme availability, covered years, and propositions are rendered strictly in semantic HTML text via `SceneCopy`. The images never carry text that acts as the source of truth.
- **Unobstructed desktop presentation:** On desktop viewports, redundant floating product cards are removed so the laptop screen and home-study atmosphere are clearly visible and uncluttered.
- **Face-free treatment:** Students are photographed from behind or over-the-shoulder (`treatment: "hands-only"`), preserving privacy and adhering to the page face-budget guidelines.

Asset status and selection mean the same as in Chapter 1 (see above). Each Chapter 2 scene has a single candidate today, so each is simply `active`.

### Replace one programme image

1. Export the new picture as WebP, 16:9 landscape, target 2560 x 1440 (minimum 2400 x 1350). For Chapter 2, replacement photography may include MindMosaic-owned branding and MindMosaic product UI under the scoped owner-approved exception above. Do not include third-party UI, external logos or unrelated readable material. The photograph must never become the source of truth for availability, status, years, subjects or programme behaviour.
2. Save it in that programme's folder with the next version, for example `naplan/ch02-naplan-primary-v2.webp`. Keep `-v1` until you are happy.
3. In `src/features/landing/media.ts`, find the scene in `chapter2Candidates`, change `revision: "v1"` to `"v2"`, update `sceneDescription`, adjust the focal points if needed, and set `assetStatus`: `interim` if below 2560 x 1440, `production` if at final specification. Remove any interim notes once production renders are in place.
4. Faces: the whole home page may show at most two face-visible photographs (Chapter 1 uses one). Keep Chapter 2 pictures face-free (`treatment: "hands-only"`) unless that budget is revisited; set `treatment` honestly.

### Focal points and motion

`focalMobile`, `focalTablet`, `focalDesktop` work as in Chapter 1: keep the subject visible when the picture is cropped. In Chapter 2 the picture sits in a rounded panel, not full bleed. `motionPreset`: `sceneSettle` (starts 3.5% in and settles; used for NAPLAN and AMC), `sceneDrift` (holds, then pushes in 2.5%; ICAS and Selective), `still` (no zoom).

### Loading

While the stage is pinned, only the scene on screen and its neighbours load their photograph, and only once the chapter is near the screen, so the six images never download together. On phones the images use ordinary lazy loading.

### Tuning the scroll story

All numbers are in `cinematicMotion.chapter2`: total scroll height (`desktopScrollHeightSvh`), where each layer starts (`layerStarts`), the cross-fade width (`crossfade`), copy rise and lift, photo zoom windows, product-UI scale and the progressive build window. Layer starts must stay in increasing order; a unit test checks it.

---

## Chapter 3: How it works

**Chapter 3 is DOM/SVG-only. It has no photographic media assets, no media-registry slots and no image folder.** There is nothing to replace, version or crop. (The only image on screen is the real MindMosaic brand mark in each product frame header, drawn by the shared logo component.)

**What it is.** "One concept. Four connected steps." One pinned screen (about 5 screens of scrolling on desktop) with a single product frame that changes state as you scroll: **Learn** (a fractions lesson), **Practise** (a question with the wrong answer picked), **Understand** (the same question reviewed, both answers labelled, worked explanation), **Next** (a sample skill breakdown and focused next step). Practise and Understand are literally one on-screen element changing state. Phones, tablets and reduced motion get the same four scenes stacked, each with its product view complete; Understand repeats the question so it reads on its own.

**Where things live**

| What | Where |
| --- | --- |
| Scene copy, headings, facts, links, intro, hand-off | `src/features/landing/chapter3-journey.ts` |
| The sample lesson, question, explanation and skill numbers | Shared with the old sections in `src/features/landing/content.ts` (`learningDemo.learnDemo`, `learningDemo.practiseDemo`, `respondsToStudent.sample`). Edit them there. |
| Product visual states (lesson, question/review, results) | `src/features/landing/components/chapter-three-visuals.tsx` |
| Pinned stage | `src/features/landing/components/ChapterThreeHowItWorks.tsx` |
| Timings | `chapter3` block in `src/features/landing/cinematic/config.ts` |

**Adjust the scene timings** in `cinematicMotion.chapter3`:
- `desktopScrollHeightSvh`: total scroll length. It is 500 (see below).
- `layerStarts`: where each layer begins, as a share of the pinned scroll: `intro`, `learn`, `practise`, `understand`, `next`, `handoff`. Keep them in increasing order with room for `crossfade` between them (a unit test checks this).
- `crossfade`: how wide each hand-over is.
- `lessonBuild`, `questionAppear`, `review`, `resultsBuild`: how much of a scene it takes for its product view to build (0 to 1 of that scene). Smaller finishes earlier.

**Why 500svh.** There are four scenes, each about 85svh of scrolling, close to a Chapter 2 scene, plus a short intro and hand-off. It is shorter than Chapter 2 (680svh, six scenes) because the product frame never leaves the screen, so there is no re-establishing between scenes. At 1440x900 every state is fully built by the middle of its scene, so nothing needs slow, precise scrolling. Lengthen it only if a scene feels rushed.

**Copy that must stay true.** The last scene describes the recommendation feature, so it only says what the engine does: after an *eligible* test, objective questions only, up to three suggestions ranked by fixed rules, and a focused set of *five* questions offered only when enough suitable published questions exist. Do not reword it to suggest every test or every wrong answer produces a practice set, or to imply AI, tutoring or adaptive questions. `src/tests/unit/landing-chapter-three.test.ts` checks the wording.

---

## Chapter 4: Progress & parents

**Chapter 4 is DOM/SVG-only. It has no photographic media assets, no media-registry slots and no image folder.** Like Chapter 3, there is nothing to replace, version or crop.

**What it is.** "Progress that stays understandable." One pinned screen (about 4 screens of scrolling on desktop) with a progressive progress mosaic assembling real product data across three scenes:
- **01 Latest:** See what happened (latest completed session, score ring, date, answered count).
- **02 Subjects:** See the pattern (subject-level rows, accessible progress bars, canonical performance bands: Strong, Good, Building).
- **03 Parent view:** See the bigger picture (coherent read-only parent dashboard mosaic assembling Aisha · Year 3, weekly activity, recent sessions, and subject progress).

Phones, tablets and reduced motion get the same three scenes stacked as ordinary content.

**Where things live**

| What | Where |
| --- | --- |
| Scene copy, headings, facts, intro, hand-off, sample derivation | `src/features/landing/chapter4-progress.ts` |
| Sample data source of truth | `forParents.summary` in `src/features/landing/content.ts`. Percentages are strictly derived (80%, 70%, 60%). |
| Canonical performance bands | `@/features/parent-dashboard/performance-band` |
| Product visual components (score ring, subject bars, week activity, recent work, assembled mosaic) | `src/features/landing/components/chapter-four-visuals.tsx` |
| Scene copy & mobile layout component | `src/features/landing/components/ProgressScene.tsx` |
| Pinned stage | `src/features/landing/components/ChapterFourProgressParents.tsx` |
| Timings | `chapter4` block in `src/features/landing/cinematic/config.ts` |

**Adjust the scene timings** in `cinematicMotion.chapter4`:
- `desktopScrollHeightSvh`: total scroll length (400svh).
- `layerStarts`: where each layer begins, as a share of the pinned scroll: `intro` (0), `latest` (0.10), `subjects` (0.37), `parent` (0.64), `handoff` (0.93).
- `crossfade`: width of cross-fade between neighbouring layers (0.055).
- `scoreRingDraw`, `subjectBarsBuild`, `mosaicAssemble`: progress windows for visual builds.

**Copy and product truth that must stay true.**
- The parent view is fundamentally a read-only presentation of stored results.
- No parent-launched missed-skill drill, no claim of editing student records.
- No premium LearningInsights, no readiness score, and no recommended actions portrayed as live.
- No fake checkpoints, invented strand mastery, or fabricated exam schedules (such as May testing cycle).

