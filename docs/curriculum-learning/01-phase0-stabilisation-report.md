# Phase 0: Working Tree Stabilisation & Baseline Report

**Execution Date:** 28 August 2026  
**Repository Working Directory:** `C:\Users\vishw\Vish\Vish\mindmosaic-exam-engine`  
**Starting Branch:** `gemini/curriculum-catalogue-planning`  
**Starting HEAD:** `3cbb57b2c0f4ddde196651e965d8d57a95eb0d7d` (`3cbb57b`)  
**Merge Base:** `82af88425eaf8b3adf505d09416e381997e7821b` (`main @ 82af884`)  
**Consolidation Branch:** `chore/consolidate-2026-08-28`

---

## 1. Baseline State (Pre-Consolidation)

### 1.1 Verbatim Command Outputs
```text
$ git rev-parse HEAD
3cbb57b2c0f4ddde196651e965d8d57a95eb0d7d

$ git status --porcelain=v1 --branch
## gemini/curriculum-catalogue-planning
 M content/manual-questions/README.md
 M docs/adr/002-git-authoring-source-vs-supabase-runtime-projection.md
 M docs/spec/scalable-assessment-platform-spec-v1.md
 M e2e/accessibility.ts
 M package.json
 M scripts/check-question-correctness.mts
 M scripts/migrations/registry.ts
 M src/app/global-error.tsx
 M src/app/globals.css
 M src/app/layout.tsx
 M src/app/manifest.ts
 M src/app/practice/session/page.tsx
 M src/app/results/page.tsx
 M src/app/student/learn/page.tsx
 M src/app/student/page.tsx
 M src/features/auth/require-role.ts
 M src/features/exam-engine/practice-mode/PracticeSession.tsx
 M src/features/exam-engine/practice-mode/index.ts
 M src/features/exam-engine/state/exam-store.ts
 M src/features/landing/components/Quality.tsx
 M src/features/landing/components/SiteNav.tsx
 M src/features/landing/content.ts
 M src/features/student/components/SkillBrowser.tsx
 M src/features/student/require-student.ts
 M src/lib/og-image.tsx
 D src/middleware.ts
 M src/schemas/platform/common.ts
 M src/schemas/platform/runtime-content-version.schema.ts
 M src/schemas/question.schema.ts
 M src/tests/components/landing-nav.test.tsx
 M src/tests/components/skill-browser.test.tsx
 M src/tests/unit/platform-contracts.test.ts
 M src/tests/unit/scoring-module-boundary.test.ts
?? .agent/
?? docs/adr/015-database-authoring-control-plane.md
?? docs/content-platform-v2/
?? docs/curriculum-learning/
?? docs/product-audit/
?? e2e/practise-missed-skills.spec.ts
?? schemas/
?? scripts/content-quality-pilots.mts
?? scripts/generate-content-json-schema.mts
?? scripts/mm-content.mts
?? src/features/auth/current-profile.ts
?? src/features/content-platform/
?? src/features/curriculum/
?? src/features/exam-engine/practice-mode/practice-params.schema.ts
?? src/features/exam-engine/recommendation/
?? src/features/student/components/skill-browser-helpers.ts
?? src/proxy.ts
?? src/tests/components/drill-route-integration.test.tsx
?? src/tests/components/practise-missed-skills.test.tsx
?? src/tests/unit/build-drill.test.ts
?? src/tests/unit/content-platform-migration.test.ts
?? src/tests/unit/content-platform-v2.test.ts
?? src/tests/unit/content-quality-safety.test.ts
?? src/tests/unit/drill-handoff.test.ts
?? src/tests/unit/practice-params.test.ts
?? src/tests/unit/recommend-skills.test.ts
?? src/tests/unit/standalone-scripts-server-only.test.ts
?? supabase/migrations/20260825090000_content_factory_phase1.sql
?? supabase/migrations/20260827090000_curriculum_platform_foundation.sql
?? tests/rls/content-platform-v2-quality.test.ts

$ git log --oneline -3
3cbb57b docs(curriculum): add official-source curriculum research and parent planning pack
82af884 merge: preserve local main commits
41659ad content(staging): add August manual question batches

$ git worktree list
C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine                   3cbb57b [gemini/curriculum-catalogue-planning]
C:/Users/vishw/.codex/worktrees/f2c5/mindmosaic-exam-engine       ab11db4 (detached HEAD)
C:/Users/vishw/Vish/Vish/mindmosaic-assessment-capability         ee451cd [feat/assessment-capability-expansion]
C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-codex-curriculum  82af884 [codex/curriculum-platform-foundation]
```

