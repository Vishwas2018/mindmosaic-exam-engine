# Photography licences

Every real (non-illustrated) photo used on the marketing surface is recorded
here: source, photographer, licence, and download date. See
`../imagery-guidelines.md` for the selection rules and the licensing
checklist these entries satisfy.

## Active

### `public/photos/product-intro-homework-desk.jpg`

- **Used in:** `src/features/landing/components/Story.tsx`, `ProductIntro()` — the "What MindMosaic is" `ImageSlot`.
- **Source:** [unsplash.com/photos/boy-writes-on-his-book-on-the-desk-JexAuNCfefs](https://unsplash.com/photos/boy-writes-on-his-book-on-the-desk-JexAuNCfefs)
- **Photographer:** Annie Spratt (@anniespratt)
- **Licence:** [Unsplash License](https://unsplash.com/license) — free for commercial and non-commercial use, no permission or attribution required. (Credited here anyway, per house convention.)
- **Downloaded:** 2026-07-23, via `images.unsplash.com` dynamic resize (`w=1600&h=700&fit=crop&q=80&fm=jpg&auto=format`), cropped to match the 16:7 `ImageSlot` it fills.
- **Why this one:** hands/desk/notebook close-up, child's face not the focal point (out of frame/blurred), calm natural-light home setting, genuinely maths-practice-themed composition — no visible device or brand logos to clear.

## Rejected candidates (for the record — not shipped, not in `public/`)

Kept briefly so a future pass doesn't re-waste time on these:

- `photo-1639996675962-59c2befdfbf6` (Emily Wade, boy on couch with tablet) — free licence, good non-face-focal composition, but the tablet screen visibly shows a **Games** app folder ("Ben 10 AR 2", "Transformers" icons) — reads as screen-time/gaming, not practice.
- `photo-1758687126234-89901f426283` (Vitaly Gariev, father and son at laptop) — free licence, but the actual image is a posed, face-forward, brightly-lit stock composition (the fetched page summary describing it as "over-the-shoulder" did not match the pixels — verify by looking at the image, not just a text description).
- `photo-1758525860435-502240649c59` (Vitaly Gariev, two people at a table) — free licence, warm and diverse, but the subjects read as teens/young adults rather than primary-school-aged, and the crop has no visible desk/materials.
- `photo-1623076189461-f7706b741c04` (child with headphones at laptop) — free licence, but a **Dell** logo and a **Chromebook** sticker are clearly visible on the laptop lid.
- `photo-1752652012034-b28eca1e2faa` (mother and daughter on a bed) — free licence, but bed/pyjamas context reads as bedtime story time rather than a practice session, and it's portrait-orientation (poor fit for the wide/landscape slots that needed filling).
- Several Unsplash results attributed to Getty Images or otherwise marked `plus.unsplash.com` — these are **Unsplash+ (paid/premium)**, not the free Unsplash License, and were excluded regardless of composition.

## Open slots (intentionally left as `MosaicAccentArt`, not a photo)

No candidate cleared the brief (non-face-focal preferred, no visible
device/brand logos, primary-school-aged, genuinely "practice" not
"screen time" or "storytime", licence-clear) within a reasonable search
effort. Per `imagery-guidelines.md`: leave the reserved slot rather than
force a weak match.

- `Features.tsx` `Audiences()` — parent panel (child panel is now filled
  with owner-generated imagery, not a licensed stock photo — see
  imagery-guidelines.md §4).
- `Experience.tsx` `Experience()` — the wide session-walkthrough banner.
- `Subjects.tsx` `Subjects()` — Conventions of Language, ICAS English and
  ICAS Mathematics stay on `MosaicAccentArt` (no owner-supplied thumbnail
  exists for these three); Numeracy, Reading, and the three coming-soon
  cards are now filled with owner-generated imagery (imagery-guidelines.md
  §4), not licensed stock photos.
- Hero — deliberately left as the real product-UI mockup only; a photo
  would compete with it rather than strengthen it (see `Hero.tsx`).

When a real photo is ready for any of these, follow the same process:
verify the Unsplash/Pexels licence is the free tier (not `+`/premium) by
opening the actual page, look at the actual pixels (not just a fetched
text summary) for face-focus and visible branding, then add an entry above
and remove the corresponding line from this section.
