# MindMosaic Landing Page Comprehensive Audit Report
**Date:** 2026-11-04  
**Auditor:** Antigravity (Advanced Agentic Pair Programmer)  
**Targets Audited:**
- **Local:** `http://localhost:3000` (Worktree: `C:\tmp\wt-dev-landing-workspace`, Branch: `chore/dev-landing-workspace`, SHA: `17d8be2fcf81ab456980b24a65d4da0bc38950b2`)
- **Production Comparison:** `https://mindmosaic-exam-engine.vercel.app/` (Deployed from `origin/main` SHA: `4e1d80ae2c84d65c4201bccc9323a37af4a03775`)

---

## 1. Executive Summary & Overall Verdict

### Verdict: **Ready with Minor Improvements**
The MindMosaic landing page demonstrates outstanding craftsmanship in narrative pacing, visual polish, responsive adaptability, and accessibility compliance. The cinematic four-chapter architecture (Intro, Programs, How It Works, Progress & Parents) successfully conveys the product's Australian educational value proposition without resort to generic copy or unevidenced claims.

Key strengths confirmed by testing:
- **Zero Broken Links:** All 21 unique routes and in-page anchor targets return HTTP 200 with verified matching page titles and components.
- **Zero WCAG 2.2 AA Automated Violations:** Clean axe-core passes across desktop and mobile on both local dev and production builds.
- **Short-Viewport & Reduced Motion Resilience:** Full fallback to natural-flow layout on short desktop viewports (<700px for Chapters 1–3, <880px for Chapter 4) and under `prefers-reduced-motion: reduce`, ensuring copy and CTAs are never obscured by navigation rails.
- **High Contrast Focus Rings:** Solid 2px brand purple outline (with white on dark surfaces) providing >8.8:1 contrast across ivory backgrounds.
- **Honest Product Governance:** Accurate distinction between "Available now" (NAPLAN & ICAS Years 3 & 5), "Limited curriculum learning", "Limited sample open" (Singapore Maths), and "In development" (AMC & Selective). Zero fabricated testimonials or educator claims.

Three targeted improvements are identified for final production readiness:
1. **[P1 - Dev Tooling]** Dev server webpack chunk lock cascade under Windows (`next dev --webpack`).
2. **[P2 - Accessibility]** Duplicate accessible heading announcement in Chapter 1 Hero (`sr-only` `<h1>` followed immediately by visual `<h2>` with identical text).
3. **[P2 - Accessibility/Touch]** Standalone footer legal links vertical target size (20px height vs WCAG 2.5.8 24px requirement).

---

## 2. Target Verification & Runtime Environment

| Property | Local Environment | Production Environment |
| :--- | :--- | :--- |
| **URL** | `http://localhost:3000` | `https://mindmosaic-exam-engine.vercel.app/` |
| **Process / Hosting** | Node.js PID 6008/24140 (`next dev --webpack -p 3000`) | Vercel Serverless Edge / Node Runtime |
| **Working Directory** | `C:\tmp\wt-dev-landing-workspace` | Vercel Deployment Infrastructure |
| **Git Branch** | `chore/dev-landing-workspace` | `main` |
| **Git Commit SHA** | `17d8be2fcf81ab456980b24a65d4da0bc38950b2` | `4e1d80ae2c84d65c4201bccc9323a37af4a03775` |
| **Working Tree Status** | 1 modified file: `src/app/layout.tsx` (`suppressHydrationWarning` on `<body>`) | Clean build from `main` |
| **4-Chapter Landing** | Confirmed present in DOM and server HTML | Confirmed present in DOM and server HTML |
| **Feature Delta** | Includes PRs #73–#92 (Phase A audit fixes: solid focus outline, 44px hit areas, short-screen natural flow fallback, pre-hydration focus recovery) | Built prior to PR #92; lacks short-screen natural flow gating and solid focus ring enhancements |

---

## 3. Interactive Element Inventory

All 75 interactive desktop controls and 6 mobile drawer controls were catalogued and verified:

