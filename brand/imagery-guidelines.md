# Imagery guidelines

The site isn't publicly deployed and there's no paid stock library — but
free-licensed photography (Unsplash/Pexels, standard free licence tiers
only) is now in use where a suitable match exists. Everywhere else,
imagery is original SVG/gradient art or a real product-UI composition —
never a generic stock placeholder, and never anything copied from a
competitor (Eduleb or otherwise).

## What we use today

1. **Licensed photography.** Free-licensed photos (Unsplash License /
   Pexels License — commercial use permitted, no attribution required,
   but recorded anyway) of primary-school-aged children and families in
   calm home settings. Every one is logged in
   `brand/assets/photography/LICENSES.md` with its source, photographer,
   licence and download date, and lives under `public/photos/`. Not every
   slot has one — see "Open slots" in that file for where no candidate
   cleared the bar below.
2. **Authentic product-UI compositions.** CSS/SVG mockups built from the
   real design language of the actual question-card, number-line,
   progress-tile and results components — e.g. `Hero.tsx`'s `SessionMockup`
   and `Experience.tsx`'s report mockup. These are not generic dashboard
   stock art; they mirror the real product structure so a genuine
   screenshot can later drop in with the same shape. Hero deliberately
   keeps this as its *only* visual — a photo there would compete with it,
   not strengthen it.
3. **Original illustrated/gradient SVG art**, in the brand palette only
   (`--brand`, `--brand-bright`, `--brand-ink`, `--royal-orange` — see
   `design-tokens.json`), for accents and collection-style cards where a
   full product mockup would be overkill, and as the reserved-slot filler
   wherever no licensed photo cleared the bar yet. See `MosaicAccentArt`
   in `src/features/landing/components/primitives.tsx`.
4. **Owner-generated imagery (ChatGPT).** A curated subset of AI-generated
   images the owner produced directly (ChatGPT image generation, not a
   third-party stock source) and dropped into `brand/images/` for review.
   Provenance: **owner-generated via ChatGPT, added 2026-07-24, cleared
   for use.** No model release or stock licence applies — the owner is the
   author and rights-holder. `brand/images/` is git-ignored (raw PNGs,
   ~30MB, never web-served); only the selected, converted WebP files below
   are tracked, under `public/landing/`. See "Owner-generated imagery"
   below for the full file list, what was held back, and why.

## Selection rules (photography)

- Primary-school-aged children (Grade 3/5 range) learning at home, or a
  parent and child reviewing work together. Calm, bright, natural home
  settings. Diverse and warm — nothing that reads
  American-classroom, corporate, or stock-agency-posed.
- **Prefer compositions where a child's face isn't the focal point** —
  over-the-shoulder, side/behind, hands-on-device/desk/materials. Reserve
  face-visible shots for a genuinely best-fit spot (hero-equivalent), and
  cap those at 1-2 uses across the whole page.
- No visible device brand logos (a laptop lid with a visible "Dell" or a
  "Chromebook" sticker is a real reason to reject an otherwise-good
  photo), no watermarks, no other product's UI or branding visible.
- Screen content matters: a tablet showing a **Games** app folder reads as
  screen-time, not practice — check what's actually on the screen, not
  just the caption.
- **A fetched text description of a photo's composition is not
  trustworthy on its own — a past pass took "over-the-shoulder" at face
  value from a page-summary tool and the actual image was a posed,
  face-forward stock shot.** Always look at the actual image before using
  it.
- Unsplash mixes free (`images.unsplash.com`, "Unsplash License") and paid
  (`plus.unsplash.com`, "Unsplash+ License") photos in the same search
  results, including ones credited to agencies like Getty Images — check
  which one you have on every candidate, not just the ones that look
  obviously premium.
- If nothing clears this bar for a slot: leave the `ImageSlot` on
  `MosaicAccentArt` rather than forcing a weak or off-brief match. See
  `brand/assets/photography/LICENSES.md` for rejected candidates and why.

## Reserved slots

