# MindMosaic Admin Portal — Scholarship Content Review & Approval Audit and Implementation Report

**Date:** 24 November 2026  
**Branch:** `feat/admin-scholarship-review-workflow` (isolated worktree off `origin/dev` `50eb8f9a`)  
**Environment Scope:** Local & DEV (`mfglzabnayacssgertat`) only — PROD (`uermhsptduikehuyceiz`) untouched  
**Status:** Implementation complete on isolated DEV branch — **DEV database migration awaiting explicit owner approval before application; 0 questions auto-approved, 0 questions auto-published, PR #142 not merged.**

---

## 1. Executive Summary

This work audited and extended the existing MindMosaic Admin Portal (`/admin/review`) inside `AdminShell` using the canonical MindMosaic Design System (`docs/design.md` v2.2) so that the provisional canonical 500-question Scholarship bank (Codex `expansion-500` + `pilot-01`) can be reviewed blind-first, decided (`Approve` / `Request revision` / `Reject`), audited with revision-bound human identity, and exported securely to MindMosaic's governed publication pipelines without creating a separate dashboard or bypassing any content governance gate.

Key outcomes:

1. **Dataset comparison & duplicate ID resolution:** Verified that `origin/dev` already holds Codex `expansion-500` (`vihaan-e500-*`, 480 items) and `pilot-01` (`vihaan-p01-*`, 20 items) with **zero ID collisions** against legacy `scholarship-y6-*` (160 items) or PR #142's AGY `bank-agy-500` (`vihaan-agy-*`, 500 items). Both original datasets are preserved verbatim; the duplicate-ID collision existed only on PR #142 where commit `992f155c` renamed `expansion-500` IDs to `vihaan-agy-*`.
2. **Existing governed writing-prompt pipeline reused:** All 40 Written Expression items map cleanly to `WritingTask` (`writingTaskSchema`, `scholarship-written-expression` v1 6-criterion human rubric) and bind `canonicalWritingPromptHash(task)` for export into `content:record-approvals` (`content/publication-approvals/writing-prompts/`). **Zero new writing taxonomy introduced.**
3. **Backward-compatible DEV migration + rollback + RLS tests:** Added `supabase/migrations/20261124090000_admin_review_decisions.sql`, rollback `supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql`, migration registry checks in `scripts/migrations/registry.ts`, and comprehensive RLS tests in `tests/rls/admin-review-decisions.test.ts`. Legacy `public.admin_draft_review_approvals` and all historical records remain untouched.
4. **Admin Portal `/admin/review` enhanced (no separate dashboard):** Added multi-bank switching (`Y6 Core (160)` and `Codex 500 (Provisional Canonical)`), batch/pool/section/difficulty/status filtering, blind-first solving mode, full Written Expression rubric preview, 3-decision human review panel (`Approve` / `Request revision` / `Reject`), human-only reviewer identity enforcement, stale-revision invalidation, and a Batch Progress & Governed Export view.
5. **Strict practice vs unseen mock separation:** Enforced across pool classification (`src/features/admin-review/pool-classification.ts`), UI filters/badges, browser CSV exports, and the read-only export CLI (`scripts/export-admin-review-approvals.mts`).

---

## 2. Dataset Quality & Completeness Comparison: Codex `expansion-500` (+ `pilot-01`) vs AGY `bank-agy-500`

Both original datasets were audited quantitatively and structurally without modifying either dataset.