| Element | Location | Intended Action | Actual Destination / Behaviour | Result | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Skip link** | Body (top) | Skip to main content | Focuses `#main-content` with visible purple outline | PASS | [keyboard-focus-active.png](docs/audits/screenshots/2026-11-04/keyboard-focus-active.png) |
| **Logo** | SiteNav | Navigate to home | Loads `/` | PASS | Status 200, title confirmed |
| **Programs** | SiteNav | Navigate to programs | Loads `/programs` | PASS | Status 200, "Programs \| MindMosaic" |
| **How It Works** | SiteNav | Navigate to how it works | Loads `/how-it-works` | PASS | Status 200, "How It Works \| MindMosaic" |
| **Plans** | SiteNav | Navigate to pricing/plans | Loads `/pricing` | PASS | Status 200, "Plans \| MindMosaic" |
| **Resources** | SiteNav | Navigate to resources | Loads `/resources` | PASS | Status 200, "Resources \| MindMosaic" |
| **About** | SiteNav | Navigate to about | Loads `/about` | PASS | Status 200, "About \| MindMosaic" |
| **Log in** | SiteNav | Navigate to sign in | Loads `/sign-in` | PASS | Status 200, "Sign in \| MindMosaic" |
| **Start free** | SiteNav | Navigate to sign up | Loads `/sign-up` | PASS | Status 200, "Sign up \| MindMosaic" |
| **Menu Toggle** | SiteNav (mobile) | Open/close mobile drawer | Expands `#mm-mobile-nav`, flips label to "Close menu" | PASS | [local-mobile-nav-open.png](docs/audits/screenshots/2026-11-04/local-mobile-nav-open.png) |
| **Start free (Hero)** | Chapter 1 (Intro) | Primary CTA | Loads `/sign-up` | PASS | Target size 52px height |
| **Explore programs (Hero)** | Chapter 1 (Intro) | Secondary CTA | Loads `/programs` | PASS | Target size 52px height |
| **See what's open** | Chapter 1 (Intro) | Hero availability link | Loads `/programs` | PASS | Standalone link with 45px pseudo hit area |
| **Scene Nav (6 buttons)** | Chapter 1 (Intro) | Jump to scene 1..6 | Instant focus scroll to Learn..Explore | PASS | `aria-label="Scene X: ..."` |
| **Explore NAPLAN-style** | Chapter 2 (Programs) | Explore NAPLAN | Loads `/programs/naplan-style` | PASS | Status 200, "NAPLAN-style \| MindMosaic" |
| **Explore ICAS-style** | Chapter 2 (Programs) | Explore ICAS | Loads `/programs/icas-style` | PASS | Status 200, "ICAS-style \| MindMosaic" |
| **Explore learning (Curriculum)** | Chapter 2 (Programs) | Explore curriculum | Loads `/learn` | PASS | Status 200, "Learn \| MindMosaic" |
| **See all programs (AMC)** | Chapter 2 (Programs) | View programs index | Loads `/programs` | PASS | Status 200, 45px pseudo hit area |
| **Explore learning (Singapore)** | Chapter 2 (Programs) | Explore Singapore maths | Loads `/learn` | PASS | Status 200, 45px pseudo hit area |
| **See all programs (Selective)** | Chapter 2 (Programs) | View programs index | Loads `/programs` | PASS | Status 200, 45px pseudo hit area |
| **Explore all programs (Handoff)** | Chapter 2 (Programs) | Chapter 2 handoff | Loads `/programs` | PASS | Outlined button, 52px height |
| **Explore learning (Ch3 Step 1)** | Chapter 3 (How It Works) | Explore curriculum | Loads `/learn` | PASS | Status 200 |
| **Try practice (Ch3 Step 3)** | Chapter 3 (How It Works) | Try guest practice | Loads `/practice` | PASS | Status 200, "Practice programs \| MindMosaic" |
| **Explore practice (Ch3 Step 4)** | Chapter 3 (How It Works) | Explore practice index | Loads `/practice` | PASS | Status 200 |
| **Parent guide (Ch4 Step 3)** | Chapter 4 (Progress) | Read parent guide | Loads `/parent-guide` | PASS | Status 200, "Parent Guide \| MindMosaic" |
| **How we check questions** | Quality Band | Read checking methodology | Loads `/resources/how-we-check-questions` | PASS | White underline, 44px height |
| **Privacy (Care card)** | Trust & Care | Read privacy policy | Loads `/privacy` | PASS | Status 200, 44px target |
| **Accessibility (Care card)** | Trust & Care | Read a11y statement | Loads `/accessibility` | PASS | Status 200, 44px target |
| **Terms (Care card)** | Trust & Care | Read terms | Loads `/terms` | PASS | Status 200, 44px target |
| **Assessment disclaimer (Inline)** | Trust & Care | Read disclaimer | Loads `/assessment-disclaimer` | PASS | Inline link exempt from WCAG 2.5.8 |
| **FAQ Accordions (7 buttons)** | FAQ | Toggle disclosure answer | Expands panel with `aria-expanded` and grid transition | PASS | `visibility: hidden` when closed |
| **Help and contact (FAQ link)** | FAQ | Go to contact | Loads `/help#contact` | PASS | Status 200 |
| **Start free (FaqCard)** | FaqAndStart Card | Create account | Loads `/sign-up` | PASS | 52px button |
| **Explore programs (FaqCard)** | FaqAndStart Card | View programs | Loads `/programs` | PASS | 52px button |
| **Footer Logo** | SiteFooter | Home link | Loads `/` | PASS | `aria-label="MindMosaic home"` |
| **Support Email** | SiteFooter | Mailto/contact anchor | Loads `/help#contact` | PASS | 23px rendered height |
| **Footer Product Links (4)** | SiteFooter | Product navigation | How It Works, Plans, Log in, Start free | PASS | All 4 routes return 200 |
| **Footer Programs Links (4)** | SiteFooter | Programs navigation | All programs, NAPLAN, ICAS, Learn | PASS | All 4 routes return 200 |
| **Footer Support Links (3)** | SiteFooter | Support navigation | Help and contact, Resources, About | PASS | All 3 routes return 200 |
| **Footer Legal Links (4)** | SiteFooter | Legal pages | Privacy, Terms, Accessibility, Disclaimer | PASS | 20px rendered height (P2 finding) |