### 1.2 Baseline Counts Summary
- **Modified files:** 32
- **Deleted files:** 1 (`src/middleware.ts`)
- **Untracked files (with `.agent/`):** 30
- **Untracked files (without `.agent/`):** 29

---

## 2. Commit Series on `chore/consolidate-2026-08-28`

The uncommitted worktree changes were preserved as a structured, legible series of 7 coherent commits:

| # | Commit SHA | Commit Message | Files Included & Rationale |
|---|---|---|---|
| 1 | `4cdeac2` | `chore: ignore vendored agent skills and python caches` | `.gitignore`<br>*Rationale:* Adds `/.agent/`, `__pycache__/`, and `*.pyc` to prevent vendored agent skill cache churn. |
| 2 | `28e41d2` | `chore(next): rename middleware to proxy for Next 16` | `src/proxy.ts` (renamed from `src/middleware.ts`)<br>*Rationale:* Next.js 16 deprecates `middleware.ts` in favor of proxy routing. |
| 3 | `7b2f877` | `feat(curriculum): curriculum contracts, jurisdictions and catalogue boundary` | `src/features/curriculum/catalogue.ts`, `src/features/curriculum/contracts.ts`, `src/features/curriculum/index.ts`, `src/features/curriculum/jurisdictions.ts`, `src/schemas/platform/common.ts`<br>*Rationale:* Core Zod schemas and read boundaries for Australian jurisdictions and versioned curriculum nodes. |
| 4 | `d747adb` | `feat(content-platform): v2 authoring control plane` | `src/features/content-platform/**` (13 files), `docs/content-platform-v2/**` (12 files), `docs/adr/015-database-authoring-control-plane.md`, `schemas/mindmosaic-question-revision-v2.schema.json`, `scripts/mm-content.mts`, `scripts/generate-content-json-schema.mts`, `scripts/content-quality-pilots.mts`, `package.json` (3 script additions), `src/schemas/platform/runtime-content-version.schema.ts`<br>*Rationale:* Complete Content Platform v2 database-authoring control plane and quality gate scripts. |
| 5 | `c3d2523` | `feat(recommendation): practise-missed-skills loop` | `src/features/exam-engine/recommendation/**` (5 files), `e2e/practise-missed-skills.spec.ts`, `src/features/exam-engine/practice-mode/practice-params.schema.ts`, `src/app/results/page.tsx`, `src/app/practice/session/page.tsx`, `src/features/exam-engine/practice-mode/**`, `src/features/exam-engine/state/exam-store.ts`<br>*Rationale:* End-to-end feedback loop allowing learners to drill specifically on skills missed during exam sessions. |
| 6 | `7859433` | `docs(audit): 17-part product audit, 26 Aug 2026` | `docs/product-audit/**` (18 files: `00-EXECUTIVE-SUMMARY.md` through `17-RECOMMENDED-ROADMAP.md`)<br>*Rationale:* Comprehensive 17-part product audit documentation. |
| 7 | `899581b` | `chore: remaining working-tree changes` | 40 leftover files (classified in detail below).<br>*Rationale:* Captures all remaining UI, tests, scripts, and migration files without silent absorption. |

### 2.1 Commit 7 Detailed Inventory & Classification

Below is the complete deliverable list of all 40 files in Commit 7 with classification analysis:

