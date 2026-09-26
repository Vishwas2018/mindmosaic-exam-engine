# MindMosaic Landing Page — Comprehensive Visual & UI/UX Audit Report & Phase 2 Specification

**Audit Date:** 24–25 September 2026  
**Audited Target & Build:** Local `main` branch @ commit `db1d5aeba4be89257b6f3e50799aed524f8807c3` (`http://localhost:3000/`)  
**Auditor Frameworks & Tools:** `design-review`, `a11y-audit`, `web-design-guidelines`, `minimalist-ui`, `design-taste-frontend`, axe-core (WCAG 2.2 AA rulesets), and Microsoft Playwright CLI.  
**Tested Viewports:**
- **Desktop:** 1440 × 900 px
- **Tablet:** 1024 × 768 px
- **Mobile:** 390 × 844 px

---

## 1. Audit Confirmation & Verification Details

### 1.1 Audited Build & Environment
- **Branch & Commit:** `feat/landing-page-phase-1` branched from clean `origin/main` at commit SHA `db1d5aeba4be89257b6f3e50799aed524f8807c3` (incorporating PR #6 onboarding modal & 5-question warmup baseline).
- **Environment:** Node.js v24.15.0 on Windows (Next.js 16.3.3 App Router, Turbopack dev/build).

---

### 1.2 Skip Link Visibility Investigation
- **Fresh Load Analysis (No Input / No Focus):**
  - Evaluated the DOM computed style on fresh load:
    - Bounding Box: `top: -64.8px`, `left: 12px`, `transform: matrix(1, 0, 0, 1, 0, -76.8)`
    - On a clean initial viewport render with no keyboard input, the element was translated `-160%` offscreen above the viewport.
  - **Why it appeared in earlier section captures:**
    - Element-specific screenshotting (`sec.screenshot()`) and scroll boundaries rendered the unclipped `fixed` container because it lacked explicit clipping (`clip` / `clip-path`) when translated.
  - **Phase 1 Resolution:**
    - Replaced with standard `sr-only` clipping (`width: 1px; height: 1px; clip: rect(0, 0, 0, 0); clip-path: inset(50%); overflow: hidden;`) when unfocused.
    - On `:focus` and `:focus-visible`, it expands immediately to a prominent top-left pill (`top: 1rem; left: 1rem; z-index: 100;`) with brand purple background (`#5925A8`), white text, and the canonical `docs/design.md` 2px focus ring (`outline: 2px solid #5925A8; box-shadow: 0 0 0 2px #FCFBF8, 0 0 0 4px #5925A8`).

---

### 1.3 axe-core Automated WCAG 2.2 AA Scan Results

axe-core was injected and executed across all 3 viewports filtering on `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`.

| Viewport | Automated Violations | Passes Count | Incomplete / Manual | Summary |
| :--- | :---: | :---: | :---: | :--- |
| **Desktop (1440×900)** | **0** | 32 rules | 1 | Zero automated WCAG 2.2 AA violations |
| **Tablet (1024×768)** | **0** | 32 rules | 1 | Zero automated WCAG 2.2 AA violations |
| **Mobile (390×844)** | **0** | 32 rules | 1 | Zero automated WCAG 2.2 AA violations |

#### Color & Text Contrast Review (July Contrast Failure Review):
- **Brand Coral Text & Background Contrast:**
  - Accent Coral (`#FF555A`) paired with white text yields `~3.08:1` contrast, which fails WCAG AA (minimum 4.5:1 for text < 24px). Therefore, `#FF555A` must **never** be used for small badge backgrounds with white text.
  - **Enforcement:** In accordance with `src/app/globals.css` and `docs/design.md`, all coral text and status badges must use light coral surface (`--color-coral-light: #FFF0F0`) with accessible coral text (`--mm-coral-text: #CC2429`), yielding `5.2:1` on `#FFF0F0` and `5.4:1` on `#FFFFFF`. `#FF555A` is reserved strictly for non-text graphical accents, illustration dots, and hairline decorative rules.

---

### 1.4 Price Source & Checkout Drift Analysis

- **Display Source:** `FAMILY_PLAN` in `src/lib/billing/prices.ts` is the single source of truth for display pricing across client-side landing and billing components (`A$14.99/mo` monthly, `A$149/yr` annual).
- **Checkout Charging Source:** The server checkout route (`/api/stripe/checkout`) uses server environment variables `STRIPE_PRICE_FAMILY_MONTHLY` and `STRIPE_PRICE_FAMILY_ANNUAL` to create Stripe Checkout Sessions with live Stripe Price objects.
- **Drift Boundary:** Because live charge amounts are configured directly in the Stripe Dashboard on the Stripe Price objects, `prices.ts` is a maintained client-side display representation. Until automated price hydration from Stripe Price IDs is introduced, changes to Stripe prices must be updated in `prices.ts` to prevent display drift.

---

### 1.5 Touch Targets Breakdown (WCAG 2.2 AA vs AAA)

Under **WCAG 2.2 SC 2.5.8 (Target Size - Minimum, Level AA)**, the requirement is **24 × 24 CSS pixels** (with exemptions for inline links within text blocks). **44 × 44 CSS pixels** is **Level AAA (SC 2.5.5)**.

#### Targets Under 24 × 24 px (AA Review):
- **Inline Text Links (WCAG Exempt):** "Assessment Disclaimer" (17px height), "Plans page" (19px height), "Help Centre" (19px height), "Privacy Policy" (19px height). These are inline prose links inside sentences and are explicitly exempted under SC 2.5.8 clause *Inline*.
- **Standalone Interactive Buttons:** 0 buttons under 24×24px (all standalone buttons exceed 28px height).

#### Targets Between 24px and 43px (AAA Improvement Opportunities):
- **Year Level Filter Pills:** `Year 1`–`Year 6` buttons have bounding box ~`62 × 36 px` (Passes AA 24px).
- **Category Filter Tabs:** `All programmes`, `Curriculum`, `Assessments` pills have bounding box ~`105 × 30 px` (Passes AA 24px).
- **Primary / Secondary Toggle:** `131 × 28 px` (Passes AA 24px).
- **Footer Navigation Links:** `233 × 25 px` (Passes AA 24px).

---

### 1.6 Question Bank, Pathways & Student App Routes Audit

Authoritative inventory from `npm run audit:bank` and `src/server/exam-bank.ts`:
- **Total Published Questions in Served Bank:** **1,548 questions**
- **Total Validated Curriculum Lessons:** **104 lessons** (54 in Level 3, 50 in Level 5)

#### Live Served Pathways:
- **NAPLAN-style:** **756 published questions** live for Grade 3 & Grade 5 (Numeracy: 394, Reading: 183, Language Conventions: 178, Writing: 1).
- **ICAS-style:** **792 published questions** live for Grade 3 & Grade 5 (Numeracy/Maths: 111, Reading: 172, Language Conventions: 131, Digital Tech: 133, Science: 99, Spelling: 143, Writing: 3).

#### Student App Practice Studio Routes Audit (Signed In as Year 3 / Year 5):
We audited all Practice Studio routes for unlaunched pathways (`/practice/singapore-maths`, `/practice/australian-maths-competition`, `/practice/maths-olympiad`, `/practice/selective-entry`, `/practice/scholarship-prep`, and dynamic `/practice/[program]`):

| Route | Year 3 Child View | Year 5 Child View | Result / Fail-Closed Behaviour |
| :--- | :--- | :--- | :--- |
| `/practice/singapore-maths` | Renders `ProgrammeComingSoon` | Renders `ProgrammeComingSoon` | **Honest Coming Soon** (explains in development, links to live NAPLAN/ICAS) |
| `/practice/australian-maths-competition` | Renders `ProgrammeComingSoon` | Renders `ProgrammeComingSoon` | **Honest Coming Soon** (zero content exists in any pipeline) |
| `/practice/maths-olympiad` | Renders `ProgrammeComingSoon` | Renders `ProgrammeComingSoon` | **Honest Coming Soon** (in development notice) |
| `/practice/selective-entry` | Renders `ProgrammeComingSoon` | Renders `ProgrammeComingSoon` | **Honest Coming Soon** (in development notice) |
| `/practice/scholarship-prep` | Renders `ProgrammeComingSoon` | Renders `ProgrammeComingSoon` | **Honest Coming Soon** (in development notice) |
| Dynamic `/practice/[program]` | 404 Not Found via `resolveLiveProgram` | 404 Not Found via `resolveLiveProgram` | **Fails closed clean** (never serves mixed or leaked questions) |

---

## 2. Phase 1 Implementation Summary (Completed & In PR #7)

1. **Skip Link:**
   - Hidden offscreen with strict `sr-only` clipping until keyboard focus.
   - When focused, renders at top-left with brand purple background (`#5925A8`), white text, and 2px focus ring. First focusable DOM element.
2. **Primary Plan Highlight (Family Access):**
   - Brand purple border (`border-2 border-mm-brand`) with subtle shadow lift.
   - Small coral badge (`border border-coral-border bg-coral-light text-mm-coral-text`) using canonical `#CC2429` text for WCAG 2.2 AA contrast compliance (`5.2:1`).
   - Displayed price dynamically imported from `FAMILY_PLAN` in `src/lib/billing/prices.ts`.
3. **Design Tokens & Card Radii:**
   - Standardized card container radii to `rounded-2xl` (16px) and interactive elements to `rounded-xl` per `docs/design.md`.
4. **CI Verification:**
   - GitHub Actions CI checks (`core`, `e2e`, `e2e-auth`, `rls`, `Vercel`) are **100% green**.

---

## 3. Phase 2 Specification & Implementation Plan

Phase 2 will be implemented in a dedicated branch off fresh `origin/main` after PR #7 merges.

### 3.1 15 ➔ 10 Section Architecture

```
01. Hero Section (Softened trust strip, assessment disclaimer visible)
02. One Platform Overview Banner (Transitional purple tint)
03. Live Pathways + "Coming Next" Strip (NAPLAN & ICAS live; Singapore Maths, AMC-style, Selective Entry in dev)
04. How It Works (Learn ➔ Practise ➔ Simulate flow without empty video placeholders)
05. Inside the Platform (4 Honest Real-Screen Views)
06. Interactive Question Types Showcase (14 response types)
07. For Parents & Meaningful Reporting (Sessions table + named skills list)
08. 4 Quality & Pedagogy Pillars (Scoped, proven claims)
09. Plans & Access (Guest, Monthly, Annual)
10. Resources, FAQ & Closing CTA (Accurate copy, regulatory footer)
```

---

### 3.2 Showcase: 4 Real Screen Views (Conforming to §0 Data-Honesty Contract)

| Tab / View | Target Route | Displayed Content (Real Components & Plausible Data) |
| :--- | :--- | :--- |
| **1. Student Home** | `/student` (`DashboardHero` + `RecentActivity`) | "Good afternoon, Mia." · Recommended lesson: "Start here: Fractions on a number line" · Recent sessions table (Topic, Mode, Score e.g. 9/10). No fake streaks or mastery %. |
| **2. Concept Lesson** | `/student/learn/lessons/[code]` | Real lesson `VC2M5N03` (Fractions on a Number Line) with worked 'why' explanation and deterministic SVG fraction bar. |
| **3. Practice & Feedback** | `/practice/session` | Real Grade 5 question with immediate step-by-step worked solution. Clear practice mode banner. |
| **4. Parent Insights** | `/parent` | Recent sessions table with date/mode + named skills list ("Equivalent fractions: Developing well", "Decimals: Needs revision"). No unbuilt multi-week trend chart. |

---

### 3.3 "Coming Next" Strip
- **Live Focus:** Highlight live Grade 3 & Grade 5 NAPLAN-style and ICAS-style question banks (1,548 published items).
- **Roadmap Strip:** Compact, dignified footer strip listing:
  *Singapore Maths* · *AMC-style* · *Selective Entry-style* — labelled "In development" with zero promised dates.
  *(Standalone Australian Curriculum dropped from strip since 104 lessons are already live in the Learning Hub).*

---

### 3.4 Four Quality & Pedagogy Pillars

```
+------------------------------------+------------------------------------+
| 01. MAPPED TO VICTORIAN CURRICULUM | 02. CHECKED BEFORE CHILDREN SEE IT |
| Levels 3 & 5 Mathematics & English | Automated arithmetic checks and    |
| structured to ACARA learning codes.| expert review before publication.  |
+------------------------------------+------------------------------------+
| 03. A WORKED EXPLANATION FOR EVERY | 04. CALM & ACCESSIBLE BY DESIGN    |
| QUESTION                           | WCAG 2.2 AA compliant, distraction-|
| Plain-language solutions a child   | free, with zero ads or fake timers.|
| can read and learn from alone.     |                                    |
+------------------------------------+------------------------------------+
```

---

### 3.5 Softened Hero Trust Strip

Single-line horizontal badge beneath hero CTAs:  
`✓ Original questions, written for practice · ✓ A worked explanation for every question · ✓ NAPLAN-style & ICAS-style · ✓ Made for Australian learners`  
*(Assessment disclaimer link prominently retained adjacent to CTAs).*

---

### 3.6 Two Audiences Framing
- No invented persona quotes or fictitious student/parent testimonials.
- Presented as direct product clarity copy highlighting the dual-role experience:
  - *For the Learner:* Learn concepts first, understand mistakes with instant worked solutions, sit realistic test formats.
  - *For the Parent:* Meaningful skill-by-skill progress, identify learning gaps without hovering, direct lesson links for skills to revisit.
