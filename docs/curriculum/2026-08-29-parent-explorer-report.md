# Parent Curriculum Explorer Implementation Report

**Date:** 2026-08-29  
**Branch:** `agy/parent-curriculum-explorer`  
**Base Commit:** `a2ea91e2fd78558bf290f02989e6b4183a4e8fa9` (`agy/curriculum-vic-l3-l5-manifest`)  
**Route:** `/parent/curriculum-explorer`  

---

## 1. Executive Summary

We have designed, authored, and delivered the Parent Curriculum Explorer at `/parent/curriculum-explorer`.

The feature enables parents of primary students (Year 3 and Year 5) to explore exactly what skills their children are taught under the official Victorian Curriculum F–10 Version 2.0 (Mathematics and English), translated into clear, empathetic plain-English language with actionable home activities.

### Key Achievements
1. **100% Content Coverage (104/104 Nodes):**
   - **48 Mathematics Nodes:** 24 Level 3 (`VC2M3N01`–`VC2M3P02`) + 24 Level 5 (`VC2M5N01`–`VC2M5P02`)
   - **56 English Nodes:** 30 Level 3 (`VC2E3LA01`–`VC2E3LY13`) + 26 Level 5 (`VC2E5LA01`–`VC2E5LY12`)
   - Every node includes:
     - Clear, non-technical plain-English translation ("What this skill means")
     - Developmental significance ("Why it matters for your child")
     - 2–3 low-barrier, zero-preparation home activities (5–15 minutes) categorized by context (`kitchen`, `shopping`, `car`, `reading`, `outdoor`, `home`)
2. **Server Component Architecture & Security Boundaries:**
   - Server Component (`src/app/parent/curriculum-explorer/page.tsx`) queries the database exclusively via `PostgresCurriculumCatalogue` from `@/server/curriculum`.
   - Authoritative database tables and direct SQL queries remain completely hidden from browser code.
   - Protected under the existing parent role gate (`requireRole("parent", "/parent")`).
   - Hard boundaries maintained: `src/server/curriculum/**`, `src/features/curriculum/contracts.ts`, `src/features/curriculum/jurisdictions.ts`, DB migrations, `content/curriculum-imports/vic-f10-v2-l3-l5.json`, and `ADR-016` remain byte-identical to `a2ea91e`.
3. **Honest Coverage Badges:**
   - Visual 6-state coverage indicators driven by catalogue adapter counts (`covered` ≥5, `partial` 1–4, `empty` 0, plus unverified/transitional/unavailable states).
   - Currently, coverage correctly and honestly displays as "Coming soon" without fabricating fake practice question availability.
4. **Accessible UI & Design System:**
   - Adheres to MindMosaic warm house design tokens (`bg-page`, `text-ink`, `border-border`, rounded surfaces, warm terracotta/sand badges).
   - Prominent term sequencing notice explaining that Victorian schools determine their own term-by-term sequencing.
   - Accessible `<dialog>` modal with focus trapping, Escape-key dismissal, `aria-labelledby`, and `aria-describedby`.
   - Meets WCAG 2.1 AA guidelines: ≥4.5:1 text contrast, ≥44px touch targets, visible keyboard focus rings (`focus-visible:ring-2`).

---

## 2. Architecture & File Inventory

### 2.1 Parent Content Presentation Layer (`src/features/curriculum/parent-content/`)
- `types.ts`: TypeScript interfaces for `ParentHomeActivitySetting`, `ParentHomeActivity`, `ParentCurriculumContent`, and `CoverageBadgeState`.
- `math-level-3.ts`: 24 Level 3 Mathematics nodes (`VC2M3N01` through `VC2M3P02`).
- `math-level-5.ts`: 24 Level 5 Mathematics nodes (`VC2M5N01` through `VC2M5P02`).
- `english-level-3.ts`: 30 Level 3 English nodes (`VC2E3LA01` through `VC2E3LY13`).
- `english-level-5.ts`: 26 Level 5 English nodes (`VC2E5LA01` through `VC2E5LY12`).
- `index.ts`: Aggregated lookup registry `ALL_PARENT_CURRICULUM_CONTENT`, `getParentCurriculumContent`, `getVcaaSourceUrl`, and `resolveCoverageBadge`.

### 2.2 Parent Explorer Components (`src/features/curriculum/parent-explorer/`)
- `types.ts`: Explorer view models, strand definitions (`MATH_STRANDS`, `ENGLISH_STRANDS`), and strand resolver (`getNodeStrand`).
- `CoverageBadge.tsx`: Accessible 6-state badge with semantic icons and accessible tooltips/aria-labels.
- `TermSequencingNotice.tsx`: Callout highlighting school term sequencing independence.
- `CurriculumNodeCard.tsx`: Grid card presenting official code, node label, summary, home activity affordance, outbound VCAA link, and modal trigger button.
- `SkillDetailModal.tsx`: Focus-trapped `<dialog>` modal with rich plain-English explanation and setting-tagged home activities.
- `ParentCurriculumExplorer.tsx`: Client coordinator with Jurisdiction (VIC), Level (Year 3 vs Year 5), Learning Area (Maths vs English), strand tabs, real-time keyword search, and modal state.
- `index.ts`: Feature exports.

### 2.3 Route & Navigation (`src/app/parent/curriculum-explorer/`)
- `page.tsx`: Server Component fetching all 104 VIC curriculum items from `PostgresCurriculumCatalogue` using paginated cursor traversal, embedding `SiteNav` and `SiteFooter`.