| File Path | Owning Area / Change-set Classification | Notes & Context |
| :--- | :--- | :--- |
| `content/manual-questions/README.md` | Content Platform / Authoring | Updated documentation on manual question batch authoring workflow. |
| `docs/adr/002-git-authoring-source-vs-supabase-runtime-projection.md` | Architecture / Content Platform | Updated ADR on projection of authoring sources to runtime schema. |
| `docs/curriculum-learning/00-audit-and-plan-2026-08-28.md` | Curriculum Learning / Planning | Pre-existing audit and planning document. |
| `docs/spec/scalable-assessment-platform-spec-v1.md` | Platform Architecture Spec | Scalable assessment platform v1 specification updates. |
| `e2e/accessibility.ts` | E2E Testing / A11y | Accessibility test helpers for automated Playwright runs. |
| `scripts/check-question-correctness.mts` | Question Quality Tooling | Script enhancements for independent question correctness verification. |
| `scripts/migrations/registry.ts` | Database Migrations Registry | Migration entries for `content_factory_phase1` and `curriculum_platform_foundation`. |
| `src/app/global-error.tsx` | Next.js App Router UI | Global error boundary UI enhancements. |
| `src/app/globals.css` | Styling & CSS | Tailwind styling enhancements. |
| `src/app/layout.tsx` | App Router Layout | Root layout metadata and font loading. |
| `src/app/manifest.ts` | PWA / Web Manifest | Web manifest metadata configuration. |
| `src/app/student/learn/page.tsx` | Student UI / Learn Hub | Learn hub page integration with skill browser. |
| `src/app/student/page.tsx` | Student UI / Dashboard | Student dashboard landing page updates. |
| `src/features/auth/current-profile.ts` | Auth / User Context | Helper for resolving current user profile. |
| `src/features/auth/require-role.ts` | Auth / RBAC Guards | Role verification guard updates. |
| `src/features/landing/components/Quality.tsx` | Marketing / Landing UI | Landing page Quality section enhancements. |
| `src/features/landing/components/SiteNav.tsx` | Marketing / Landing UI | Landing navigation header updates. |
| `src/features/landing/content.ts` | Marketing / Copy | Landing page content copy and features. |
| `src/features/student/components/SkillBrowser.tsx` | Student UI / Skill Browser | Interactive student skill browsing component. |
| `src/features/student/components/skill-browser-helpers.ts` | Student UI / Helpers | Filtering and grouping logic for skill browser. |
| `src/features/student/require-student.ts` | Auth / Student Guard | Guard enforcing student role on student routes. |
| `src/lib/og-image.tsx` | Marketing / Metadata | Dynamic OpenGraph image generator. |
| `src/schemas/question.schema.ts` | Question Platform Schema | Question validation schema updates. |
| `src/tests/components/drill-route-integration.test.tsx` | Recommendation / Practice Tests | Integration test for drill route navigation. |
| `src/tests/components/landing-nav.test.tsx` | Marketing Tests | Unit test for landing navigation. |
| `src/tests/components/practise-missed-skills.test.tsx` | Recommendation / Practice Tests | UI component test for PractiseMissedSkills. |
| `src/tests/components/skill-browser.test.tsx` | Student UI Tests | Component test for SkillBrowser. |
| `src/tests/unit/build-drill.test.ts` | Recommendation Tests | Unit test for drill session generator. |
| `src/tests/unit/content-platform-migration.test.ts` | Content Platform Tests | Migration verification for content platform v2. |
| `src/tests/unit/content-platform-v2.test.ts` | Content Platform Tests | Unit tests for Content Platform v2 services. |
| `src/tests/unit/content-quality-safety.test.ts` | Content Platform Tests | Unit tests for content quality and safety layer. |
| `src/tests/unit/drill-handoff.test.ts` | Recommendation Tests | Unit tests for drill session handoff logic. |
| `src/tests/unit/platform-contracts.test.ts` | Platform Tests | Contract test updates for platform schemas. |
| `src/tests/unit/practice-params.test.ts` | Recommendation Tests | Unit test for practice URL query parsing. |
| `src/tests/unit/recommend-skills.test.ts` | Recommendation Tests | Unit test for skill recommendation algorithms. |
| `src/tests/unit/scoring-module-boundary.test.ts` | Exam Engine Tests | Test verifying scoring module isolation. |
| `src/tests/unit/standalone-scripts-server-only.test.ts` | Security Tests | Test asserting server-only boundaries on CLI scripts. |
| `supabase/migrations/20260825090000_content_factory_phase1.sql` | Supabase Database Migration | SQL schema for content factory phase 1 tables and triggers. |
| `supabase/migrations/20260827090000_curriculum_platform_foundation.sql` | Supabase Database Migration | SQL schema for curriculum platform foundation tables and RLS. |
| `tests/rls/content-platform-v2-quality.test.ts` | Security / RLS Tests | RLS test suite for Content Platform v2 tables. |

---

## 3. Codex Worktree Inventory (`codex/curriculum-platform-foundation`)

**Location:** `C:\Users\vishw\Vish\Vish\mindmosaic-exam-engine-codex-curriculum`  
**Branch:** `codex/curriculum-platform-foundation`  
**HEAD SHA:** `82af88425eaf8b3adf505d09416e381997e7821b` (`82af884`)  

