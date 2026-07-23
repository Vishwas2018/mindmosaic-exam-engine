# MindMosaic brand

One source of truth for colour and type across both surfaces of the app.
Values here mirror `src/app/globals.css` exactly — see `design-tokens.json`
for the machine-readable version. Edit `globals.css` first, then update
both docs; never hardcode a raw value in a component instead.

## Two palettes, one file, clear boundary

`globals.css` defines two token families side by side:

- **App tokens** (`--royal-purple`, `--royal-orange`, `--page-background`,
  `--primary-text`, `--secondary-text`, `--success`, `--warning`,
  `--error`) — the in-app exam experience (sign-in, practice, results,
  parent/teacher dashboards). **Off limits to marketing-surface work.**
- **Landing tokens** (`--brand`, `--brand-bright`, `--brand-deep`,
  `--brand-ink`, `--accent`, `--accent-strong`, `--paper`, `--landing-ink`,
  `--landing-muted`) — the marketing surface (`src/features/landing`,
  `/` only). Additive, never a fork of the app tokens.

`--accent` / `--accent-strong` are red and reserved for genuinely urgent or
negative signal — the app's `--error` semantics, mirrored on the landing
surface as attention-grabbing badges/highlight tiles/info callouts (e.g.
the placeholder-content notices in `PricingFaq.tsx`/`Proof.tsx`). Never use
red decoratively for something with no error/urgency meaning — star
ratings and the "Most families" pricing badge were fixed for exactly this
(now `royal-orange` and `brand` respectively).

`--royal-orange-tint` (`#f7700c` — the wordmark's exact required orange)
is shared by both logo components (`MindMosaicLogo`, `LandingLogo`) as the
one place they intentionally cross the app/landing boundary and use the
*same* colour: it's the accessible-on-dark treatment for the "Mosaic"
wordmark accent, so both logos read consistently instead of drifting.

The wordmark's "Mind" half crosses the same boundary the other direction:
both logo components render non-inverse "Mind" as `text-brand` (the
landing `--brand` token, `#5925a8`) — a deliberate, explicit exception to
"landing tokens stay off the in-app surface," made once, here, for this
one shared brand-identity element, not a precedent for using landing
tokens elsewhere in-app.

## Why the "Mosaic" wordmark isn't `#f7700c` everywhere

`#f7700c` is the required exact wordmark orange, but it only clears WCAG
AA contrast against **dark** backgrounds:

| Background | Contrast vs `#f7700c` | Passes? |
|---|---|---|
| White / paper (`#ffffff` / `#faf8f4`) | ~2.7-2.9:1 | **No** — fails even the 3:1 large/bold-text minimum |
| `--royal-purple` (`#4b2e83`, e.g. the auth panel) | ~3.6:1 | Large/bold text only (the wordmark always is) |
| `--brand-ink` (`#2a1051`, e.g. the admin sidebar) | ~5.6:1 | Yes, even small text |

So both logo components render "Mosaic" as:

- `text-warning` (`#92400e`, already verified ~7:1 on light backgrounds)
  on light backgrounds — a different, already-accessible shade in the same
  burnt-orange hue family (~23-26°) as `#f7700c`, not the literal hex.
- `text-royal-orange-tint` (`#f7700c` exactly) on dark/royal backgrounds,
  where it passes.

Never swap the light-background case for raw `#f7700c` text — it's a
contrast regression (confirmed both by hand calculation and by the
project's own axe-core scan), not a style choice.

### `--royal-orange` vs `--royal-orange-tint`: kept separate, on purpose

`--royal-orange` (`#ff8a00`) stays unchanged and is **not** being moved to
`#f7700c`. It's a fill/background colour (icon tiles, `bg-royal-orange`,
decorative accents) where contrast-as-text doesn't apply the same way, and
its warmer, lighter tone reads better as a solid tile than `#f7700c`'s
more red-leaning shade would. `--royal-orange-tint` exists specifically
for wordmark *text* legibility on dark backgrounds and now holds the exact
value the wordmark needs; merging the two tokens would only add risk
(re-verifying every existing fill/icon usage) for no visual or functional
benefit, since they now serve genuinely different jobs.

## Typography

Already wired, no new fonts needed:

| Role | Family | Loaded as | Utility |
|---|---|---|---|
| Display (headings) | Bricolage Grotesque | `--font-bricolage` (next/font, `src/app/page.tsx`) | `font-display` |
| Body | Inter | `--font-inter` (next/font, `src/app/page.tsx`) | `font-body` |

Outside `/` both utilities fall back to the system stack (`Segoe UI
Variable` etc.) — see the `@theme inline` block in `globals.css`.

### Type scale (landing)

Built on the two families above, as used today in
`src/features/landing/components`:

| Use | Classes |
|---|---|
| Hero headline | `font-display text-[clamp(2.6rem,6vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.035em]` |
| Section title | `font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]` |
| Card/subsection heading | `font-display text-lg font-bold tracking-[-0.02em]` |
| Body copy | `font-body` (default), `text-base leading-8` / `text-sm leading-6` |
| Eyebrow / label | `text-xs font-extrabold uppercase tracking-[0.14em]` |

## Logo usage

Two components, one visual language:

- `src/components/branding/MindMosaicLogo.tsx` — in-app (auth, dashboards).
  2×2 tile icon in `bg-royal` / `bg-royal-orange`, wordmark in `text-brand`
  (or `text-white` when `inverse`) + `text-warning` /
  `text-royal-orange-tint` accent.
- `src/features/landing/components/Brand.tsx` (`LandingLogo`) — marketing
  surface only. Brain-artwork icon (`public/brand/mindmosaic-brain.png` /
  `brain-mark.svg`), wordmark in `text-brand` (or `text-white` when
  `inverse`) + the same `text-warning` / `text-royal-orange-tint` accent.

Both accept an `inverse` prop for use on dark/royal backgrounds — always
use it there rather than hand-picking a colour per call site.

## Signature elements

- **Mosaic tile meter** (`TileMeter` in landing `primitives.tsx`) — skill
  progress as 10 discrete tiles, not a continuous bar.
- **`MosaicMark`** — the 2×2 eyebrow chip (three iris tiles, one red "piece
  that needs attention").
- **`MosaicAccentArt`** — original gradient/mosaic-tile SVG art in the
  landing palette, used in reserved imagery slots — see
  `imagery-guidelines.md`.

## Placeholder content

Testimonials, star ratings, metrics and (all but the Family tier's) pricing
are placeholders, visibly labelled on the page. Nothing here claims a
partnership, award or endorsement; the hero/footer disclaimer states
MindMosaic is independent of ACARA (NAPLAN) and ICAS Assessments.