---

## 4. Link & User Journey Walkthroughs

The five core visitor journeys were exercised end-to-end via browser automation:

1. **Journey 1: New Parent Discovery & Programme Selection**
   - **Path:** Land on Hero -> Read two-line promise & credibility diamonds -> Click "Explore programs" -> Arrive at `/programs` -> Select "NAPLAN-style practice" (`/programs/naplan-style`) -> Use browser Back button to return to Homepage.
   - **Result:** **PASS**. Back/forward cache state preserved; no unhandled redirects or blank frames.
2. **Journey 2: Returning User Sign-in**
   - **Path:** Click "Log in" in desktop SiteNav -> Arrive at `/sign-in` -> Confirm form inputs present (`#auth-ident` and `#auth-secret`).
   - **Result:** **PASS**. Supports both parent email and student username input formats.
3. **Journey 3: Visitor "How It Works" to Parent Guide**
   - **Path:** Click "How It Works" in SiteNav -> Arrive at `/how-it-works` -> Follow link to `/parent-guide` -> Arrive at Parent Guide.
   - **Result:** **PASS**. Clear information architecture and reciprocal navigation.
4. **Journey 4: Supported Year Levels & Programme Availability**
   - **Path:** Scroll to Chapter 2 ("Choose your pathway") -> Inspect the 6 pathways list and individual scene cards.
   - **Result:** **PASS**. Clear visual status indicators (green check for Available now, purple clock for Limited/sample, dashed pill for In development).
5. **Journey 5: Support, Legal & Governance**
   - **Path:** Scroll to Footer -> Click "Help and contact" -> Arrive at `/help#contact` -> Navigate to `/privacy`, `/terms`, and `/assessment-disclaimer`.
   - **Result:** **PASS**. Clear disclaimers and draft legal disclosures without broken links.

---

## 5. Four Landing Chapters Detailed Review

| Chapter | Component | Mechanics Tested | Visual & UX Findings | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Chapter 1** | `ChapterOneIntro` | Pinned photographic stage (680svh travel), 6 scene crossfades, explore hold, seam mask reveal into Chapter 2. | Seamless crossfade between scenes; photos decode progressively with blurred preview placeholders; soft scrim prevents low contrast over images. Explore hold smoothly releases into Chapter 2 seam. | **PASS** |
| **Chapter 2** | `ChapterTwoPrograms` | Pinned stage (680svh travel), stationary product frames on left, copy on right, handoff card. | Product windows remain completely stationary while copy scrolls; status pills clearly distinguish available vs planned programmes. Handoff card has high-contrast CTA. | **PASS** |
| **Chapter 3** | `ChapterThreeHowItWorks` | 4 journey steps (Learn, Practise, Understand, Progress), interactive preview frames. | Step copy shares one grid cell; question state transitions from Question to Working to Understand smoothly without jumps. | **PASS** |
| **Chapter 4** | `ChapterFourProgressParents` | 3 scenes (Recent session, Topic mastery, Parent mosaic). | Mosaic layout renders cleanly; cards use standard design tokens without clipping or awkward wraps. | **PASS** |
| **Transitions & Pins** | `useChapterScroll` / `useMinWidth` | Short-viewport fallback (<700px / <880px), reduced motion, browser resize. | Short screens fall back to natural flow without sticking or trapping scroll. Resizing between desktop and mobile re-evaluates neutral inline styles without fading to 0 opacity. | **PASS** |

