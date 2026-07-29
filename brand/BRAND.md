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

**Binding rule:** Roboto is the **product-wide** UI typeface — nav,
buttons, labels, card titles, body copy, forms, footer, and every surface,
in-app or marketing: auth, dashboards, billing, admin, the exam runner,
and landing alike, all through one shared token. Roboto Slab is a
landing-only display accent, reserved for **only**: the hero H1, section
H2 headings, and the large numerals in the trust/stats band, plus the
legal pages (which intentionally share it — see below). Nothing else —
not H3, not card titles, not buttons, not body copy, and never outside
that scope.

| Role | Family | Loaded as | Utility |
|---|---|---|---|
| Product-wide body/UI text (every surface) | Roboto (400/500/700/900) | `--font-roboto` (next/font, `src/app/layout.tsx`) | `font-sans` |
| Landing display accent (H1 / H2 / stats-band numerals + legal pages) | Roboto Slab (600/700) | `--font-roboto-slab` (next/font, `src/app/layout.tsx`) | `font-display` |

Both are loaded once in `src/app/layout.tsx` (`subsets: ["latin"]`,
`display: "swap"`) and applied to `<body>`, so the CSS variables exist on
every route.

**Roboto replaced Aptos as the single `--font-sans` token** — Aptos had no
`@font-face`, no self-hosted files, no `next/font/local` call of its own,
it was pure font-stack reliance on the OS having it installed (a Windows
11/Office default), so there were no assets to delete. Landing no longer
carries a separate `.lp-root`-scoped font mechanism (the old `font-body`
utility is gone, mechanically renamed to `font-sans` everywhere it was
used) — it inherits the global token exactly like every other surface
now.

**`font-display` stays genuinely landing-only**, unlike the interim
Prompt-1 version of this doc claimed: the theme-level `--font-display`
default is an inert system-serif fallback, *not* Roboto Slab, specifically
so the `font-display` utility can't silently resolve to Roboto Slab
wherever someone reaches for it. The real Roboto Slab value is scoped via
`.lp-root, .legal-page`'s plain (unlayered) CSS custom-property override
in `globals.css` — the same cascade-layer-beats-layered mechanism already
documented above `@layer base` there. (`.legal-page` is
`LegalPageShell.tsx`'s wrapper — legal pages reuse `SiteNav`/`SiteFooter`
directly and intentionally share the landing display accent.) This
scoping is load-bearing, not decorative: `FamilyPlanCard.tsx` (billing)
was found actually rendering its price in Roboto Slab before this fix,
because the token had no real scope enforcing "landing-only" beyond a
comment.

Weight note: Roboto's Google Fonts distribution only ships static
instances at 100/300/400/500/700/900 — there is no 600 or 800. This app's
`font-semibold` (600) and `font-extrabold` (800) utilities necessarily
browser-match to the nearest loaded weight (700) rather than an exact
face; an inherent limit of Roboto as a static family, not a bug.

### Type scale (landing)

Desktop values below; `clamp()` scales down for mobile (tested to 375px).

| Role | Size / line-height | Weight | Classes |
|---|---|---|---|
| H1 (hero) | 48–56px / 1.3 | 700 | `font-display text-[clamp(2.25rem,1.4rem+3.5vw,3.5rem)] font-bold leading-[1.3] tracking-[-0.02em]` |
| H2 (section title) | 32–36px / 1.3 | 700 | `font-display text-[clamp(1.75rem,1.35rem+2vw,2.25rem)] font-bold leading-[1.3] tracking-[-0.02em]` |
| H3 (card/subsection heading) | 24–28px / 1.3 | 600 | `font-sans text-[clamp(1.25rem,1.1rem+0.8vw,1.75rem)] font-semibold leading-[1.3] tracking-[-0.01em]` |
| Body copy | 16px / 1.6 | 400 | `font-sans` (default), `text-base leading-[1.6]` |
| Small | 14px / 1.6 | 400 | `text-sm leading-[1.6]` |
| Eyebrow / label | — | 800 | `text-xs font-extrabold uppercase tracking-[0.14em]` |

Section vertical padding is `py-18 sm:py-24` (72–96px) on primary content
sections. Thin accent bands that predate this scale (`TrustStrip`,
`StatsBand`, `FeatureStrip`, the footer's inner band) intentionally stay
tighter (`py-10`–`py-14`) — they're bands, not full sections.

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