### 2.4 Test Suite & Tooling
- `src/tests/components/parent-curriculum-explorer.test.tsx`: 11 component tests covering rendering, level/subject selectors, strand filtering, search filtering, modal opening/closing/content, and badge resolution.
- `src/tests/unit/parent-curriculum-explorer-page.test.tsx`: 3 unit tests covering server component metadata, unconfigured Supabase handling, and catalogue pagination.
- `e2e/parent-curriculum-explorer.spec.ts`: End-to-end smoke test verifying unauthenticated redirection and authenticated parent navigation.
- `scripts/capture-parent-explorer-screenshots.mts`: Automation script to capture desktop and mobile screenshots.

---

## 3. Coverage Badge 6-State Mapping

The coverage badge honestly represents MindMosaic practice question availability for each curriculum node:

| Badge State | Status Condition | Supporting Items | Visual Variant | Label | Meaning for Parents |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `covered` | `covered` | ≥ 5 items | Success (Emerald) | Ready to practise | MindMosaic has full practice question sets available for this skill. |
| `partial` | `partial` | 1–4 items | Warning (Amber) | In development | Questions are being authored; initial practice is available. |
| `empty` | `none` | 0 items | Neutral (Slate) | Coming soon | No practice questions yet. Home activities are provided in the interim. |
| `not_assessed` | `not_assessed` | Any | Neutral (Slate) | Formative only | Non-examinable or purely classroom-assessed skill. |
| `unverified` | `unverified` | Any | Warning (Amber) | Under review | Content alignment is pending curriculum review. |
| `transitional` | `transitional` | Any | Info (Sky) | Curriculum update | Skill is undergoing transition in current curriculum version. |

---

## 4. Screenshot Inventory

All screenshots have been generated and saved under `docs/curriculum/screenshots/`:

1. **`01-desktop-year3-mathematics.png`** (1280x900):
   - Year 3 Mathematics view showing Level & Subject selectors, Term Sequencing notice, strand tabs (Number, Algebra, Measurement, Space, Statistics, Probability), keyword filter, and skill cards with "Coming soon" badges.
2. **`02-desktop-year5-english.png`** (1280x900):
   - Year 5 English view demonstrating dynamic strand switching (Language, Literature, Literacy) and filtered cards for Level 5 English.
3. **`03-desktop-skill-detail-modal.png`** (1280x900):
   - Skill detail modal open displaying "What this skill means", "Why it matters for your child", and structured "Everyday Home Activities" (with context tags and duration badges).
4. **`04-mobile-year3-mathematics.png`** (390x844):
   - Responsive mobile view verifying touch-friendly segmented controls, vertical layout flow, and accessible touch targets.
5. **`05-mobile-skill-detail-modal.png`** (390x844):
   - Responsive modal view on mobile viewport showing readable activity cards and close affordance.

---

## 5. Verification Results

### 5.1 Database Reset & Import Pipeline
```text
> npm run db:reset
Applying migration 20260827090000_curriculum_platform_foundation.sql...
Finished supabase db reset on branch main.
Password set for mindmosaic_scoring.
Exit code: 0

> npm run curriculum:import -- --manifest content/curriculum-imports/vic-f10-v2-l3-l5.json --apply
Curriculum Import Report (apply):
Manifest: vic-f10-v2-l3-l5
Success:  YES
Duration: 441ms
Entities:
  - Evidence:         1 inserted, 0 skipped
  - Sources:          1 inserted, 0 skipped
  - Releases:         1 inserted, 0 skipped
  - Nodes:            104 inserted, 0 skipped
  - Applicabilities:  104 inserted, 0 skipped
Exit code: 0
```

### 5.2 TypeScript Typecheck
```text
> npm run typecheck
> tsc --noEmit
Exit code: 0
```

### 5.3 ESLint
```text
> npm run lint
> eslint .
Exit code: 0 (0 errors, 0 warnings)
```

### 5.4 Guarded Full Unit Test Suite
```text
> npm run test:ci
> tsx scripts/verify-test-run.mts unit

 Test Files  266 passed (266)
      Tests  4954 passed (4954)
   Duration  222.45s

Complete run (unit): 266 file(s), 4954 test(s), all concluded, none failed.
Exit code: 0
```

### 5.5 Guarded Full RLS Test Suite
```text
> npm run test:rls:ci
> tsx scripts/verify-test-run.mts rls

 Test Files  30 passed (30)
      Tests  467 passed (467)
   Duration  25.54s

Complete run (rls): 30 file(s), 467 test(s), all concluded, none failed.
Exit code: 0
```

### 5.6 Production Build
```text
> npx next build --webpack
▲ Next.js 16.2.10 (webpack)
✓ Compiled successfully in 23.6s
✓ Generating static pages using 21 workers (53/53) in 1276ms
Route (app)
├ ƒ /parent/curriculum-explorer
Exit code: 0
```

---

## 6. Immutability & Safety Check

A git diff against base commit `a2ea91e` confirms that all protected paths remain strictly untouched:
- `src/server/curriculum/**`: 0 changes
- `src/features/curriculum/contracts.ts`: 0 changes
- `src/features/curriculum/jurisdictions.ts`: 0 changes
- `supabase/migrations/**`: 0 changes
- `content/curriculum-imports/vic-f10-v2-l3-l5.json`: 0 changes
- `docs/curriculum/ADR-016-curriculum-platform-foundation.md`: 0 changes
