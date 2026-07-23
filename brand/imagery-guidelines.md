# Imagery guidelines

No photography pipeline exists yet: the site isn't publicly deployed and
there's no licensed stock/photo library wired up. Until one exists, all
landing-page imagery is one of two things — never a placeholder photo, a
stock-photo import, or anything copied from a competitor (Eduleb or
otherwise).

## What we use today

1. **Authentic product-UI compositions.** CSS/SVG mockups built from the
   real design language of the actual question-card, number-line,
   progress-tile and results components — e.g. `Hero.tsx`'s `SessionMockup`
   and `Experience.tsx`'s report mockup. These are not generic dashboard
   stock art; they mirror the real product structure so a genuine
   screenshot can later drop in with the same shape.
2. **Original illustrated/gradient SVG art**, in the brand palette only
   (`--brand`, `--brand-bright`, `--brand-ink`, `--royal-orange` — see
   `design-tokens.json`), for accents and collection-style cards where a
   full product mockup would be overkill. See `MosaicAccentArt` in
   `src/features/landing/components/primitives.tsx`.

## Reserved slots for real photography later

`ImageSlot` (`src/features/landing/components/primitives.tsx`) reserves
exact space via CSS `aspect-ratio` — not an image's intrinsic size — so
swapping in a real photo later never shifts layout (no CLS). Today's
`ImageSlot` children are `MosaicAccentArt` or an `AvatarInitial` circle;
swapping to a real photo means putting a `next/image` `fill` inside the
same wrapper with no other layout change.

Current slots:

| Location | Aspect | Today | Later |
|---|---|---|---|
| `Story.tsx` `ProductIntro` | 16:7 | `MosaicAccentArt` | Photo of a child/parent using the real product |
| `Proof.tsx` `SocialProof` testimonial footer | 1:1 | `AvatarInitial` | Licensed headshot, only once a testimonial is a real, consented quote |

When adding a new slot: always wrap it in `ImageSlot` with an explicit
`aspectW`/`aspectH`, and use `next/image` with `loading="lazy"` (the
default; only hero-critical, above-the-fold imagery should ever pass
`priority`) once a real asset exists.

## Licensing checklist (for whenever real photos arrive)

Before any photo replaces a slot above:

- Written licence covering commercial/marketing use, with no
  attribution-only or editorial-only restriction.
- Model release on file for any recognisable person, given testimonials
  and family-facing photos are the two likely use cases.
- Licence term covers indefinite use or has a tracked renewal/expiry date
  recorded here.
- Source and licence reference recorded in this file, next to the slot it
  fills, e.g.:

  ```
  Story.tsx ProductIntro slot — [Source name], licence [type/ID], expires [date or "perpetual"]
  ```

## What never changes

- No stock-photo placeholders (generic "happy family at laptop" images) —
  either the real thing or original brand-palette art, nothing in between.
- No content copied or adapted from Eduleb or any other competitor site.
- Testimonial avatars stay initials-only until the testimonial itself is a
  real, consented quote — an illustrated avatar next to a placeholder quote
  is fine; a real photo next to a placeholder quote would misrepresent it
  as genuine.