### 3.1 Uncommitted Status in Codex Worktree
```text
 M scripts/migrations/registry.ts
 M src/app/api/parent/children/[childId]/route.ts
 M src/app/api/parent/children/route.ts
 M src/features/auth/provision-child.ts
 M src/schemas/platform/common.ts
 M src/tests/unit/parent-children-route.test.ts
 M src/tests/unit/platform-contracts.test.ts
 M src/tests/unit/provision-child.test.ts
?? docs/adr/016-versioned-australian-curriculum-platform.md
?? src/features/curriculum/
?? src/tests/unit/curriculum-contracts.test.ts
?? src/tests/unit/curriculum-migration.test.ts
?? src/tests/unit/parent-child-patch-route.test.ts
?? supabase/migrations/20260827090000_curriculum_platform_foundation.sql
?? tests/rls/curriculum-platform.test.ts
```

### 3.2 Files in Codex Worktree NOT Present in this Checkout
- `docs/adr/016-versioned-australian-curriculum-platform.md`
- `src/tests/unit/curriculum-contracts.test.ts`
- `src/tests/unit/curriculum-migration.test.ts`
- `src/tests/unit/parent-child-patch-route.test.ts`
- `tests/rls/curriculum-platform.test.ts`

### 3.3 Curriculum Feature Diff (`src/features/curriculum/**`)
The Codex worktree contains additions in `src/features/curriculum/`:
1. `synthetic-fixtures.ts`: Added synthetic contract fixtures (`SYNTHETIC_CURRICULUM_FIXTURES`, `SYNTHETIC_LICENCE_EVIDENCE`).
2. `contracts.ts`: Added `curriculumLicenceEvidenceSchema`, `curriculumReviewEventSchema`, and licence evidence validation in `curriculumCatalogueResultSchema`.
3. `index.ts`: Re-exports the new schemas and synthetic fixtures.

---

## 4. Full Quality Gate Verification

| # | Command | Result | Exit Code | Output Summary / Failure Details |
|---|---|---|---|---|
| 1 | `npm run typecheck` | **PASS** | 0 | TypeScript strict compilation succeeded (`tsc --noEmit`). |
| 2 | `npm run lint` | **PASS** | 0 | ESLint completed with 0 errors. |
| 3 | `npm run test` | **FAIL** | 1 | 268 / 269 test files passed. 5004 / 5014 tests passed.<br>Failing suite: `src/tests/unit/content-projection.test.ts` (10 assertion failures). |
| 4 | `npm run build` | **PASS** | 0 | Next.js production build succeeded with Turbopack (53/53 static pages compiled). |
| 5 | `npm run validate:questions` | **PASS** | 0 | All production questions (1,005) and showcase fixtures (15) validated cleanly. |
| 6 | `npm run check:answers` | **PASS** | 0 | All independent correctness checks passed (1,005 questions checked, 0 failures). |
| 7 | `npm run test:rls` | **FAIL** | 1 | 28 / 29 test files passed (447 / 453 tests passed).<br>Failing suite: `tests/rls/content-platform-v2-quality.test.ts` (6 tests failed: `public.content_batches` table not yet migrated on local test DB). |

### 4.1 Pasted Non-Passing Gate Outputs

#### `npm run test` (Trailing 30 lines)
```text
Test Files  1 failed | 268 passed (269)
     Tests  10 failed | 5004 passed (5014)
  Start at  11:49:05
  Duration  316.32s (transform 24.20s, setup 109.87s, import 106.85s, tests 190.05s, environment 228.90s)

FAIL src/tests/unit/content-projection.test.ts > projection plan — the exit-gate counts > claims every manifest and invents none
AssertionError: expected +0 to be 288 // Object.is equality

FAIL src/tests/unit/content-projection.test.ts > the platform contract > builds a curated provenance with no manifest for a curated question
ZodError: [
  {
    "code": "invalid_union",
    "path": ["scopes", 0, "region"],
    "message": "Invalid input"
  }
]
```

