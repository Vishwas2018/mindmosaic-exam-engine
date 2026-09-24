# MindMosaic Landing Page — Comprehensive Visual & UI/UX Audit Report & Phase 2 Proposal

**Audit Date:** 24–25 September 2026  
**Audited Target & Build:** Local `main` branch @ commit [`db1d5aeba4be89257b6f3e50799aed524f8807c3`](file:///C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine) (`http://localhost:3000/`)  
**Auditor Frameworks & Tools:** `design-review`, `a11y-audit`, `web-design-guidelines`, `minimalist-ui`, `design-taste-frontend`, axe-core (WCAG 2.2 AA rulesets), and Microsoft Playwright CLI.  
**Tested Viewports:**
- **Desktop:** 1440 × 900 px
- **Tablet:** 1024 × 768 px
- **Mobile:** 390 × 844 px

---

## 1. Audit Confirmation & Verification Details

### 1.1 Audited Build & Environment
- **Branch:** `feat/landing-page-phase-1` branched from clean `origin/main` at commit SHA `db1d5aeba4be89257b6f3e50799aed524f8807c3` (incorporating PR #6 onboarding modal & 5-question warmup baseline).
- **Environment:** Node.js v24.15.0 on Windows (App Router, Turbopack dev/build).

---

### 1.2 Skip Link Visibility Investigation
- **Fresh Load Analysis (No Input / No Focus):**
  - Evaluated the DOM computed style on fresh load:
    - Bounding Box: `top: -64.8px`, `left: 12px`, `transform: matrix(1, 0, 0, 1, 0, -76.8)`
    - On a clean, initial viewport render with no keyboard input, the element was translated `-160%` offscreen above the viewport.
  - **Why it appeared in earlier section captures:**
    - Element screenshotting (`sec.screenshot()`) and certain scroll boundaries rendered the unclipped `fixed` container because it lacked explicit `clip` / `clip-path` bounding when translated.
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

#### Color & Text Contrast Review (Known Historical Failure Check):
- **Brand Coral Text Token:** Primary accent `#FF555A` on white yields `3.3:1` (fails WCAG AA 4.5:1 for normal text < 24px).
- **Enforcement:** In accordance with `globals.css` and `docs/design.md`, all coral **text** below 24px must strictly use `--mm-coral-text: #CC2429` (yielding `5.2:1` on `#FCFBF8` and `5.4:1` on `#FFFFFF`), reserving `#FF555A` exclusively for non-text graphical accents, background badges, and illustration dots.

---

### 1.4 Touch Targets Breakdown (WCAG 2.2 AA vs AAA)

Under **WCAG 2.2 SC 2.5.8 (Target Size - Minimum, Level AA)**, the requirement is **24 × 24 CSS pixels** (with exemptions for inline links within text blocks). **44 × 44 CSS pixels** is **Level AAA (SC 2.5.5)**.

#### Targets Under 24 × 24 px (AA Review):
- **Inline Text Links (WCAG Exempt):** "Assessment Disclaimer" (17px height), "Plans page" (19px height), "Help Centre" (19px height), "Privacy Policy" (19px height). These are inline prose links inside sentences and are explicitly exempted under SC 2.5.8 clause *Inline*.
- **Standalone Interactive Buttons:** 0 buttons under 24×24px (all standalone buttons exceed 28px height).

#### Targets Between 24px and 43px (AAA Improvement Opportunities):
- **Year Level Filter Pills:** `Year 1`–`Year 6` buttons have bounding box ~`62 × 36 px` (Passes AA 24px; improved with `min-h-11` / 44px on mobile touch devices).
- **Category Filter Tabs:** `All programmes`, `Curriculum`, `Assessments` pills have bounding box ~`105 × 30 px` (Passes AA 24px).
- **Primary / Secondary Toggle:** `131 × 28 px` (Passes AA 24px).
- **Footer Navigation Links:** `233 × 25 px` (Passes AA 24px with `py-[2px]`; enlarged to `py-1.5` / 32px for comfortable finger tapping).

---

### 1.5 Question Bank & Pathway Reality Audit

To ensure the landing page strictly matches product reality in both directions (never showing a pathway as available if it isn't, and never marking one unavailable if it is actually served), a live inventory was run via `npm run audit:bank` and `src/server/exam-bank.ts`.

#### Question Bank Inventory Summary:
- **Total Published Questions in Served Bank:** **1,548 questions**
- **Total Validated Curriculum Lessons:** **104 lessons** (54 in Level 3, 50 in Level 5)

#### Pathway-by-Pathway Breakdown:

| # | Pathway Name | Live Served Status | Published Question Count | Live Cohorts & Subjects |
| :-: | :--- | :---: | :---: | :--- |
| **1** | **NAPLAN-style** | **LIVE** | **756 questions** | Grade 3 & Grade 5: Numeracy (394), Reading (183), Language Conventions (178), Writing (1) |
| **2** | **ICAS-style** | **LIVE** | **792 questions** | Grade 3 & Grade 5: Numeracy/Maths (111), Reading (172), Language Conventions (131), Digital Tech (133), Science (99), Spelling (143), Writing (3) |
| **3** | **Australian Curriculum** | In Development | 0 standalone | 104 lessons live in Learning Hub; direct exam route not served separately |
| **4** | **Singapore Maths** | In Development | 0 | Curriculum content in development |
| **5** | **AMC-style (Maths Competition)** | In Development | 0 | Questions authored in factory pipeline, pending published bank release |
| **6** | **Selective School Entry-style** | In Development | 0 | Format specifications in progress |
| **7** | **Learning Hub** | Lessons Live | 104 lessons | 104 Victorian curriculum Level 3 & 5 nodes authored and verified |

---

## 2. Phase 1 Implementation Summary (Completed & Verified)

1. **Skip Link:**
   - Fixed in `src/app/globals.css`. Fully clipped offscreen via `sr-only` until keyboard focus, then visible top-left with `#5925A8` brand purple background, white text, and 2px focus ring.
2. **Primary Plan Highlight (Family Access):**
   - Brand purple border (`border-2 border-mm-brand`) + subtle elevation shadow.
   - Small coral badge (`border border-coral-border bg-coral-light text-mm-coral-text`) using canonical `#CC2429` text for WCAG 2.2 AA contrast compliance.
   - Pricing dynamically bound to `FAMILY_PLAN` from `src/lib/billing/prices.ts` (same single source of truth as checkout).
3. **Design Tokens & Card Radii:**
   - Standardized card container radii to `rounded-2xl` (16px) and interactive elements to `rounded-xl` per `docs/design.md`.
4. **Verification:**
   - `npm run typecheck` passed (0 errors)
   - `npm run lint` passed (0 errors)
   - `npm test` passed (298 test files, 5,269 tests passed)
   - `npx playwright test e2e/landing.spec.ts e2e/accessibility.spec.ts e2e/smoke.spec.ts` passed (26/26 tests green)
   - `npm run build` passed (67 static/dynamic routes compiled cleanly)

---

## 3. Phase 2 Proposal — Written Plan & Wireframes (Pending Owner Review)

### 3.1 Section Streamlining Plan (15 Sections ➔ 10 Sections)

```
CURRENT 15-SECTION STRUCTURE                     PHASE 2 TARGET (10 HIGH-IMPACT SECTIONS)
-----------------------------------------------  -----------------------------------------------
01. Hero Section                                  01. Hero Section (with compact trust strip)
02. Credibility / One Platform Banner             02. One Platform Overview Banner
03. Programmes (5 disabled cards)        ───────> 03. Live Pathways + "Coming Next" Strip
04. How It Works (3 steps)                        04. How It Works (Learn ➔ Practise ➔ Simulate)
05. Tutorials (placeholder slot)         ───────> [Merged into How It Works / Demo modal]
06. Inside the Platform (9 tabs)         ───────> 05. Product Showcase (4 Honest Core Views)
07. Question Types (14 types)                     06. Interactive Question Types Showcase
08. Learning Hub (concept theory)        ───────> [Consolidated with Curriculum / Showcase]
09. For Parents (dashboard insights)              07. For Parents & Reporting Clarity
10. Quality & Originality (10 cards)     ───────> 08. 4 Quality & Pedagogy Pillars
11. Two Audiences (Student vs Parent)    ───────> [Integrated into For Parents & Hero]
12. Plans & Pricing                               09. Honest Plans & Roadmap Access
13. Evidence (placeholder figures)       ───────> [Retained as honest legal/pilot notice]
14. Resources & Short Reads                       10. Learning Resources & FAQ Accordion
15. Closing CTA & Footer                          11. Closing CTA & Regulatory Footer
```

#### Content Reconciliation: What is Merged or Removed?
- **Removed:** The 5 separate disabled "IN DEVELOPMENT" cards and their red warning boxes in the Pathways section.
- **Added:** One compact, clean **"Coming next"** roadmap strip listing upcoming pathways (*Singapore Maths, AMC-style, Selective Entry, Australian Curriculum*) with honest "In development" tags and zero fake availability dates.
- **Merged:** `Tutorials` (empty video slot) consolidated into `How It Works` without empty placeholder video boxes.
- **Merged:** `Learning Hub` standalone card consolidated into the Curriculum tab of the Product Showcase.
- **Merged:** `Two Audiences` quotes synthesized directly into the `For Parents` bento layout.

---

### 3.2 Showcase Consolidation (9 Tabs ➔ 4 Honest Views)

Under the **`docs/design.md` §0 Data-Honesty Contract**, all views must display only features that exist in the product today, with zero invented gamification (no fake mastery %, no fake streaks, no artificial cohort percentiles).

```
+-----------------------------------------------------------------------------------------+
| [1. Student Home]   [2. Concept Lesson]   [3. Practice & Feedback]   [4. Parent Insights]  |
+-----------------------------------------------------------------------------------------+
|                                                                                         |
| VIEW 1: STUDENT HOME (Dashboard)                                                        |
| - Greeting: "Good afternoon, Mia."                                                      |
| - Primary Action: "Continue Lesson: Equivalent Fractions" (Real Lesson node VC2M5N03)   |
| - Secondary Action: "Start NAPLAN-style Practice: Grade 5 Numeracy"                     |
| - Recent Activity: 3 verified sessions (Topic, Date, Score, e.g. 9/10, 18/32)           |
|                                                                                         |
| VIEW 2: CONCEPT LESSON (Learning Hub)                                                   |
| - Lesson Title: "Fractions on a Number Line (VC2M5N03)"                                 |
| - Worked Step-by-Step Example with Pedagogical "Why" Explanation                        |
| - Visual Renderer: Fraction Bar Model SVG                                               |
|                                                                                         |
| VIEW 3: PRACTICE & REAL-TIME FEEDBACK (Practice Mode)                                   |
| - Question: Multiple Select / Number Entry item from live Grade 5 bank                  |
| - Immediate Explanation Box: Step-by-step breakdown of correct/incorrect options        |
| - Clear state badge: "Practice Mode — Explanations Shown After Every Question"          |
|                                                                                         |
| VIEW 4: PARENT INSIGHTS (Parent Dashboard)                                              |
| - Real Parent Reporting: Sessions completed by week                                     |
| - Named Skills List (e.g. "Equivalent Fractions: Developing Well; Decimals: Needs Rev") |
| - Plain-language summary (No leaderboards, no percentile rankings)                      |
+-----------------------------------------------------------------------------------------+
```

---

### 3.3 "In Development" Pathways ➔ Compact "Coming Next" Strip

```
+-----------------------------------------------------------------------------------------+
| LIVE NOW FOR GRADE 3 & GRADE 5:                                                         |
| [ NAPLAN-style Practice (756 items) ]   [ ICAS-style Practice (792 items) ]              |
+-----------------------------------------------------------------------------------------+
| COMING NEXT (In Development):                                                           |
| * Singapore Maths (Years 1–8)   * AMC-style (Years 3–12)                                |
| * Selective School Entry        * Australian Curriculum Standalone Direct Pathways      |
+-----------------------------------------------------------------------------------------+
```

---

### 3.4 Standards Grid: 10 Boxes ➔ 4 Pedagogical Pillars

```
+------------------------------------+------------------------------------+
| 01. CURRICULUM-ALIGNED & ORIGINAL  | 02. DEFECT-FREE & RESEARCH-BACKED  |
| 100% original Australian questions | Verified by multi-stage arithmetic |
| mapped to ACARA v9 learning codes. | and semantic correctness solvers.  |
+------------------------------------+------------------------------------+
| 03. IMMEDIATE WORKED EXPLANATIONS  | 04. CALM & ACCESSIBLE BY DESIGN    |
| Every question includes a child-   | WCAG 2.2 AA compliant, distraction-|
| accessible step-by-step breakdown. | free, with zero aggressive ads.    |
+------------------------------------+------------------------------------+
```

---

### 3.5 Hero Trust Strip (Compliant Marketing Copy)

Consolidate the 4 vertical checkmarks below the Hero buttons into an elegant single-line horizontal trust badge:
`✓ 100% Original Questions · ✓ NAPLAN-style & ICAS-style · ✓ Instant Step-by-Step Solutions · ✓ Made for Australian Learners`

---

## 4. Next Step

Phase 1 code changes are committed and tested on `feat/landing-page-phase-1`.  
I await your review of this proposal before making any Phase 2 structural adjustments or opening the PR.
