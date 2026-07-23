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
| `Subjects.tsx` 5 live subject cards | 16:9 each | `MosaicAccentArt`, by design — a consistent topper across the row, not a per-subject photo gap (see LICENSES.md) |
| `Features.tsx` `Audiences()` child/parent panels | 16:9 each | Reserved — open slot, no candidate cleared the bar (LICENSES.md) |
| `Experience.tsx` wide session-walkthrough banner | 21:7 | Reserved — open slot, no candidate cleared the bar (LICENSES.md) |
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

## What never changes

- No stock-photo placeholders that don't meet the selection rules above —
  either a real photo that clears the bar, or original brand-palette art,
  nothing in between.
- No content copied or adapted from Eduleb or any other competitor site.
- Testimonial avatars stay initials-only until the testimonial itself is a
  real, consented quote — an illustrated avatar next to a placeholder quote
  is fine; a real photo next to a placeholder quote would misrepresent it
  as genuine.
