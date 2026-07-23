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
*same* colour on *every* background, light or dark: it's the "Mosaic"
wordmark's one true accent, so both logos read consistently instead of
drifting.

The wordmark's "Mind" half crosses the same boundary the other direction:
both logo components render non-inverse "Mind" as `text-brand` (the
landing `--brand` token, `#5925a8`) — a deliberate, explicit exception to
"landing tokens stay off the in-app surface," made once, here, for this
one shared brand-identity element, not a precedent for using landing
tokens elsewhere in-app.

## Why "Mosaic" is `#f7700c` everywhere — the WCAG logo exemption

`#f7700c` measures poorly against light backgrounds by the normal text
contrast rules:

| Background | Contrast vs `#f7700c` | Would pass normal body text? |
|---|---|---|
| White / paper (`#ffffff` / `#faf8f4`) | ~2.7-2.9:1 | **No** — fails even the 3:1 large/bold-text minimum |
| `--royal-purple` (`#4b2e83`, e.g. the auth panel) | ~3.6:1 | Large/bold text only |
| `--brand-ink` (`#2a1051`, e.g. the admin sidebar) | ~5.6:1 | Yes, even small text |

An earlier pass read the white/paper row as disqualifying and fell back
to `--warning` (`#92400e`, ~7:1) on light backgrounds — accessible, but
not the requested brand colour, and visibly muddier/browner than
`#f7700c`.

**That fallback was unnecessary.** WCAG 2.1 Success Criterion 1.4.3
(Contrast Minimum) has an explicit exemption:

> Text that is part of a logo or brand name has no minimum contrast
> requirement.

The "Mosaic" wordmark is exactly this case, so both logo components now
render it as `text-royal-orange-tint` (`#f7700c`) unconditionally, on
every background. **The exemption covers the logotype only** — it is
never a licence to use `#f7700c` for functional text (buttons, links,
body copy, anything a user reads for its content rather than recognises
as the brand mark) on a light background; that text still needs to clear
normal AA contrast, and nothing else on the site uses this token.

### `--royal-orange` vs `--royal-orange-tint`: kept separate, on purpose

`--royal-orange` (`#ff8a00`) stays unchanged and is **not** being moved to
`#f7700c`. It's a fill/background colour (icon tiles, `bg-royal-orange`,
decorative accents) — a different job from `--royal-orange-tint`, which
exists specifically for the wordmark's logotype text and now holds the
exact value the wordmark needs under the WCAG 1.4.3 exemption above.
Merging the two tokens would only add risk (re-verifying every existing
fill/icon usage) for no visual or functional benefit.

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
  (or `text-white` when `inverse`) + `text-royal-orange-tint` accent on
  every background (WCAG 1.4.3 logo exemption — see above).
- `src/features/landing/components/Brand.tsx` (`LandingLogo`) — marketing
  surface only. Brain-artwork icon (`public/brand/mindmosaic-brain.png` /
  `brain-mark.svg`), wordmark in `text-brand` (or `text-white` when
  `inverse`) + the same `text-royal-orange-tint` accent on every
  background.

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
