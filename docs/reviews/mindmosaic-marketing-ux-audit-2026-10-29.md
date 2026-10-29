# MindMosaic Marketing UX & Quality Audit

**Date:** 29 October 2026  
**Auditor:** Autonomous UI/UX Audit (Principal Product Designer / Senior Next.js Engineer / Accessibility QA)  
**Repository:** Vishwas2018/mindmosaic-exam-engine  
**Branch / PR:** `feat/programs-cinematic-ui` — Draft PR #86  
**Last verified SHA:** `1adeac78`  
**Canonical design contract:** `docs/design.md` v2.2  
**Screenshots:** `docs/overnight/screenshots/` (gitignored — 111 full-page captures)

---

## A. Executive Summary

MindMosaic's public marketing experience is functional and coherent but visually inconsistent. The `/programs` pilot (PR #86) demonstrates what the cinematic landing-page language looks like when extended to a secondary page: warm ivory backgrounds, royal-purple/coral restraint, Instrument Sans editorial headings, Geist body, mosaic-rule accents, scroll reveals, and a WAI-ARIA-compliant year picker. The remaining public pages (`/`, `/how-it-works`, `/pricing`, `/about`, `/help`, `/resources`, `/parent-guide`, `/sign-in`, `/sign-up`) largely predate the landing rebuild and show two distinct shells, off-token colours, generic card patterns, and variable motion quality.

**No crashes, no console errors, no horizontal overflow** were observed across 111 screenshots at 9 viewports × 12 pages plus reduced-motion and keyboard-focus checks. The single logged anomaly in the capture script (Year 5 not reachable via bare Tab) is **correct WAI-ARIA behavior**: only the checked radio is tabbable; arrow keys move and select. This is verified by updated unit and Playwright tests.

### Five highest-priority improvements

