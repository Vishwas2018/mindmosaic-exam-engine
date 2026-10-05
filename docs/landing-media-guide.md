# Landing media guide

Where the landing page's pictures live, how to change them, and what size they should be. You do not need to touch component code for any of this.

**Registry (the one list of pictures):** `src/features/landing/media.ts`
**Files:** `public/landing/media/<chapter-folder>/`

Each chapter of the landing page has its own folder. File names carry a version (`-v1`, `-v2`...) so a changed picture is a new file and browsers never show a stale copy.

---

## Chapter 1: the intro

**What it is.** The first screen of the home page: one fixed photograph behind the headline "Learn with purpose. Practise with confidence." The picture never rotates. It zooms very slightly as you scroll (on desktop it stays pinned while that happens), then small mosaic pieces assemble along the bottom edge as the page hands over to Chapter 2.

**Which component uses it.** `src/features/landing/components/ChapterOneIntro.tsx`, reading the slot `landingMedia.chapter1.intro.primary`.

**Folder:** `public/landing/media/chapter-01-intro/`

| Option | File | What it shows | State |
| --- | --- | --- | --- |
| A | `ch01-hero-alt-a-v1.webp` | Solo study scene | Stored alternate (currently a stand-in photo, see Notes) |
| **B** | **`ch01-hero-primary-v1.webp`** | **Two students working together at a laptop** | **ACTIVE now** |
| C | `ch01-hero-alt-b-v1.webp` | Editorial, reflective desk scene | Stored alternate (currently a stand-in photo, see Notes) |

Only the active picture is loaded by visitors. Alternates sit in the folder and cost nothing.

### Picture requirements

- Format: WebP (`.webp`).
- Aspect ratio: 16:9 landscape.
- Recommended: **2560 x 1440**. Minimum: **2400 x 1350**. (The current files are 1672 x 941; replace them with full-size renders of the same scenes before launch. Never upscale a small image.)
- Keep the **left 45%** calm and bright: the headline sits there. Keep the subject(s) on the **right**.
- Photography only. No logos, no interface screenshots, no text inside the picture: the real MindMosaic logo is drawn by the page. Keep it rich and warm, not grey or washed out.
- At most two photographs on the whole home page may show faces (design rule 39.2). Chapter 1's active picture uses one of those two. If you choose a face-free option, update `treatment` for that option in the registry.

### Switch to another Chapter 1 picture (A or C)

1. Open `src/features/landing/media.ts`.
2. Change `CHAPTER_1_ACTIVE_OPTION` from `"optionB"` to `"optionA"` or `"optionC"`.
3. Save. Nothing else changes.

### Replace a picture with a new version (v2)

1. Export the new image to the specs above.
2. Name it with the next version and drop it in the chapter folder, e.g. `ch01-hero-primary-v2.webp`. Keep the old `-v1` file until you are happy.
3. In `media.ts`, find that option and change `revision: "v1"` to `revision: "v2"`.
4. If the subject sits in a different place, adjust `focalMobile`, `focalTablet`, `focalDesktop` (for example `"70% 50%"`: horizontal %, vertical %). This controls the crop on each screen size.
5. Update `alt` to describe the new scene in plain words (no logos, no screen contents).

### What each field in a slot means

`label` owner-facing name · `basePath` file path without the version · `revision` the `v1`/`v2` part · `alt` description for screen readers · `focalMobile/Tablet/Desktop` crop position · `motionPreset` `cinematic-zoom` (default) or `still` for no zoom · `status` `active`, `alternate` or `stand-in` · `treatment` whether faces show · `notes` free text.

### Notes

- Options A and C: the two originally generated images were not in the repository, so existing face-free photographs of the same type (a solo desk scene and a globe-and-books desk) are stored as stand-ins. To use the real ones, drop them in as `ch01-hero-alt-a-v2.webp` and `ch01-hero-alt-b-v2.webp` and set each option's `revision` to `v2`.
- Reduced motion: visitors who ask their device for reduced motion get the same page with no zoom, no pinning and no moving pieces.
- Chapter 2 is only a placeholder heading ("Choose your pathway.") for now.