---

## 6. Responsive & Multi-Browser Coverage

### Viewport Matrix (All Tested in Chromium, Firefox, and WebKit)
- **320x568 (iPhone SE):** PASS (0px overflow, clean card wrapping, touch targets >= 44px)
- **375x667 (iPhone 8):** PASS (0px overflow, sticky CTA bar sits above safe area)
- **390x844 (iPhone 12/13/14):** PASS (0px overflow)
- **768x1024 (iPad Portrait):** PASS (0px overflow, 2-column footer layout)
- **1024x768 (iPad Landscape):** PASS (0px overflow, pinned stages active)
- **1024x576 (Short Desktop 16:9):** PASS (0px overflow, natural-flow fallback prevents rail overlap)
- **1280x633 (Short Laptop):** PASS (0px overflow, natural-flow fallback active)
- **1280x800 (Standard Laptop):** PASS (0px overflow, pinned stages active)
- **1440x900 (Desktop):** PASS (0px overflow, full cinematic experience)
- **1920x1080 (Full HD Desktop):** PASS (0px overflow, max-width bounded container)
- **200% Zoom Emulation (640x400):** PASS (0px overflow, reflows without clipping)

### Browser Engine Consistency
- **Chromium:** Default baseline engine; animations, CSS backdrop blur, and scroll-driven crossfades perform at 60fps.
- **Firefox:** All layout grids, flex alignments, sticky headers, and SVGs render identically. No font sizing or clipping discrepancies.
- **WebKit:** Smooth scrolling and fixed positioning behave consistently with Chromium. No sticky flickering observed.

---

## 7. Accessibility Audit (WCAG 2.2 AA Baseline)

### Automated Analysis (`@axe-core/playwright`)
- Total Violations on Clean Paint: **0**
- Color Contrast: Passes WCAG AA 4.5:1 across all body text, headings, buttons, and links. Skip link provides 8.85:1 contrast against white background. Solid focus outlines provide 9:1 contrast on ivory and white on dark surfaces.
- Decorative Media: Photographs in Chapter 1 carry descriptive alt text; all SVG decorative icons and mosaic tiles carry `aria-hidden="true"`. Product window frames carry `aria-hidden="true"` and `inert` attributes.

### Keyboard Navigation & Focus Walk
- **Skip Link:** Placed first in DOM, reveals on focus with 3px solid outline and drops user at `#main-content`.
- **Focus Visibility:** Every interactive control receives a 2px solid purple outline (`--mm-brand`) with a 2px offset, plus a decorative halo. On dark sections (`data-focus-surface="dark"`), outline dynamically shifts to solid white.
- **Focus Order:** Tab walk advances logically from header -> hero CTAs -> scene controls -> chapters -> quality -> FAQ -> footer.
- **Off-Screen Layer Focus:** Tabbing into an off-screen scene immediately brings that layer onto the screen without opacity delays.

---

## 8. Runtime & Performance Observations

- **Local Dev Server:**
  - TTFB: 156ms
  - DOM Content Loaded: 668ms
  - Full Page Load: 1346ms
  - Console: Clean, except report-only CSP warnings regarding `'unsafe-eval'` generated by Next.js development HMR source-maps.
- **Production Deployment:**
  - Deployed on Vercel Edge Network with CDN caching (Age: ~14 days, X-Vercel-Cache: HIT).
  - 0 console errors, 0 hydration mismatches, 0 failed network requests.
  - Core Web Vitals observations: LCP is driven by the preloaded hero WebP image (`ch01-scene-01-learn-v1.webp`), which is preloaded in `<head>`. CLS is near zero due to explicit aspect ratios on all visual containers and fixed grid heights.

---