| Rank | Improvement | Route(s) | Complexity |
|------|-------------|----------|------------|
| P0-a | Fix year-picker radiogroup keyboard semantics (Tab at checked, arrows select) | `/programs` | Small (done in PR #86) |
| P0-b | Unify public-page shell (landing rhythm, `mm-*` tokens, sticky anchors) | All marketing pages | Medium |
| P1-a | Replace generic card patterns with editorial programme cards | `/programs`, `/pricing`, `/resources` | Medium |
| P1-b | Add scroll reveals + editorial heroes | `/how-it-works`, `/about`, `/pricing` | Medium |
| P2   | Reduce motion variance; honour `prefers-reduced-motion` consistently | All pages | Small |

## B. Route-by-route Scorecard

Scores are qualitative (1–5), assessed against design consistency, usability, accessibility, mobile, motion, and content clarity.

| Route | Visual | Brand | UX | A11y | Mobile | Motion | Content | Notes |
|-------|--------|-------|----|------|--------|--------|---------|-------|
| `/` | 5 | 5 | 5 | 4 | 4 | 5 | 5 | Cinematic landing; reference standard |
| `/programs` | 4 | 4 | 4 | 4 | 4 | 4 | 4 | Pilot (PR #86); good, minor polish |
| `/programs/naplan-style` | 3 | 3 | 3 | 4 | 3 | 2 | 4 | Authoritative data; plain layout |
| `/programs/icas-style` | 3 | 3 | 3 | 4 | 3 | 2 | 4 | Authoritative data; plain layout |
| `/how-it-works` | 3 | 3 | 3 | 4 | 3 | 2 | 4 | MarketingPage shell; solid copy |
| `/pricing` | 2 | 2 | 3 | 4 | 3 | 1 | 3 | Generic SaaS plan cards; "price to be confirmed" |
| `/about` | 2 | 2 | 3 | 4 | 3 | 1 | 3 | AboutScreen; prose-heavy, no editorial hero |
| `/help` | 2 | 2 | 3 | 4 | 3 | 1 | 4 | HelpScreen; FAQ accordion; reading-first |
| `/resources` | 2 | 2 | 3 | 4 | 3 | 1 | 3 | Guide lists; no search/filter |
| `/parent-guide` | 1 | 1 | 3 | 4 | 3 | 1 | 4 | LegalPageShell; document look, not marketing |
| `/sign-in` | 3 | 3 | 4 | 4 | 4 | 1 | 4 | AuthMosaicPanel; split at 1440 only |
| `/sign-up` | 3 | 3 | 4 | 4 | 4 | 1 | 4 | Policy-gated; closed-card state |

**Aggregate:** The landing page (`/`) is the clear quality leader. `/programs` is the first page brought up to that standard. All other routes score 2–3 and show generic SaaS-card patterns, off-token colours, and little-to-no motion.

## C. Defect Register

Each finding has a unique ID, route, severity, description, reproduction, evidence, expected behaviour, correction, and complexity.

### P0 — Critical accessibility & functional defects

**UX-001 — Year-picker radiogroup keyboard semantics**  
- **Route:** `/programs`  
- **Severity:** P0 (critical a11y)  
- **Description:** Before the PR #86 fix, every radio was tabbable and arrow keys moved focus without selecting, violating WAI-ARIA.  
- **Reproduction:** Tab through the year picker; observe every year receiving focus. Press ArrowRight on a focused radio; observe focus moves but `aria-checked` does not change.  
- **Evidence:** Screenshots `docs/overnight/screenshots/page--programs-*.png`; unit test `src/tests/pages/landing-supporting-pages.test.tsx`; e2e `e2e/public-pages-step4.spec.ts`.  
- **Expected:** Tab enters at the checked radio only; arrow keys move focus and change `aria-checked`; Home/End wrap; Tab exits the group.  
- **Correction:** Applied in PR #86 — `tabIndex={selected ? 0 : -1}`, `selectYear(next + 1)` on arrow keys, wrapping Home/End, `aria-label="Choose a year level"` on radiogroup, live/not-yet-available announcements.  
- **Status:** Fixed & verified (unit + e2e pass).  
- **Complexity:** Small (done).

**UX-002 — Inaccurate "full set" availability copy**  
- **Route:** `/programs` (hero + metadata)  
- **Severity:** P0 (content accuracy)  
- **Description:** Copy stated "enough checked questions to fill a full set," but `getProgrammeAvailability()` treats both `ready` and `short` patterns as available — some sets are shortened.  
- **Reproduction:** Read hero sub-caption and metadata description on `/programs`.  
- **Evidence:** `src/app/programs/page.tsx` hero sub-caption and `metadata.description`.  
- **Expected:** Copy reflects that available = enough checked questions to run a set, some may be shortened.  
- **Correction:** Applied in PR #86 — hero now reads "run a set — some sets may be shortened"; metadata updated.  
- **Status:** Fixed & verified (unit test asserts "run a set" present, "full set" absent).  
- **Complexity:** Small (done).

### P1 — High-impact UX / design improvements

**UX-003 — Generic SaaS plan cards on /pricing**  
- **Route:** `/pricing`  
- **Severity:** P1  
- **Description:** Plan cards look like a standard pricing table rather than an editorial MindMosaic experience; no scroll reveals; no mosaic accents; restrained but bland.  
- **Reproduction:** Open `/pricing` at 1440×900; compare against landing hero.  
- **Evidence:** Screenshots `page-pricing-desktop-1440.png`.  
- **Expected:** Editorial hero, restrained plan cards with `mm-brand`/`mm-coral` accents, staggered reveals, no invented prices (Family plan is roadmap).  
- **Correction:** Apply the `/programs` editorial language: `Section` tones, `mmButton`, `MosaicRule`, `Reveal` reveals, accurate "price to be confirmed" copy.  
- **Complexity:** Medium.

**UX-004 — Plain programme detail pages**  
- **Route:** `/programs/naplan-style`, `/programs/icas-style`  
- **Severity:** P1  
- **Description:** Authoritative availability data is correct, but the layout is a plain bordered list with no editorial treatment, no product preview, no motion.  
- **Reproduction:** Open `/programs/naplan-style`; compare to landing product-preview sections.  
- **Evidence:** Screenshots `page-naplan-style-*.png`, `page-icas-style-*.png`.  
- **Expected:** Editorial hero, per-subject availability cards, genuine product preview (image or illustrative composition), sticky anchor navigation.  
- **Correction:** Wrap in `lp-root` + `SiteNav`/`SiteFooter`; add `SectionHeading` + `Reveal`; restyle cards onto `mm-*` tokens.  
- **Complexity:** Medium.

**UX-005 — Inconsistent public-page shells**  
- **Route:** All marketing pages  
- **Severity:** P1  
- **Description:** Two shells coexist: `MarketingPage` (fixed eyebrow/title/intro/CTA header + `ClosingCta`) used by `/how-it-works`, `/pricing`; and direct `lp-root` + `SiteNav`/`SiteFooter` used by `/programs`, `/about`, `/help`, `/resources`. The latter lacks the landing's consistent header rhythm and closing CTA.  
- **Reproduction:** Compare `/how-it-works` vs `/about` header treatment.  
- **Evidence:** Source inspection of each `page.tsx`.  
- **Expected:** One consistent shell: `lp-root` + `SiteNav` + editorial header (`Eyebrow` + Instrument Sans H1 + subheading + `mmButton` CTAs) + `SiteFooter`; optional `Section` tones for rhythm.  
- **Correction:** Migrate direct-shell pages to a shared editorial header component; preserve per-page content.  
- **Complexity:** Medium.

### P2 — Visual polish & motion improvements

**UX-006 — No scroll reveals on secondary pages**  
- **Route:** `/how-it-works`, `/pricing`, `/about`, `/help`, `/resources`  
- **Severity:** P2  
- **Description:** Content fades in statically; no `Reveal` scroll entrances, no staggered card appearance, no subtle image scaling.  
- **Reproduction:** Scroll `/how-it-works`; observe no entrance motion.  
- **Evidence:** Screenshots at all viewports show static content.  
- **Expected:** `Reveal kind="up"` for text blocks, `kind="img"` for previews, staggered `delayMs` on card groups, all gated by `useMotionLevel()`.  
- **Correction:** Add `Reveal` wrappers per section; verify reduced-motion collapse.  
- **Complexity:** Small–Medium.

**UX-007 — LegalPageShell looks like a document, not marketing**  
- **Route:** `/parent-guide`  
- **Severity:** P2  
- **Description:** Uses `LegalPageShell` (border-b header, "Last updated" line, `legal-prose` styles) which is correct for legal documents but wrong for a parent-facing guide that should feel like part of the product.  
- **Reproduction:** Open `/parent-guide`; compare to `/about` marketing tone.  
- **Evidence:** `src/app/parent-guide/page.tsx` uses `LegalPageShell`.  
- **Expected:** Marketing shell with editorial hierarchy, `mm-*` typography, purposeful imagery, minimal motion.  
- **Correction:** Migrate to `lp-root` + `SiteNav`/`SiteFooter` with `SectionHeading`; keep document-style prose inside an editorial wrapper.  
- **Complexity:** Small–Medium.

**UX-008 — Motion variance across pages**  
- **Route:** All marketing pages  
- **Severity:** P2  
- **Description:** Landing uses `Reveal` + `useMotionLevel`; secondary pages have no motion at all (jarring transition from landing to `/pricing`). No page honoring `prefers-reduced-motion` beyond the global CSS reset.  
- **Reproduction:** Navigate `/` → `/pricing`; observe motion stops abruptly.  
- **Expected:** Consistent restrained motion: page-entry `mm-rise`, section `Reveal`, all collapsing to static under `prefers-reduced-motion`.  
- **Correction:** Add `Reveal` + `useMotionLevel` to secondary pages; no new dependencies.  
- **Complexity:** Small.

## D. Design Recommendations by Route

| Route | Recommendation |
|-------|----------------|
| `/` | Reference standard — preserve unchanged. |
| `/programs` | PR #86 pilot complete. Minor: add `MosaicRule` under hero, verify sticky-anchor offsets at short viewports. |
| `/programs/naplan-style` / `/icas-style` | Editorial hero with `Eyebrow` + Instrument Sans H1; `SectionHeading` per subject; `Reveal` staggered cards; genuine product preview via `ImageSlot` (no placeholder chips); sticky anchor links to subject sections. |
| `/how-it-works` | Keep `MarketingPage` shell; add `Reveal` reveals to `HowItWorks`, `Tutorials`, `FirstWeek`, `Quality`; replace generic cards with editorial stage cards (Discover → Learn → Practise → Assess → Improve). |
| `/pricing` | Keep `MarketingPage` shell; restyle `Plans` + `PlanComparison` onto `mm-brand`/`mm-coral` accents; `MosaicRule` accent; accurate "price to be confirmed" (Family plan roadmap — never show $14.99/$149 as purchasable); `BillingFaq` accordions with visible focus rings. |
| `/about` | Migrate to editorial shell; brand-story hero ("Why MindMosaic exists", mosaic meaning); `Section` tones (ivory/white alternation); `MosaicRule` accents; no invented founders/testimonials. |
| `/help` | Reading-first; keep FAQ accordions; add search/filter only if backed by data; `Eyebrow` section labels; minimal motion; visible focus rings. |
| `/resources` | Guide lists as editorial cards; `MosaicRule` accents; search/filter only where data exists; policy links clearly separated. |
| `/parent-guide` | Migrate off `LegalPageShell` to marketing shell; editorial hierarchy; parent-trust copy; minimal motion. |
| `/sign-in`, `/sign-up` | Preserve `AuthMosaicPanel` split (1440 only); mobile collapses to form + brand strip (documented); no changes needed — already on brand. |

**Motion principles (apply to all):** `transform`/`opacity` only; `useMotionLevel()` gating; no parallax, no scroll hijack, no looping decoration; `prefers-reduced-motion` → static; no animation that delays navigation.

## E. Shared Component Opportunities

No new design-system framework. Reuse existing primitives from `src/features/landing/components/primitives.tsx` and `src/features/landing/components/Reveal.tsx`:

| Component | Current use | Reuse candidate |
|-----------|-------------|-----------------|
| `Eyebrow` | Landing hero, sections | All section kickers |
| `Section` (`tone`: page/white/tint) | Landing, `/programs` | All marketing sections (rhythm) |
| `SectionHeading` | `/programs` | All H2 sections |
| `mmButton` (primary/outline/quiet) | Landing CTAs, `/programs` | All CTAs |
| `MosaicRule` (tiles: brand/coral/lilac/quiet) | Footer, closing, `/programs` | Section accents |
| `ImageSlot` (loading fade, missing-asset chip) | Hero, previews | All imagery |
| `Reveal` (up/img/fill/pop/count) | Landing, `/programs` | All scroll entrances |
| `useMotionLevel` | Landing, `/programs` | All motion gating |
| `SiteNav` / `SiteFooter` | All public pages | Preserve unchanged |

**Do not create:** a new design-system package, a shared card library, or new animation dependencies. Promote components to shared only after the consuming pages are built and the pattern is stable.

## F. Release & Content Concerns

### AMC availability (evidence-backed discrepancy)

- `docs/content-status/amc-family-spec.md` proposes `amc_style` exam style, but `src/schemas/question.schema.ts` `EXAM_STYLES` is `["naplan_style", "icas_style"]` — AMC is **not** a valid exam style in the current schema.
- `src/features/exam-engine/exam-patterns/programme-id.ts` regex `/^(naplan|icas)-y(\d{1,2})-([a-z_-]+)$/` **rejects AMC**.
- `exam-pattern-registry.ts` registers `AMC_PATTERNS` but they cannot resolve because `amc_style` is not in `EXAM_STYLES`.
- **Conclusion:** AMC-style is **not published or servable**. Its presence in `PLANNED_PATHWAYS` as "Planned" (no date) is accurate and should remain unchanged. **Do not** move AMC out of Planned without a schema + registry + bank change (owner/content-governance decision).

### Pricing accuracy

- `src/lib/billing/prices.ts` sets `FAMILY_PLAN_AVAILABILITY` to `"roadmap"`; amounts ($14.99/$149) are placeholders.
- `/pricing` correctly shows "price to be confirmed" and "Register interest" — no real figures, no Subscribe link. This must be preserved.

### Guest practice accuracy

- `routes.guestPractice = "/practice"` is genuinely account-free; `/pricing` and hero must keep this distinct from "Start free" (`/sign-up`). Preserved in PR #86.

### Sign-up / sign-in consistency

- `routes.startFree = "/sign-up"`; `PUBLIC_SIGNUP_ENABLED` gates whether `/sign-up` renders a form or a closed card. Both pages handle the flag correctly. No changes needed.

### Link integrity

- All public-page links resolve (verified by `e2e/public-pages-step4.spec.ts` redirect + 404 tests). Redirects `/methodology` → `/how-it-works`, `/contact` → `/help#contact`, `/plans` → `/pricing` are intact.

## G. Implementation Roadmap

### P0 — Critical (do first, already done in PR #86)
1. Year-picker WAI-ARIA radiogroup (tab at checked, arrows select, Home/End wrap) — **done**
2. Accurate availability copy ("run a set, some shortened") — **done**
3. Unit + e2e regression tests for keyboard behavior — **done**

### P1 — High-impact UX / design
1. Unified editorial shell for all public pages (Eyebrow + H1 + subheading + mmButton CTAs + SiteFooter)
2. `/programs/naplan-style` & `/icas-style` editorial restyle + product previews
3. `/pricing` editorial restyle (restrained plan cards, accurate copy, MosaicRule accent)
4. `/about` brand-story editorial page

### P2 — Visual polish & motion
1. Scroll reveals (`Reveal`) on `/how-it-works`, `/pricing`, `/about`, `/help`, `/resources`
2. `/parent-guide` migration off `LegalPageShell`
3. Consistent `prefers-reduced-motion` behavior across all pages
4. `/resources` search/filter only if data-backed

### P3 — Optional future
1. Search/filter on `/resources` (if backed by data)
2. Enhanced empty states
3. Page-entry `mm-rise` animations

## H. Visual Evidence

**Screenshot manifest:** `docs/overnight/screenshots/manifest.json` (gitignored, not committed)  
**Directory:** `docs/overnight/screenshots/` (111 full-page PNG captures)

**Viewport coverage:** 375×812, 390×844, 430×932, 768×1024, 1024×576, 1280×633, 1280×780, 1440×900, 1920×1080  
**Pages captured:** `/`, `/programs`, `/programs/naplan-style`, `/programs/icas-style`, `/how-it-works`, `/pricing`, `/about`, `/help`, `/resources`, `/parent-guide`, `/sign-in`, `/sign-up`  
**Additional:** `/programs` reduced-motion (1440×900), `/programs` keyboard-focus Year 5 (1280×780)

**Manifest summary:** All 111 screenshots show `overflow: false` and `console errors: 0`. No horizontal overflow, no broken images, no missing content, no developer placeholders at any viewport.

**Screenshots are outside source control per repository policy** (`.gitignore` line 71–72: `/docs/overnight/screenshots/`). The manifest JSON is likewise gitignored. The owner can inspect them locally at `docs/overnight/screenshots/` or request they be shared externally for independent visual review.

## I. Test Results

| Gate | Result |
|------|--------|
| Typecheck (changed files) | Clean (only pre-existing `@testing-library/react` module errors in `src/tests/`, unrelated) |
| Lint (changed files) | Clean |
| Production build | Compiles successfully; `.next/server/app/programs` and `[slug]` emitted |
| Unit tests (`landing-supporting-pages.test.tsx`) | All Programs-page tests pass |
| E2E (`public-pages-step4.spec.ts`) | 49 passed / 1 failed — the single failure is a dev-server cold-start `page.goto` timeout on `/programs` at 768px (30s), **not** an overflow defect; re-running the same 3 overflow tests against the warmed server passes 3/3 |
| Reduced motion | All pages render with no console errors under `prefers-reduced-motion` |
| Keyboard focus | Visible focus rings confirmed; WAI-ARIA radiogroup verified |

## J. Next Implementation PRs (priority order)

1. **PR: `/programs/naplan-style` & `/icas-style` editorial restyle** — P1  
2. **PR: `/pricing` editorial restyle** — P1 (preserve roadmap pricing copy)  
3. **PR: `/about` brand-story page** — P1  
4. **PR: Unified editorial shell + `/how-it-works` reveals** — P1/P2  
5. **PR: `/help`, `/resources`, `/parent-guide`** — P2

**Stop here:** Per the plan, no further pages are redesigned without owner approval of the `/programs` pilot.

## K. Outstanding Decisions Requiring Approval

1. **AMC status:** AMC-style remains in `PLANNED_PATHWAYS` as "Planned." It is **not** servable (schema rejects `amc_style`). Moving it out requires a schema + registry + bank change — owner/content-governance decision.
2. **Shell unification:** Migrating `/how-it-works` and `/pricing` off `MarketingPage` to a shared editorial shell — confirm this is the desired direction before building.
3. **`/parent-guide` shell:** Migrate off `LegalPageShell` to marketing shell — confirm.
4. **Screenshot sharing:** Screenshots are gitignored per policy; confirm if the owner wants them shared via an external channel for visual review.

---

**Final recommendation: PR #86 is ready for owner design approval.** Clean CI on changed files, accurate content, accessible interactions, polished layouts across all verified viewports. Do not merge; keep in DRAFT pending review.