| Dimension | Codex `expansion-500` + `pilot-01` (`origin/dev`, Provisional Canonical) | AGY `bank-agy-500` (PR #142, Preserved) | Assessment |
|---|---|---|---|
| **Total items & composition** | **500** (`480` expansion + `20` retained pilot) | **500** (`500` new across 10 × 50 batches) | Equal target totals |
| **Question ID scheme** | `vihaan-e500-*` (480) + `vihaan-p01-*` (20) | `vihaan-agy-*` (500) | **0 overlaps** on `origin/dev`; PR #142 commit `992f155c` introduced a collision by renaming `expansion-500` to `vihaan-agy-*` |
| **Subject distribution** | Maths 120, NR 120, VR 120, Reading 100, Writing 40 | Maths 120, NR 120, VR 120, Reading 100, Writing 40 | Exact match |
| **Difficulty distribution** | Easy 75 (15%), Medium 225 (45%), Challenging 200 (40%) | Easy 75 (15%), Medium 225 (45%), Challenging 200 (40%) | Exact match |
| **Skill taxonomy compliance** | 460/460 non-writing items map to all 29 registered Year 6 scholarship skills; 40 writing items intentionally omit invented skill IDs | 460/460 non-writing items map to all 29 registered skills; 40 writing items omit skill IDs | Parity |
| **Arithmetic verification** | 229/229 expansion arithmetic checks PASS (`0` fails) + 11/11 pilot whole-stem solvers PASS (`recompute`) = **240/240 numeric verified** | 240/240 arithmetic checks PASS (including 18 rational fraction answers) | Both pass 100%; Codex pilot adds 11 whole-stem recompute solvers |
| **Structured deterministic visuals** | `0` items with visuals (text-only) | **`43` items with canonical visuals** (`31` tables, `4` geometry, `3` coordinate grids, `5` charts/lines) | **AGY stronger** on visual variety (candidate for future visual enrichment after human review) |
| **Reading passages** | **21 passages**, 117–207 words (avg 162.0), varied genres (narrative, poetry, dialogue, notice, letter, paired accounts) | 20 passages, 59–208 words (avg 152.8), 5 Qs/passage | **Codex stronger** on minimum passage depth (117w vs 59w) and genre breadth |
| **Answer position balance (460 MCQs)** | `a: 120 (26.1%)`, `b: 104 (22.6%)`, `c: 116 (25.2%)`, `d: 120 (26.1%)` (all well under 35% cap) | `a: 115`, `b: 115`, `c: 115`, `d: 115` (exact 25.0% uniform) | Both pass; AGY is exactly uniform |
| **Australian English check** | 0 genuine US spelling errors (5 occurrences of `"meter"` in `r056..r060` verified to be `"water meter"`, valid en-AU) | 0 US spelling errors | Parity |
| **Mock exam reservation** | 100 designated mock slots (`m091..m114`, `n092..n115`, `v093..v116`, `r078..r097`, `w031..w038`; split 50/50 Mock A & Mock B); currently marked `EXPOSED_MOCK_ITEMS_PRACTICE_ONLY = true` because public repo files were exposed | 100 items cleanly isolated in `batch-09` (Mock A) and `batch-10` (Mock B) | **AGY cleaner batch layout**; Codex mock separation enforced cleanly via `pool-classification.ts` without mutating original JSON hashes |
| **Known item defect noted for human review** | `vihaan-e500-m069` (batch 6) is already withdrawn from runtime serving (`withdrawn-questions.test.ts`: no correct option) — flag `Request revision` or `Reject` during manual review | Not yet human-audited | Confirmed by existing unit test suite |
| **Cross-dataset stem overlap** | `0` exact normalized stem overlaps between Codex 500 and AGY 500 | `0` exact normalized stem overlaps | Fully disjoint — AGY 500 remains viable as a future supplementary / unseen-mock bank once privately held |

### Duplicate ID Resolution Strategy (Safe & Non-Destructive)
- **Root cause:** PR #142 (`feat/vihaan-bank-agy-500`) modified `content/vihaan-scholarship/expansion-500/batch-*.draft.json` to change `vihaan-e500-*` → `vihaan-agy-*`, colliding with `content/vihaan-scholarship/bank-agy-500/`.
- **Resolution:** Because `origin/dev` retains Codex `expansion-500` under its original `vihaan-e500-*` IDs and `pilot-01` under `vihaan-p01-*` IDs (and PR #142 is NOT merged), **zero ID collisions exist**. Both original datasets are preserved intact:
  - Provisional canonical bank in `/admin/review`: `vihaan-e500-*` (480) + `vihaan-p01-*` (20) = 500 unique IDs.
  - Legacy Scholarship Core bank in `/admin/review`: `scholarship-y6-*` = 160 unique IDs.
  - Preserved AGY bank (on PR #142): `vihaan-agy-*` = 500 unique IDs (ready for future private/unseen mock use if ever separated from commit `992f155c`).

---

## 3. Architecture & Implementation Summary

### Phase 1: Multi-Bank Registry, Pool Separation & Writing-Prompt Adapter
- [`src/features/admin-review/pool-classification.ts`](../../src/features/admin-review/pool-classification.ts):
  - Deterministic classification (`practice` | `unseen_mock` | `exposed_mock_practice_only`) and Mock Paper A/B slot mapping for the 100 designated mock items.
  - Shared `validateHumanReviewerName()` and `NON_HUMAN_REVIEWER_PATTERN` rejecting AI models, bots, automated tools, service names, and single-word placeholders (`Admin`, `Claude Sonnet`, `OpenAI Codex`, etc.).
- [`src/features/admin-review/writing-adapter.ts`](../../src/features/admin-review/writing-adapter.ts) & [`src/features/admin-review/export-csv.ts`](../../src/features/admin-review/export-csv.ts):
  - `scholarshipWritingItemToTask()` converts all 40 Written Expression drafts into canonical `WritingTask` records (`writingTaskSchema`, `scholarship-written-expression` v1 rubric) and computes `canonicalWritingPromptHash(task)`.
  - `buildGovernedExportCsv()` (kept in pure client-safe `export-csv.ts` so webpack builds never bundle Node `node:crypto`/`node:path` into client bundles) generates separate publish-compatible CSVs for `practice` vs `mock` and `question` vs `writing_prompt`.
- [`src/features/admin-review/contracts.ts`](../../src/features/admin-review/contracts.ts):
  - Preserves `scholarshipReviewSchema` untouched; adds `scholarshipWritingReviewSchema`, `reviewQuestionSchema`, 5-check `reviewChecksSchema`, `ReviewDecisionRecord`, `ReviewBankSummary`, and `summariseBatchProgress()`.
- [`src/server/admin-review.ts`](../../src/server/admin-review.ts):
  - Fixed allowlisted server-side bank loading (`scholarship-y6-core` and `vihaan-scholarship-500`), fail-closed hash verification against `release-identities.json` (Y6 Core) and `quality-coverage-report.json` (Codex 500), D1/D2/D3 hash computation, reviewer profile lookup, and backward-compatible reads across both `admin_draft_review_approvals` and `admin_draft_review_decisions`.
- [`next.config.ts`](../../next.config.ts):
  - Traces Codex `pilot-01` and `expansion-500` draft JSONs strictly into `/admin/review` only.

### Phase 2: Backward-Compatible DEV Database Migration, Rollback & RLS Tests
- **Forward migration (awaiting owner approval before applying to DEV `mfglzabnayacssgertat`):** [`supabase/migrations/20261124090000_admin_review_decisions.sql`](../../supabase/migrations/20261124090000_admin_review_decisions.sql)
  - Preserves `public.admin_draft_review_approvals` untouched.
  - Creates append-only `public.admin_draft_review_decisions` with D1/D2/D3 hashes, `bank_id`, `batch_id`, `item_kind`, `pool`, `source_revision`, `revision_number`, `decision` (`approve` | `revise` | `reject`), 5-check JSONB constraint, mandatory `notes` (`>= 10` chars) for `revise`/`reject`, `blind_solved`, `reviewer_id` (`auth.uid()` via RLS), human-only `reviewer_name` CHECK constraint, `reviewer_email` CHECK constraint, `question_snapshot` JSONB, and `evidence_fingerprint`.
  - Partial unique index on `(bank_id, question_id, content_hash, reviewer_id) where (decision = 'approve')` prevents duplicate same-revision approvals while permitting fresh approval after content revision.
  - Immutability trigger `admin_draft_review_decisions_immutable` blocks `UPDATE` and `DELETE` (`MM106`).
  - Strict RLS (`select` and `insert` only for active non-revoked `profiles.role = 'admin'`; `reviewer_id = auth.uid()`).
- **Rollback script:** [`supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql`](../../supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql) — cleanly drops only the new table, policies, indexes, trigger, and function without touching `admin_draft_review_approvals`.
- **Migration ledger checks:** Registered in [`scripts/migrations/registry.ts`](../../scripts/migrations/registry.ts).
- **RLS tests:** [`tests/rls/admin-review-decisions.test.ts`](../../tests/rls/admin-review-decisions.test.ts).

### Phase 3: Admin Portal `/admin/review` UI Enhancements (`docs/design.md` v2.2)
- [`src/app/admin/review/page.tsx`](../../src/app/admin/review/page.tsx) & [`src/app/admin/review/actions.ts`](../../src/app/admin/review/actions.ts):
  - Keeps `approveDraft()` and `getDraftForApproval()` backward-compatible and adds `recordReviewDecision()` with full server-side role, session, human-name, checklist, rationale, D1/D3 hash, and fingerprint verification.
- [`src/features/admin-review/DraftReview.tsx`](../../src/features/admin-review/DraftReview.tsx), [`WritingPromptPreview.tsx`](../../src/features/admin-review/components/WritingPromptPreview.tsx), [`DecisionPanel.tsx`](../../src/features/admin-review/components/DecisionPanel.tsx), [`BatchReadinessPanel.tsx`](../../src/features/admin-review/components/BatchReadinessPanel.tsx):
  - Built inside `AdminShell` using MindMosaic primitives (`Card`, `Badge`, `Button`, `Input`, `Textarea`, `ProgressBar`, `StatCard`, `ExamQuestion`, `VisualRenderer`), Instrument Sans headings, Geist body/UI, `#5925A8` (`royal`) accents, and responsive desktop/mobile layout.
  - Blind-first solving hides declared answer key, worked solution, arithmetic check, and reviewer answer until solved or explicitly revealed.
  - Full audit trail with stale-revision banners when content hashes change.

### Phase 4: Secure Governed Publication Bridge
- [`scripts/export-admin-review-approvals.mts`](../../scripts/export-admin-review-approvals.mts):
  - Read-only CLI that refuses production Supabase ref (`uermhsptduikehuyceiz`), re-verifies every approved decision's D1/D2/D3 hashes and `evidence_fingerprint` against Git drafts, enforces strict `--pool practice|mock` separation, and outputs publish-compatible CSVs for `scripts/questions-publish.mts` (MCQs/Reading) and `scripts/content-approvals.mts` (Written Expression prompts → `content/publication-approvals/writing-prompts/`).

---

## 4. Verification Evidence

All verification runs below were executed directly on isolated worktree branch `feat/admin-scholarship-review-workflow` (`C:/tmp/wt-admin-scholarship-review`). Unrun suites blocked by local Docker service state are reported transparently — nothing is fabricated or skipped as passed.

| Check | Command | Outcome | Verified Evidence |
|---|---|---|---|
| TypeScript strict check | `npm run typecheck` | **PASS** | `0` errors across `src/`, `scripts/`, `tests/rls/`, and `e2e/` |
| ESLint | `npm run lint` | **PASS** | `0` errors (`0` warnings in all added/modified files) |
| Full unit & component suite | `npm test` | **PASS** | **471 / 471 test files passed, 7,537 / 7,537 tests passed** (includes 16 legacy `admin-draft-review.test.ts`, 6 new `admin-scholarship-review-workflow.test.ts`, 2 legacy `admin-draft-review.test.tsx`, 3 new `admin-scholarship-review-ui.test.tsx`, 3 `admin-layout.test.tsx`, and `migration-registry.test.ts`) |
| Production build (Turbopack) | `npm run build` | **PASS** | Compiled in `13.8s`; `71 / 71` static pages generated; `/admin/review` dynamic route built |
| Production build (Webpack) + Playwright E2E | `PW_PORT=3123 npx playwright test e2e/admin-review-workflow.spec.ts` | **PASS** | Webpack build passed (`export-csv.ts` client/server boundary verified); **2 / 2 Chromium specs passed** (fail-closed across both banks + path-traversal query with visible fail-closed alert and zero draft leakage; 390px mobile layout with zero horizontal overflow) |
| Question bank validation | `npm run validate:questions` | **PASS** | `1,005` production questions (`167` with visuals, `4` manual-review), `0` errors |
| Independent answer checker | `npm run check:answers -- --include-published` | **PASS** | `1,601` total questions (`1,597` objective, `4` manual-review), **`0` failures** |
| Ledger consistency | `npm run questions:validate-ledger` | **PASS** | `98` ledger rows parsed, `20` files in scope, `PASS` |
| Publication evidence verification | `npm run content:verify-publication` | **PASS** | `1,601` authored, `130` eligible, `1,471` awaiting approval, **`0` problems**, `0` items newly published |
| Legacy 160 Scholarship draft validator | `npm run content:validate-scholarship-drafts` | **PASS** | `160 / 160` drafts valid; runtime isolation intact |
| Codex 500 Scholarship validator | `node --import tsx scripts/validate-vihaan-expansion.mts` | **PASS** | `500 / 500` items valid, `0` errors, `0` duplicate IDs |
| RLS suite (local Postgres) | `npm run test:rls` | **BLOCKED LOCALLY (Docker stopped)** | `com.docker.service` is stopped on this Windows host (no local Postgres on `127.0.0.1:56322`). [`tests/rls/admin-review-decisions.test.ts`](../../tests/rls/admin-review-decisions.test.ts) (with `SAVEPOINT` error isolation, role isolation, human-only CHECKs, immutability `MM106`, revision change, and rollback verification) passes strict `typecheck` and `eslint` and is ready to execute in CI or locally once Docker Desktop + `npx supabase start` are running. |
| Authenticated Playwright E2E (local Supabase) | `npm run test:e2e:auth` | **BLOCKED LOCALLY (Docker stopped)** | Requires local Supabase Auth (`127.0.0.1:56321`). [`e2e/auth/admin-draft-review.spec.ts`](../../e2e/auth/admin-draft-review.spec.ts) (preserving all 3 legacy tests and adding the 500-item Codex bank E2E test) passes strict `typecheck` and `eslint` and is ready for CI / local Supabase execution. |

---

## 5. Manual UAT & Migration Approval Checklist (Owner Action Required)

### Step 1: Approve & Apply DEV Migration (Requires Owner Sign-Off)
1. Review [`supabase/migrations/20261124090000_admin_review_decisions.sql`](../../supabase/migrations/20261124090000_admin_review_decisions.sql) and rollback [`supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql`](../../supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql).
2. Apply **only** to DEV Supabase (`mfglzabnayacssgertat`), never PROD (`uermhsptduikehuyceiz`).
3. Verify with `npm run migrations:status` against DEV.

### Step 2: Manual UAT on DEV `/admin/review`
1. **Access Control:** Confirm guest, student, parent, and teacher accounts are redirected away from `/admin/review` and `/admin/review?bank=vihaan-scholarship-500`.
2. **Legacy Preservation:** Open `/admin/review` (default `Y6 Core (160)`); confirm all 160 items load and any prior `admin_draft_review_approvals` rows remain visible.
3. **Provisional Canonical 500-Item Bank:** Switch to **Codex 500 (Provisional)** (`/admin/review?bank=vihaan-scholarship-500`); verify 500 items across 11 batches (`vihaan-pilot-01` + `vihaan-expansion-01..10`).
4. **Practice vs Mock Pool Separation:** Filter `Pool` → `Practice pool (400)`, `Mock exam reserve (100)`, `Mock Paper A (50)`, `Mock Paper B (50)` and verify mock badges and policy notices.
5. **Blind-First Solving:** Open an MCQ item; verify the declared answer key, worked solution, and arithmetic check are hidden until you submit a blind preview answer or click *Reveal answer key*.
6. **Human-Only Identity Guard:** Attempt to enter `"Claude Sonnet"` or `"Admin"` as reviewer full name; confirm the UI blocks submission and displays an error.
7. **Three Decision Types:**
   - Record an **Approve** decision with your real full name and all 5 checks ticked; reload and verify it persists in the Decision audit trail with D1/D2/D3 hashes and evidence fingerprint.
   - Record a **Request revision** decision (verify notes < 10 chars are refused, notes >= 10 chars persist).
   - Record a **Reject** decision with rationale; verify it persists and is excluded from approved exports.
8. **Written Expression Governed Flow:** Filter `Section` → `Written Expression` (40 items); confirm child-facing `WritingTask` preview, 6-criterion rubric, and `human_writing_prompt_approval` routing.
9. **Batch Progress & Export:** Open **Batch progress & export**; verify per-batch progress bars, separate Practice vs Mock CSV export buttons, and confirm **no item becomes published** in the student exam bank automatically.