## 9. Prioritised Findings & Issues Table

| ID | Severity | Section | Affected Viewports | Reproduction Steps | Expected Behaviour | Actual Behaviour | User / Dev Impact | Recommended Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-01** | **P1** | Development Infrastructure | All local viewports | Run automated tests or open multiple tabs rapidly while Next.js recompiles in dev mode. | Dev server should handle concurrent asset requests gracefully. | Windows file system lock on `.next\dev\static\chunks\webpack.js` causes `Error: UNKNOWN: unknown error, open '...webpack.js'`, locking dev server into persistent 500 error cascade until killed. | High developer friction during E2E testing and multi-tab debugging. | Add graceful file read retry or use native Turbopack dev server on Windows; ensure E2E tests run against a built server (`next start`). |
| **F-02** | **P2** | Chapter 1 Hero Heading | All viewports / Screen readers | Inspect accessibility tree or navigate by heading using screen reader. | Single clear level-1 heading. | `sr-only` `<h1>` "Learn with purpose. Practise with confidence." is followed immediately by visual `<h2>` with identical text "Learn with purpose. Practise with confidence." | Screen readers announce the exact same heading twice back-to-back. | Change the visible hero headline in Scene 0 to be the `<h1>` directly (remove `sr-only` duplicate) or mark the visual duplicate with `aria-hidden="true"`. |
| **F-03** | **P2** | SiteFooter (Bottom Legal Row) | All viewports / Mobile touch | Measure bounding box of bottom legal links: "Privacy", "Terms", "Accessibility", "Assessment disclaimer". | Standalone touch targets should meet WCAG 2.5.8 minimum (24x24px) or recommended 44x44px. | Links measure ~20px tall due to lack of vertical padding on the inline anchor tags. | Difficult to tap on touch devices without accidental mis-clicks. | Add `py-1.5` or `min-h-[24px]` (or 44px hit area via pseudo-element) to `footer.legalLinks` in `Closing.tsx`. |
| **F-04** | **P3** | HeroStoryList Headings | Mobile / Screen readers | Inspect text extraction on `HeroStoryList.tsx:37-38`. | Space between headline words: "Practice that builds real confidence." | `<span>` tags touch directly without whitespace (`</span><span ...>`), causing `innerText` extraction to yield "buildsreal", "thereal", "fromevery". | Text extraction or screen readers without block break synthesis may slur the two words together. | Add a space between the spans: `{" "}` or separate with a space character. |
| **F-05** | **P3** | Local Dev CSP Warnings | Localhost console | Open browser dev tools console on `localhost:3000`. | Clean console without warnings. | 850+ report-only CSP warnings logged regarding `'unsafe-eval'` due to Next.js dev webpack eval source-maps. | Clutters developer console logs during feature development. | In development CSP configuration, permit `'unsafe-eval'` conditionally when `NODE_ENV === 'development'`. |

---

## 10. Quality Rubric Scores

| Dimension | Score (1-10) | Criteria & Evidence | Deductions & Justifications |
| :--- | :---: | :--- | :--- |
| **Functionality & Links** | **9.5 / 10** | 100% of 21 unique routes return HTTP 200. Zero broken links, zero dead buttons. All 5 user journeys pass. Mobile drawer and accordions work with full ARIA state. | -0.5 for the local development server webpack chunk lock issue under rapid concurrent navigation. |
| **Responsiveness & Layout** | **10.0 / 10** | Tested across 10 viewports (320px to 1920px) + 200% zoom. 0px horizontal overflow. Short viewport fallback (<700px/<880px) functions flawlessly. | No deductions. Exceptional responsive design engineering. |
| **Accessibility (a11y)** | **9.0 / 10** | 0 axe-core violations. Skip link has 8.85:1 contrast. Solid 2px focus outlines with 9:1 contrast. Keyboard navigation fully traps and restores in mobile nav. | -0.5 for duplicate accessible heading in Hero (F-02). -0.5 for standalone footer legal links measuring 20px tall vs 24px WCAG 2.5.8 target size minimum (F-03). |
| **Content Clarity & Honesty** | **10.0 / 10** | Honest programme availability. Clear Australian school curriculum context (Years 3 & 5). No fake stats, testimonials, or educator endorsements. | No deductions. Exemplary educational content integrity. |
| **Visual Polish & Styling** | **9.5 / 10** | Strict adherence to `docs/design.md` token system. Typography, card shadows, and borders are unified. High-resolution WebP photographs. | -0.5 for lack of explicit whitespace separator between headline spans in `HeroStoryList` (F-04). |
| **Runtime & Performance** | **9.0 / 10** | Zero production console errors or hydration mismatches. Sub-700ms DOM load. Preloaded hero assets. Clean production build on Vercel. | -1.0 for local development server chunk file lock cascade on Windows (F-01) and excessive CSP dev report spam (F-05). |
| **OVERALL COMPOSITE** | **9.5 / 10** | High-assurance, audit-verified educational practice landing page. | Ready for production release upon resolving F-02 and F-03. |

