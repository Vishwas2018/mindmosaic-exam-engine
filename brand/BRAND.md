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

`--royal-orange-tint` (`#ffd29e`) is shared by both logo components
(`MindMosaicLogo`, `LandingLogo`) as the one place they intentionally use
the *same* colour: it's the only accessible-on-dark treatment for the
orange "Mosaic" wordmark accent, so both logos read consistently instead
of drifting.

## Why the "Mosaic" wordmark isn't raw orange

`--royal-orange` (`#ff8a00`) is the brand's orange, but its contrast
against white/paper is ~2.4:1 — well under WCAG AA's 4.5:1 (or 3:1 even at
large/bold text sizes). Both logo components render the "Mosaic" half of
the wordmark as:

- `text-warning` (`#92400e`, already darkened for 4.5:1) on light
  backgrounds.
- `text-royal-orange-tint` (`#ffd29e`) on dark/royal backgrounds.

Never swap either for raw `royal-orange` text on a light background — it's
a contrast regression, not a style choice.

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
  2×2 tile icon in `bg-royal` / `bg-royal-orange`, wordmark in `text-royal`
  (or `text-white` when `inverse`) + `text-warning` /
  `text-royal-orange-tint` accent.
- `src/features/landing/components/Brand.tsx` (`LandingLogo`) — marketing
  surface only. Brain-artwork icon (`public/brand/mindmosaic-brain.png` /
  `brain-mark.svg`), wordmark in `text-brand-ink` (or `text-white` when
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
