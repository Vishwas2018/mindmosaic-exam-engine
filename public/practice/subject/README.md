# Subject plates

The still-life artwork behind every practice program card, the hero mosaic on
/practice and the "Build your own" panel. One image per subject, referenced by
`SUBJECT_PRESENTATION` in `src/features/catalogue/presentation.ts`.

| File | Used by |
| --- | --- |
| `numeracy.webp` | Numeracy / ICAS-style Mathematics |
| `reading.webp` | Reading / ICAS-style English: Reading |
| `language-conventions.webp` | Language Conventions |
| `spelling.webp` | Spelling |
| `science.webp` | Science |
| `digital-technologies.webp` | Digital Technologies |
| `writing.webp` | The "Build your own practice" panel |

Masters live in `brand/images/practicePage/` (1448x1086 PNG). These are those,
resized to 1400px wide and encoded as WebP at quality 80 — 40-85 KB each.

Notes for whoever adds or replaces one:

- **Crop.** Cards render the plate at 3:2 on desktop and as a 96px square on
  phones, both centred, so keep the subject matter in the middle two thirds of
  the frame. The hero mosaic crops to a square as well.
- **Ground.** These sit on `--mm-page` (#fcfbf8). Renders on the same warm
  cream read as part of the page; a cooler or brighter white shows as a
  rectangle inside the card.
- **Size.** ~1400px wide is plenty — a card plate is at most ~380px on a 2x
  display. Export as WebP.
- **A missing file is safe.** `SubjectPlate` paints the artwork as a CSS
  background layer over a lilac wash carrying the subject's line mark, so a
  subject with no plate yet renders that tinted mark rather than a broken
  image. Nothing needs to be commented out while artwork is pending.
- **Decorative only.** The plate is `aria-hidden`; the card's title names the
  subject. Never put text or data in one of these images.
