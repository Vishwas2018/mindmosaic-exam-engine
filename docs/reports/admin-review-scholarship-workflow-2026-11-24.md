# MindMosaic Admin Portal — Scholarship Content Review & Approval Audit and Implementation Report

**Date:** 25 November 2026  
**Branch / Draft PR:** `feat/admin-scholarship-review-workflow` → `dev` — Draft PR [#162](https://github.com/Vishwas2018/mindmosaic-exam-engine/pull/162) (verified green CI commit `c2f0d39f`)  
**Environment Scope:** Local & DEV (`mfglzabnayacssgertat`) only — PROD (`uermhsptduikehuyceiz`) untouched  
**Status:** **ALL GITHUB CI CHECKS GREEN + INDEPENDENT AUDIT 7/7 PASS (11/11 FINDINGS CLOSED)** — **Awaiting explicit owner approval to apply `20261124090000_admin_review_decisions.sql` to DEV Supabase (`mfglzabnayacssgertat`) before executing hosted DEV desktop/mobile UAT. 0 questions auto-approved, 0 questions auto-published, PR #142 not merged.**

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

## 4. Verification Evidence (Local + Complete GitHub CI Pipeline)

All checks below were executed on branch `feat/admin-scholarship-review-workflow` (Draft PR [#162](https://github.com/Vishwas2018/mindmosaic-exam-engine/pull/162), GitHub Actions Run [`45505491249`](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/45505491249), code commit `c2f0d39f`).

| Check / CI Job | Command / Workflow Job | Outcome | Verified Evidence |
|---|---|---|---|
| **GitHub CI — `core`** | Job `138839642780` (`7m40s`) | **PASS** | `safety-gate`, `typecheck`, `lint`, `build`, `validate:questions`, `content:validate-roadmap-drafts`, `content:verify-roadmap-amc-answers`, `visuals:validate-bar-models`, `check:answers -- --include-published`, `questions:gate`, `projection:verify`, `content:verify-publication`, `audit:bank`, and `test:ci` (**471 / 471 test files passed**) |
| **GitHub CI — `scholarship-drafts`** | Job `138839642739` (`16s`) | **PASS** | `content:validate-scholarship-drafts` (`160 / 160` drafts valid, runtime isolation intact) |
| **GitHub CI — `rls`** | Job `138839642265` (`1m59s`) | **PASS** | Fresh Supabase Postgres applied `20261124090000_admin_review_decisions.sql`; `migrations:record` & `migrations:status` verified **`12 / 12` object checks (`ok`)**; `tests/rls/admin-review-decisions.test.ts` (**`9 / 9` passed**), `tests/rls/admin-draft-review.test.ts` (**`8 / 8` passed**), full RLS suite (**`39 / 39` test files passed**); `projection:apply`, `projection:verify -- --live`, and `cutover:verify -- --fixture` passed |
| **GitHub CI — `e2e`** | Job `138839642838` (`11m31s`) | **PASS** | **`389 / 389` Playwright Chromium specs passed** (production webpack build verified; includes `e2e/admin-review-workflow.spec.ts` fail-closed zero-leakage & 390px mobile zero-overflow tests) |
| **GitHub CI — `e2e-auth`** | Job `138839642824` (`6m03s`) | **PASS** | **`95 / 95` authenticated Playwright Chromium specs passed** against local Supabase — all 3 legacy `/admin/review` specs (`5:5`, `27:5`, `105:5`) + new 500-item Codex Scholarship spec (`181:5`, `2.9s`: blind-first solve, 400/100/50 pool filters, Written Expression rubric, read-only server-locked reviewer identity, approval write, and Defect `A-06` block + `Request revision` on `vihaan-e500-m069`) |
| **Vercel Preview Deployment** | `Dqq8uzpuozE9E9aQG1F81SbFKfsP` | **PASS** | Preview build and deployment completed cleanly |
| **Local Codex 500 Validator** | `node --import tsx scripts/validate-vihaan-expansion.mts` | **PASS** | `500 / 500` items valid, `0` errors, `0` duplicate IDs |
| **Independent Security & Migration Audit** | Read-only adversarial review + re-verification on `d7010484` | **7 / 7 PASS** | All 11 audit findings (`P1-1..P3-3`) remediated and independently verified **CLOSED** with zero regressions |

---

## 5. Independent Security, Migration & Readiness Defect Register

Every defect discovered during independent adversarial review and GitHub CI runs was logged, fixed at root cause (components/SQL/CLI — never weakening tests), and independently re-verified **CLOSED**.

| ID | Severity | Component | Defect / Risk Identified | Root-Cause Fix & Verification | Status |
|---|---|---|---|---|---|
| **P1-1** | **P1 — High** | `20261124090000_admin_review_decisions.sql` | Direct PostgREST `INSERT` bound `reviewer_id` & `reviewer_email` but did not bind `reviewer_name` to `public.profiles.display_name`, permitting display-name impersonation via raw API calls. | Enforced normalized `p.display_name = reviewer_name` directly inside `admin_draft_review_decisions_insert` RLS `WITH CHECK` alongside `reviewer_id = auth.uid()` and `reviewer_email = public.authenticated_admin_email()`. Verified in `tests/rls/admin-review-decisions.test.ts` (`42501` on `Jane Doe`). | **CLOSED** |
| **P1-2** | **P1 — High** | `actions.ts`, `DecisionPanel.tsx` | Server Action did not fail closed on `profiles` query errors and allowed client-supplied `reviewerName` when `profiles.display_name` was `NULL`/single-word. | `recordReviewDecision` now fails closed on `profileResult.error` or invalid `profiles.display_name`, derives `effectiveReviewerName` exclusively server-side, and refuses client mismatches. `DecisionPanel` locks the identity field `readOnly` and blocks submission if profile name is invalid. Verified by unit + UI + E2E tests. | **CLOSED** |
| **P1-3** | **P1 — High** | `scripts/export-admin-review-approvals.mts` | PROD DB guard relied on a substring denylist (`uermhsptduikehuyceiz`), bypassable via percent-encoding, empty-authority `PGHOST`/`PGUSER` fallback, or `?host=`/`?hostaddr=` query overrides. | Replaced with strict **allowlist** (`localhost`/`127.0.0.1`/`::1`, `db.mfglzabnayacssgertat.supabase.co`, or `*.pooler.supabase.com` with `*.mfglzabnayacssgertat` user), raw + percent-decoded URL + `PG*` checks, and rejection of `?host=`/`?hostaddr=`. Verified in unit tests. | **CLOSED** |
| **P2-1** | **P2 — Medium** | `src/server/admin-review.ts` | Direct SQL insert into untouched legacy `admin_draft_review_approvals` for defective `vihaan-e500-m069` could hydrate as `"Human approved"` in UI (even though exports blocked it). | Quarantined any legacy or extended approval row matching `getKnownDefectiveRevision(id, hash)` (`matchesCurrentRevision = false`) during catalogue hydration. | **CLOSED** |
| **P2-2** | **P2 — Medium** | `actions.ts`, `DecisionPanel.tsx` | Legacy `approveDraft` remained callable after extended migration; legacy-only approvals hid the extended 5-check form; pre-migration UI enabled legacy approve on `vihaan-scholarship-500`. | `approveDraft` now refuses writes once `extendedDecisionsAvailable` is active; `DecisionPanel` allows upgrading legacy-only approvals via the extended form and disables pre-migration approval for `vihaan-scholarship-500`. | **CLOSED** |
| **P2-3** | **P2 — Medium** | `scripts/export-admin-review-approvals.mts` | Append-only stale historical approvals aborted exporting all other valid current-revision approvals in the same bank/batch. | Verified `evidence_fingerprint` first (tampered rows still hard-abort), then cleanly skipped stale historical rows (`skippedStale`) without blocking valid current-revision exports. Verified in unit tests. | **CLOSED** |
| **P2-4** | **P2 — Medium** | `scripts/export-admin-review-approvals.mts`, `src/server/admin-review.ts` | Export CLI `loadSourceTruthMap` initially skipped packet/manifest/batch hash checks, `status === "draft"`, and duplicate-ID checks. | Added full `release-identities.json` packet SHA-256 verification, `quality-coverage-report.json` + `manifestHash` verification, shared `hashVerifiedVihaanBatch` verification for `pilot-01` and all 10 `batch-01..10` files, `approvedBy === null`, `status === "draft"`, and duplicate-ID checks. Verified fail-closed in unit test. | **CLOSED** |
| **P2-5** | **P2 — Medium** | `20261124090000_admin_review_decisions.sql` | Immutability trigger blocked `UPDATE` and `DELETE` (`MM106`) but not privileged `TRUNCATE`. | Added statement-level `BEFORE TRUNCATE` trigger `admin_draft_review_decisions_no_truncate` (`MM106`), registered in `registry.ts`, verified in CI RLS test. | **CLOSED** |
| **P3-1** | **P3 — Low** | `20261124090000_admin_review_decisions.sql`, `pool-classification.ts` | Denylist gaps (`qwen`/`llama`/`mistral`/`deepseek`/`grok`/`agent`/`script`/`cron`), SQL/TS character-whitelist drift, and transient false-positive on surnames containing `bot` (`Abbott`/`Talbot`). | Aligned SQL CHECK and TS validator character whitelists, expanded model/tool terms, and replaced unanchored `bot` with explicit compound prefixes `(ai\|auto\|test\|chat\|code\|gpt\|llm\|review)bot` — blocking `ClaudeBot Reviewer` while accepting `Sarah Abbott` and `James Talbot`. | **CLOSED** |
| **P3-2** | **P3 — Low** | `scripts/export-admin-review-approvals.mts` | Missing deterministic tie-breaker on `ORDER BY decided_at DESC` and missing JS cross-checks on `checks` booleans and `item_kind`/`batch_id`/`pool`. | Added `ORDER BY decided_at DESC, id DESC`, JS-side verification of all 5 approval checks, and source-truth cross-checks for `item_kind`, `batch_id`, and `pool`. | **CLOSED** |
| **P3-3** | **P3 — Low** | `registry.ts`, `20261124090000_admin_review_decisions.down.sql` | PostgreSQL `has_table_privilege(..., 'select,insert')` uses OR-semantics; rollback raised `42P01` if run twice. | Split `select` and `insert` privilege checks + added index & email-helper checks in `registry.ts` (`12/12` verified in CI); updated rollback to drop table first so double execution is cleanly idempotent (verified in CI RLS test). | **CLOSED** |
| **CI-1** | **Defect (Webpack E2E)** | `BatchReadinessPanel.tsx`, `writing-adapter.ts` | Client component imported `buildGovernedExportCsv` from `writing-adapter.ts`, pulling `node:crypto`/`node:path` into webpack client bundle. | Split pure client-safe `src/features/admin-review/export-csv.ts`. Verified in full `e2e` CI job (`389/389` passed). | **CLOSED** |
| **CI-2** | **Defect (`e2e-auth`)** | `DraftReview.tsx`, `DecisionPanel.tsx` | Queue rail duplicated full stem text; wrapping `<label>` broke `getByLabel("Pool", { exact: true })`; identical D1/D2 hashes printed twice for `scholarship-y6-rc-025`. | Replaced queue-rail stem with subject/difficulty metadata, switched filter labels to explicit `htmlFor`/`id`, and deduplicated identical D1/D2 hash display. Verified in full `e2e-auth` CI job (`95/95` passed). | **CLOSED** |
| **CONTENT-A06** | **Known Content Defect (Pre-Existing)** | `content/vihaan-scholarship/expansion-500/batch-07.draft.json` (`vihaan-e500-m069`) | Squares between 60 and 90 are 64 (digit sum 10) and 81 (digit sum 9); neither sums to 13, yet key marks 64 (Audit 2026-11-17). | **Hard-blocked from approval** at defective hash `d23176dea41737d3b0ed8833b67f8edb2532fe046c609b7538d9227d0c28fb05` across UI, Server Actions, Export CLI, and Postgres CHECK constraint (`admin_draft_review_decisions_known_defect_blocked`). `Request revision` / `Reject` remain enabled; fixing the source question automatically unblocks fresh review on the new hash. | **PROTECTED (Awaiting Content Fix)** |

---

## 6. GO / NO-GO Readiness Assessment

### Verdict: **GO — Ready for Owner-Approved DEV Migration (`mfglzabnayacssgertat`)**

| Readiness Gate | Requirement | Status | Evidence |
|---|---|---|---|
| **1. Complete GitHub CI Pipeline** | `core`, `scholarship-drafts`, `rls`, `e2e`, `e2e-auth`, `Vercel` all green | **GO** | Run [`45505491249`](https://github.com/Vishwas2018/mindmosaic-exam-engine/actions/runs/45505491249) on `c2f0d39f`: **6/6 checks PASS** (`471` unit files, `39` RLS files, `389` guest E2E, `95` auth E2E) |
| **2. Migration Security & Backward Compatibility** | Forward & rollback SQL safe, idempotent, preserves `admin_draft_review_approvals` | **GO** | Independent audit **PASS**; CI `rls` verified `12/12` registry checks + double-rollback idempotency + legacy row preservation |
| **3. Server-Side Reviewer Identity & Anti-Impersonation** | Authenticated server identity; cannot be impersonated by changing display name | **GO** | Enforced across UI (`readOnly`), Server Action (fail-closed `profiles.display_name` + `auth.getUser()`), and Postgres RLS (`reviewer_id = auth.uid()`, `authenticated_admin_email()`, `p.display_name = reviewer_name`) |
| **4. Decision Lifecycle & Audit Immutability** | Approve, Revise, Reject, stale revisions, duplicate approvals, unauthorized access, immutability | **GO** | Proven in unit (`admin-scholarship-review-workflow.test.ts`), RLS (`9/9` including `UPDATE`/`DELETE`/`TRUNCATE` `MM106`), and `e2e-auth` (`95/95`) |
| **5. Zero Automated Human Approvals** | No script, seed, validator, or AI identity can create human approval records | **GO** | Independent audit **PASS**; SQL + TS + UI + CLI reject AI/bot/automated/single-word identities |
| **6. Strict Practice vs Mock Separation** | 400 Practice items strictly isolated from 100 designated Mock Reserve slots (50 Mock A / 50 Mock B) | **GO** | Enforced from Git source truth across `pool-classification.ts`, UI filters, `export-csv.ts`, and `export-admin-review-approvals.mts` |
| **7. Known Defective Item `vihaan-e500-m069`** | Cannot be approved without correction and re-review | **GO** | Blocked at all 4 layers (UI, Server Actions, Export CLI, Postgres CHECK) for defective hash `d23176...fb05`; automatically unblocks upon new revision hash |
| **8. Publication Gate Integrity** | Export cannot bypass `questions:publish`, `content:record-approvals`, or `content:verify-publication` | **GO** | Read-only DEV/local-allowlisted export CLI (`publicationStateChanged: false`); `content:verify-publication` confirms `0` problems and `0` newly published items |
| **9. Hosted DEV Testing (Desktop + Mobile)** | Post-migration hosted DEV verification of `/admin/review` | **PENDING MIGRATION APPROVAL** | Blocked on explicit owner approval to apply `20261124090000_admin_review_decisions.sql` to DEV Supabase (`mfglzabnayacssgertat`) |

- **DEV Migration (`20261124090000_admin_review_decisions.sql` on `mfglzabnayacssgertat`):** **GO** (awaiting explicit owner approval).
- **Production (`main` / `uermhsptduikehuyceiz`) & Content Publication:** **NO-GO (Out of Scope)** — strictly deferred until hosted DEV UAT completes, real human review finishes, and the repository owner merges `dev` → `main`.

---

## 7. Next Step — Owner Migration Approval & Post-Migration Hosted DEV UAT Plan

### Step 1: Approve & Apply DEV Migration (Requires Explicit Owner Sign-Off)
1. Review [`supabase/migrations/20261124090000_admin_review_decisions.sql`](../../supabase/migrations/20261124090000_admin_review_decisions.sql) and idempotent rollback [`supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql`](../../supabase/migrations/rollbacks/20261124090000_admin_review_decisions.down.sql).
2. Confirm explicit approval to apply **only** to DEV Supabase (`mfglzabnayacssgertat`), never PROD (`uermhsptduikehuyceiz`).
3. Verify `npm run migrations:record` and `npm run migrations:status` (`12/12` checks `ok`) on DEV.

### Step 2: Hosted DEV Verification & Manual UAT on `/admin/review` (Desktop + Mobile)
1. **Access Control:** Confirm guest, student, parent, and teacher accounts are redirected away from `/admin/review` and `/admin/review?bank=vihaan-scholarship-500`.
2. **Legacy Preservation:** Open `/admin/review` (default `Y6 Core (160)`); confirm all 160 items load and any prior `admin_draft_review_approvals` rows remain visible.
3. **Provisional Canonical 500-Item Bank:** Switch to **Codex 500 (Provisional)** (`/admin/review?bank=vihaan-scholarship-500`); verify 500 items across 11 batches (`vihaan-pilot-01` + `vihaan-expansion-01..10`).
4. **Practice vs Mock Pool Separation:** Filter `Pool` → `Practice pool (400)`, `Mock exam reserve (100)`, `Mock Paper A (50)`, `Mock Paper B (50)` and verify mock badges and policy notices.
5. **Blind-First Solving:** Open an MCQ item; verify the declared answer key, worked solution, and arithmetic check are hidden until you submit a blind preview answer or click *Reveal answer key*.
6. **Server-Locked Human Identity:** Confirm the reviewer identity input is `readOnly`, displays your verified `profiles.display_name`, and binds server-side to your authenticated admin account & email (non-human or single-word profile names are blocked).
7. **Defect `A-06` Guard (`vihaan-e500-m069`):** Open `vihaan-e500-m069`; confirm the **Approval blocked — Known Defect A-06** alert is visible and `Approve` is disabled while `Request revision` / `Reject` remain available.
8. **Written Expression Governed Flow:** Filter `Section` → `Written Expression` (40 items); confirm child-facing `WritingTask` preview, 6-criterion rubric, and `human_writing_prompt_approval` routing.
9. **Responsive Desktop & Mobile Check:** Verify `/admin/review` at desktop (`1440px`) and mobile (`390px`) viewports with zero horizontal overflow, legible cards, and working controls.
10. **Batch Progress & Export:** Open **Batch progress & export**; verify per-batch progress bars, separate Practice vs Mock CSV export buttons, and confirm **no item becomes published** automatically.