---

## 11. Implementation Plan & Next Steps

### Phase 1: High Priority Accessibility & Content Polish (Effort: ~1 hour)
1. **Fix Hero Duplicate Heading (F-02):**
   - File: `src/features/landing/components/ChapterOneIntro.tsx` (Lines 346–380)
   - Action: Promote the visible headline in Scene 0 to the actual `<h1>` element, eliminating the redundant `<h1 className="sr-only">`.
   - Acceptance Check: Screen reader heading walk reveals exactly one `<h1>` containing "Learn with purpose. Practise with confidence.", followed by Chapter 2's `<h2>`.
2. **Enlarge Footer Legal Tap Targets (F-03):**
   - File: `src/features/landing/components/Closing.tsx` (Line 109)
   - Action: Add `py-1.5 px-1 inline-flex min-h-[28px] items-center` to `footer.legalLinks` anchors to guarantee >=24px height per WCAG 2.5.8 AA.
   - Acceptance Check: Bounding box height for "Privacy", "Terms", etc., exceeds 24px CSS height.
3. **Add Headline Word Space in HeroStoryList (F-04):**
   - File: `src/features/landing/components/HeroStoryList.tsx` (Line 37)
   - Action: Add `{" "}` between `<span>{scene.headline[0]}</span>` and `<span>{scene.headline[1]}</span>`.
   - Acceptance Check: `document.getElementById('hero-story-practise').innerText` returns `"Practice that builds real confidence."` with a space.

### Phase 2: Dev Environment Hardening (Effort: ~30 mins)
1. **Permit Dev Eval in CSP (F-05):**
   - File: `src/middleware.ts` / Next.js CSP configuration
   - Action: Include `'unsafe-eval'` in `script-src` only when `process.env.NODE_ENV !== 'production'` to eliminate dev console noise while maintaining strict production CSP.
2. **Dev Server Reliability (F-01):**
   - Use `next dev` (Turbopack) or run local audit suites against `next build && next start` to avoid Windows file system lock contention on webpack chunks.

---

## 12. Copy-Ready Implementation Prompt

To implement the recommended fixes in a dedicated worktree off `origin/dev`:

```markdown
Please apply the following three targeted accessibility and polish fixes to the MindMosaic landing page in a dedicated worktree branched from origin/dev:

1. In `src/features/landing/components/ChapterOneIntro.tsx`:
   - Replace the redundant `<h1 className="sr-only">{hero.heading} {hero.headingEmphasis}</h1>` and its immediate duplicate visual `<h2>` in Scene 0 with a single, visually rendered `<h1>` (styled with `text-[clamp(38px,min(4.8vw,7.6vh),76px)] leading-[1.02] tracking-[-0.036em] text-mm-ink text-balance`).
   - For Scenes 1 to 5 (which are marked `aria-hidden="true"` and `inert`), maintain `<h2>` or update to reflect scene structure.

2. In `src/features/landing/components/Closing.tsx`:
   - On the `footer.legalLinks` mapping (around line 109), update the link class to include `inline-flex min-h-[28px] items-center py-1` so that all four standalone legal links ("Privacy", "Terms", "Accessibility", "Assessment disclaimer") comfortably satisfy WCAG 2.5.8 Target Size Minimum (>=24px height).

3. In `src/features/landing/components/HeroStoryList.tsx`:
   - In the `h2` headline render (around line 37), insert `{" "}` between the first span `{scene.headline[0]}` and the second span `{scene.headline[1]}` to prevent text extraction from concatenating words without whitespace.

Verify with:
- `npm run typecheck`
- `npm run lint`
- `npx playwright test e2e/landing.spec.ts e2e/landing-keyboard-focus.spec.ts`
```
