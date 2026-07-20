# MindMosaic Landing Page

Marketing landing page at `/` (the site root — promoted from `/landing` per
decision D2; the exam configurator that used to live at `/` moved to
`/practice`). Next.js App Router + TypeScript + Tailwind v4, fully static,
zero client JS except the mobile nav toggle.

## Run it

```bash
npm install       # if not already done
npm run dev       # http://localhost:3000/
npm run build     # production build (fonts fetched from Google at build time)
```

No environment variables, no backend. The page prerenders statically.

## File map

```
src/app/page.tsx                 # Section composition + metadata + font loading (root, not a nested layout —
                                  # see the comment in the file for why)

src/features/landing/
├── content.ts                 # ALL copy and structured content — edit words here, never in components
└── components/
    ├── primitives.tsx         # lpButton(), Eyebrow/MosaicMark, SectionHeading, TileMeter, LpCard, Stars
    ├── Brand.tsx              # LandingLogo lockup (brain PNG + wordmark)
    ├── SiteNav.tsx            # Sticky nav ("use client" — mobile menu toggle only)
    ├── Hero.tsx               # Hero + CSS-drawn number-line question mockup
    ├── Story.tsx              # Problems + ProductIntro (originality card)
    ├── Features.tsx           # 12 features + child/parent Audiences
    ├── Subjects.tsx           # Subjects + Formats (mini SVG chart/number-line/fraction chips)
    ├── Experience.tsx         # Practice experience (bar-chart question mockup) + Progress (report mockup)
    ├── Proof.tsx              # HowItWorks + SocialProof (placeholder-labelled)
    ├── PricingFaq.tsx         # Pricing (placeholder-labelled) + FAQ (details/summary, no JS)
    └── Closing.tsx            # FinalCta + SiteFooter

public/brand/
├── mindmosaic-brain.png       # Cropped brain artwork (nav, footer)
└── brain-mark.svg             # Simplified reusable SVG brain treatment

src/app/icon.svg               # Brain-only favicon (Next serves automatically, app-wide)
```

## Design tokens

Declared in `src/app/globals.css` (`:root` + `@theme inline`), additive — the
in-app exam experience keeps its existing royal-purple tokens.

| Token | Value | Tailwind utility | Use |
|---|---|---|---|
| `--brand` | `#5925A8` | `bg-brand`, `text-brand` | Primary buttons, headings accents, active states |
| `--brand-bright` | `#7C3AED` | `bg-brand-bright` | Gradient stops, glows |
| `--brand-deep` | `#43188A` | `bg-brand-deep` | Button hover |
| `--brand-ink` | `#2A1051` | `bg-brand-ink` | Dark bands (final CTA, originality card) |
| `--accent` | `#EF4444` | `bg-accent` | Badges, highlight tiles, progress emphasis — never body text |
| `--accent-strong` | `#B91C1C` | `text-accent-strong` | Red text small enough to need 4.5:1 |
| `--paper` | `#FAF8F4` | `bg-paper` | Warm neutral page background |
| `--landing-ink` | `#221833` | `text-lp-ink` | Headings/body |
| `--landing-muted` | `#5B5468` | `text-lp-muted` | Secondary text |

Fonts: `font-display` (Bricolage Grotesque) and `font-body` (Inter) resolve via
`--font-bricolage` / `--font-inter` variables set by `src/app/landing/layout.tsx`;
outside `/landing` they fall back to the system stack.

Signature element: the **mosaic tile meter** (`TileMeter`) — skill progress as
10 discrete tiles — and the 2×2 `MosaicMark` eyebrow chip (three iris tiles,
one red "piece that needs attention").

## Placeholder content

Testimonials, star ratings, user metrics and all pricing are placeholders and
are rendered with a visible "placeholder" notice on the page. No partnerships,
awards or endorsements are claimed; the hero and footer carry a
not-affiliated-with-ACARA/ICAS disclaimer. Replace in
`src/features/landing/content.ts` (`socialProof`, `pricing`) when real data
exists — remove the disclaimer strings only then.

## Integration with the existing portal

- CTAs are wired to the real routes: `nav.signIn.href` / the footer's "Sign
  in" link go to `/sign-in`; `nav.cta`, `hero.primaryCta`, `finalCta.primaryCta`
  and the footer's "Practice portal" link go to `/practice` (the exam
  configurator, moved off the root — see `src/app/practice/page.tsx`);
  pricing-tier CTAs (`PricingFaq.tsx`) go to `/sign-up`. All are still defined
  in one file (`content.ts`), except the pricing-tier href, which is hard-coded
  in `PricingFaq.tsx` since it isn't per-tier data.
- Footer Privacy/Terms/Accessibility links are still `#` placeholders — real
  pages are a later batch.
- Supabase / profiles: the page is presentation-only; nothing blocks wiring the
  nav to `authStore` later. `SiteNav` is already a client component, so showing
  a signed-in state there is a local change.
- Pricing tiers are data (`pricing.tiers`); a future subscription flow can map
  tier names to Stripe/Supabase products without layout changes.
- Progress/report mockups (`Experience.tsx`) intentionally mirror the real
  results page structure (score, per-skill accuracy, history) so screenshots of
  the live product can replace them 1:1 later.

## Quality gates (last verified)

- `npm run typecheck`, `npm run lint`, `npm run build` — clean
- `npm test` — see the test suite for current counts
- axe-core WCAG 2.1 AA scan on `/` — 0 violations
- Verified at 1440px and 390px; reduced-motion respected globally