`ImageSlot` (`src/features/landing/components/primitives.tsx`) reserves
exact space via CSS `aspect-ratio` — not an image's intrinsic size — so
swapping in (or out) a photo never shifts layout (no CLS). Swapping a
`MosaicAccentArt` slot for a real photo means putting a `next/image` in
the same wrapper (use `fill` + `sizes` + `className="object-cover"`,
matching `Story.tsx`'s `ProductIntro`) with no other layout change; below
the fold, rely on `next/image`'s default lazy loading rather than adding
`priority`.

Current slots:

| Location | Aspect | Status |
|---|---|---|
| `Story.tsx` `ProductIntro` | 16:7 | **Filled** — licensed photo (LICENSES.md) |
| `Subjects.tsx` live subject cards — Numeracy, Reading | 16:9 each | **Filled** — owner-generated thumbnail (§4 below) |
| `Subjects.tsx` live subject cards — Conventions, ICAS English, ICAS Maths | 16:9 each | `MosaicAccentArt` — no supplied thumbnail for these three; not a gap, just no matching asset |
| `Subjects.tsx` coming-soon cards — Science, Digital Technologies, Writing | 16:9 each | **Filled** — owner-generated thumbnail, decorative, `grayscale` + disabled styling kept (§4 below) |
| `Features.tsx` `Audiences()` child panel | 16:9 | **Filled** — owner-generated decorative photo (§4 below) |
| `Features.tsx` `Audiences()` parent panel | 16:9 | Reserved — open slot, no candidate cleared the bar (LICENSES.md) |
| `Experience.tsx` wide session-walkthrough banner | 21:7 | Reserved — open slot, no candidate cleared the bar (LICENSES.md); out of scope for the owner-imagery pass (banner asset was used once, in `Audiences()` instead) |
| `Proof.tsx` `SocialProof` testimonial footer | 1:1 | `AvatarInitial`, by design — stays initials-only until a testimonial is a real, consented quote |

## Licensing checklist

Before any photo ships:

- Open the actual photo page and confirm the free tier: Unsplash's own
  free/`+` split (see Selection rules above), or Pexels's licence page.
  Never trust a search-result snippet's "free for commercial use" claim
  without opening the page.
- Look at the actual downloaded pixels for face-focus, visible branding,
  and screen content — not a text summary of the composition.
- Record source URL, photographer, licence, and download date in
  `brand/assets/photography/LICENSES.md` before or as part of the same
  change that wires the image in.
- Model release: covered by the platform's own contributor terms for
  Unsplash/Pexels free-tier photos of identifiable people — no separate
  release needed for this tier, but re-check if sourcing from anywhere
  else.

## Owner-generated imagery (§4)

**Provenance:** owner-generated via ChatGPT, added 2026-07-24, cleared for
use. Source PNGs live in `brand/images/` (git-ignored, ~30MB, 72 files,
not web-served). No `asset-manifest.json` or pre-sorted category folders
ever existed alongside them — despite the naming this section originally
expected — so every file below was opened and classified by hand, and
every alt string is authored here rather than pulled verbatim from a
manifest. Several source PNGs had a checkerboard "fake transparency"
pattern baked into their RGB pixels (not a real alpha channel); those were
flood-fill-keyed to true alpha and tightly cropped before conversion —
see the WebP files below, not the raw PNGs, as the source of truth.

All 20 images are decorative accents next to their own descriptive text
(a heading, body copy, or both) — none carries information the
surrounding copy doesn't already state — so every one ships with `alt=""`
per WCAG (redundant alt text is worse than none). This matches how the
existing Lucide feature icons are already `aria-hidden`.

| File | Used in | Notes |
|---|---|---|
| `public/landing/subjects/numeracy.webp` | `Subjects.tsx` — NAPLAN Numeracy card topper | 16:9 crop, illustrated |
| `public/landing/subjects/reading.webp` | `Subjects.tsx` — NAPLAN Reading card topper | 16:9 crop, illustrated |
| `public/landing/subjects/science.webp` | `Subjects.tsx` — ICAS-style Science (coming soon) topper | decorative, `grayscale`, card stays disabled |
| `public/landing/subjects/writing.webp` | `Subjects.tsx` — NAPLAN-style Writing (coming soon) topper | decorative, `grayscale`, card stays disabled |
| `public/landing/subjects/digital_technologies.webp` | `Subjects.tsx` — ICAS-style Digital Technologies (coming soon) topper | decorative, `grayscale`, card stays disabled |
| `public/landing/subjects/numeracy-icon.webp` | `Subjects.tsx` — small icon beside "NAPLAN Numeracy" | de-checkered, 28px |
| `public/landing/subjects/reading-icon.webp` | `Subjects.tsx` — small icon beside "NAPLAN Reading" | de-checkered, 28px |
| `public/landing/subjects/science-icon.webp` | `Subjects.tsx` — small icon beside "ICAS-style Science" | de-checkered, 28px, `grayscale` |
| `public/landing/subjects/writing-icon.webp` | `Subjects.tsx` — small icon beside "NAPLAN-style Writing" | de-checkered, 28px, `grayscale` |
| `public/landing/subjects/digital_technologies-icon.webp` | `Subjects.tsx` — small icon beside "ICAS-style Digital Technologies" | de-checkered, 28px, `grayscale` |
| `public/landing/banner/student_with_tablet.webp` | `Features.tsx` `Audiences()` — child panel | portrait cutout, clean canvas, cropped to content; `object-contain` over a brand-gradient band |
| `public/landing/process/choose_subject.webp` | `Proof.tsx` `HowItWorks()` — step 1 | clean canvas, cropped to content, 80px |
| `public/landing/process/take_practice_test.webp` | `Proof.tsx` `HowItWorks()` — step 2 | 80px, plain canvas |
| `public/landing/process/get_feedback.webp` | `Proof.tsx` `HowItWorks()` — step 3 | 80px, plain canvas |
| `public/landing/process/track_growth.webp` | `Proof.tsx` `HowItWorks()` — step 4 | 80px, plain canvas; same source file as `features/smart_analytics.webp` (growth-chart glyph fits both) |
| `public/landing/features/exam_style_practice.webp` | `Features.tsx` `Features()` — "Timed and untimed modes" | clean canvas, cropped to content, 64px |
| `public/landing/features/smart_analytics.webp` | `Features.tsx` `Features()` — "Skill-level breakdowns" | 64px, plain canvas |
| `public/landing/features/curriculum_aligned.webp` | `Features.tsx` `Features()` — "Five subject areas" | clean canvas, cropped to content, 64px |
| `public/landing/features/boosts_confidence.webp` | `Features.tsx` `Features()` — "Difficulty progression" | clean canvas, cropped to content, 64px |
| `public/landing/features/safe_child_friendly.webp` | `Features.tsx` `Features()` — "Child-friendly progress view" | 64px, plain canvas |

**Held back, not wired (deliberate exclusions):**

- Instructor-portrait-style headshots (multiple people, professional
  studio crops) — no instructors exist on this platform; wiring them
  would fabricate staff.
- Additional headshots (adult and child) that read as testimonial-avatar
  candidates — testimonials are placeholders (`socialProof.disclaimer`);
  `AvatarInitial` stays until a quote is real and consented.
- Any composited "dashboard" image baking in specific numbers (e.g.
  "Overall Progress 78%", "Accuracy 85% +12% this week", "Weekly Goal
  12/15") — fabricated metrics, same rule that keeps `socialProof.metrics`
  labelled as placeholders.
- A trophy/badge icon — folded into the same fabricated-achievement
  exclusion as the progress badges above, even though it carries no
  specific number.
- A dark neon-glow icon set (people/clipboard/star/curriculum-ring on a
  near-black checkerboard canvas) — a light-canvas duplicate of the same
  four icons existed and was used instead; the dark variant doesn't match
  the site's light/pastel palette.
- Two full-page AI-generated landing-page mockups (complete with their own
  baked-in fake stats and testimonials) — never a source for real layout
  or copy.
- A `thinking_skills`-themed icon with no corresponding subject in
  `content.ts` — not wired, no subject invented for it.
- The remaining ~50 source PNGs (family/child study photography, a wooden
  math-manipulatives flat-lay, additional headshots, alternate crops) —
  reviewed, none matched a slot in the USE list for this pass.

## What never changes

- No stock-photo placeholders that don't meet the selection rules above —
  either a real photo that clears the bar, or original brand-palette art,
  nothing in between.
- No content copied or adapted from Eduleb or any other competitor site.
- Testimonial avatars stay initials-only until the testimonial itself is a
  real, consented quote — an illustrated avatar next to a placeholder quote
  is fine; a real photo next to a placeholder quote would misrepresent it
  as genuine.