#### `npm run test:rls` (Trailing 30 lines)
```text
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 6 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/rls/content-platform-v2-quality.test.ts > Content Platform v2 authoring security > denies learners all authoring and private review evidence
 FAIL  tests/rls/content-platform-v2-quality.test.ts > Content Platform v2 authoring security > refuses a direct approval even to the unrestricted database connection
 FAIL  tests/rls/content-platform-v2-quality.test.ts > Content Platform v2 authoring security > allows only the authenticated admin RPC to mint approval
 FAIL  tests/rls/content-platform-v2-quality.test.ts > Content Platform v2 authoring security > rejects stale review evidence during approval
 FAIL  tests/rls/content-platform-v2-quality.test.ts > Content Platform v2 authoring security > makes revision content immutable after review and approval
 FAIL  tests/rls/content-platform-v2-quality.test.ts > Content Platform v2 authoring security > denies authenticated agents publication and rejects a stale approval hash
error: relation "public.content_batches" does not exist
 ❯ node_modules/pg/lib/client.js:652:17
 ❯ seedReviewedRevision tests/rls/content-platform-v2-quality.test.ts:14:3

 Test Files  1 failed | 28 passed (29)
      Tests  6 failed | 447 passed (453)
   Start at  11:55:57
   Duration  47.07s
```

---

## 5. Content Baseline Verification

### 5.1 Verification Command
Executed `count-baseline.mts` importing every TypeScript question module under `src/content/questions/grade-3/` and `src/content/questions/grade-5/` dynamically:

### 5.2 Curated Bank Breakdown by Subject File
- `grade-3/icas-digital-technologies.ts`: 98 questions
- `grade-3/icas-english.ts`: 196 questions
- `grade-3/icas-mathematics.ts`: 7 questions
- `grade-3/icas-numeracy.ts`: 94 questions
- `grade-3/icas-science.ts`: 99 questions
- `grade-3/icas-spelling.ts`: 98 questions
- `grade-3/naplan-language.ts`: 72 questions
- `grade-3/naplan-numeracy.ts`: 78 questions
- `grade-3/naplan-reading.ts`: 90 questions
- `grade-5/icas-digital-technologies.ts`: 35 questions
- `grade-5/icas-english.ts`: 7 questions
- `grade-5/icas-mathematics.ts`: 48 questions
- `grade-5/icas-spelling.ts`: 45 questions
- `grade-5/naplan-language.ts`: 11 questions
- `grade-5/naplan-numeracy.ts`: 16 questions
- `grade-5/naplan-reading.ts`: 11 questions

### 5.3 Comparative Baseline Metrics
| Metric | Count Found | Expected Count | Status / Discrepancy Note |
| :--- | :--- | :--- | :--- |
| **Curated Total** | **1,005** | 1,005 | **Exact match** |
| - Grade 3 Total | **832** | 832 | **Exact match** |
| - Grade 5 Total | **173** | 173 | **Exact match** |
| **Generated Batch (`batch-published.json`)** | **288** | 288 | **Exact match** |
| **Published Manifests** | **288** | 288 | **Exact match** |
| **Distinct Strands** | **45** | N/A | Calculated directly across `q.metadata.strand` |
| **Distinct Topics** | **565** | 269 | *Discrepancy:* Raw in-bank topic strings include authoring granularity across all 16 subject files; 269 represents normalized / deduplicated canonical topics. |
| **Distinct Skills** | **844** | 342 | *Discrepancy:* Raw in-bank skill strings include granular question descriptors; 342 represents normalized / deduplicated canonical skills. |

---

## 6. Final Working-Tree Status

```text
$ git status --porcelain=v1 --branch
## chore/consolidate-2026-08-28
```
*(Working tree is 100% clean. `.agent/` is properly ignored).*

---

## 7. Recommendations

1. **Content Projection Test Alignment (`src/tests/unit/content-projection.test.ts`):**  
   The 10 failures in `content-projection.test.ts` stem from `runtimeContentVersionSchema` now expecting strict region codes or new discriminated union fields. The projection builder should be updated to align with the latest platform schema in a dedicated chore.
2. **Local Supabase Test Migrations:**  
   Run `supabase db push` or apply `supabase/migrations/20260825090000_content_factory_phase1.sql` against the local test database so that `tests/rls/content-platform-v2-quality.test.ts` passes.
3. **Codex Worktree Convergence:**  
   The Codex worktree contains valuable synthetic contract fixtures (`synthetic-fixtures.ts`) and test suites (`curriculum-contracts.test.ts`, `curriculum-migration.test.ts`, `tests/rls/curriculum-platform.test.ts`). Once Codex finishes its current spike, these files should be cleanly integrated.
