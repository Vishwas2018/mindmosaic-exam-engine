# Security Audit — findings

**Scope:** `origin/main` @ `ff7152f` (feat(content-platform): v2 authoring control plane)
**Date:** 2026-09-02
**Method:** read-only. No code changed. Local Supabase (Docker) stack for RLS re-runs; static tracing for the rest. Threat model: a logged-in **student** trying to reach data or routes they should not.
**Branch:** `audit/security-2026-09-02` (findings only, no fixes)

Severity scale: **CRITICAL** (answer-key leak or cross-student data access, per audit brief) / **HIGH** / **MEDIUM** / **LOW** / **INFO**.

---

## Summary

| # | Dimension | Severity | Title |
|---|---|---|---|
| 1 | billing | **HIGH** | Subscription gate is fully disabled by default and, even enabled, is layout-only — no API route or RLS policy enforces entitlement |
| 2 | rls | MEDIUM | RLS suite (`npm run test:rls`) crashes mid-run non-deterministically in its single-process runner, silently dropping suites unless the `:ci` guard is used |
| 3 | rls | LOW | `content-answer-writer-role.test.ts` fails on a fresh clean-seed setup because its bootstrap step is undocumented in `RLS_TEST_PLAN.md` |
| 4 | rls | INFO | All 5 "suspected harness-stale" RLS files are confirmed harness-stale, not regressions |
| 5 | security | INFO | `origin/fix/close-exam-write-trust-boundary` — fix already merged into main, vulnerability closed, branch fully subsumed |
| 6 | auth | INFO | Per-role route authorization: no holes found |
| 7 | security | INFO | Answer-key / rubric leak paths: no holes found |

No answer-key leak and no cross-student data access was found — nothing in this audit meets the CRITICAL bar as defined in the brief. The one HIGH finding is a real, presently-exploitable gap, rated HIGH rather than CRITICAL because it grants unpaid access to content, not another student's private data or an answer key.

---

## 1. [billing] HIGH — Subscription gate disabled by default; layout-only even when enabled

**Location:** `src/features/billing/require-active-subscription.ts:37`, `src/features/billing/config.ts:9-11`, `.env.local.example:47`

**Finding.** `requireActiveSubscription()` starts with:

```ts
if (!isBillingEnforcementEnabled()) return;
```

`isBillingEnforcementEnabled()` is `process.env.BILLING_ENFORCEMENT_ENABLED === "true"`. The variable is unset in `.env.local.example` and unset in `playwright.auth.config.ts:58`. The code comment at `config.ts:1-7` confirms this is an intentional, currently-off kill switch ("Ships defaulted off ... merging this batch changes nothing until a later batch flips it on in the deployment env"). This is documented and known (`docs/reports/overnight-audit-2026-07-31/package-d-billing-entitlement.md:129`: *"Entitlement actually enforced today: NO — by design, currently off"*) — but that report is over a month old relative to this audit, and nothing in the current tree indicates the flag has since been flipped in any deployment config checked into the repo. **As shipped on `main` today, no subscription enforcement runs anywhere.**

Independent of the flag, the architecture has a second problem: `requireActiveSubscription()` is called from exactly two places — `src/app/parent/layout.tsx:24` and `src/app/student/layout.tsx:24`. Both are Next.js **layouts**, which only execute for page navigation through those route trees. They do not run for a direct API call or server action. Grepping every route under `src/app/api/**` for `has_active_access`, `current_parent_has_access`, `requireActiveSubscription`, or `BILLING_ENFORCEMENT` returns **zero matches**.

**Concrete attack.** `POST /api/exam/session` (`src/app/api/exam/session/route.ts`) checks auth (`supabase.auth.getUser()`) and role (`profile.role === "student"`), but never checks subscription status, and returns real, server-selected exam/practice questions (`NextResponse.json({ sessionId, questions: ... })`, line ~232). A student whose linked parent's trial has expired, or was never subscribed, can call this endpoint directly — bypassing the (currently disabled, and architecturally incomplete) UI paywall entirely — and receive genuine paid content.

**Third layer that could have caught this but doesn't:** no RLS policy on any content table (`assessment_sessions`, `exam_sessions`, `items`, `stimuli`, `session_responses`, etc.) references `has_active_access` or `current_parent_has_access` in a `USING`/`WITH CHECK` clause — confirmed by inspecting every `create policy` touching those tables in `supabase/migrations/`. Those functions are referenced only by the migration that defines them (`20260720100000_subscriptions.sql:96-122`), `tests/rls/subscriptions.test.ts`, docs, and `require-active-subscription.ts` itself. If application code is bypassed or a new route is added without remembering the layout-only gate, the database imposes no billing restriction as a backstop.

**Not a hole (confirmed intentionally out of scope):** `src/app/api/exam/guest-bank/route.ts` is deliberately open and answer-bearing for anonymous guest practice — `docs/PRIVACY_AND_BILLING_GUARDRAILS.md` and an inline comment both state guest practice must always stay free and unscored client-side. `src/lib/billing/subscription.ts:35`'s `hasAccess` is explicitly commented as a display-only derived flag, correctly never wired into a gate.

**Why HIGH not CRITICAL:** the bypass grants access to paid practice/lesson content without payment. It does not expose another student's private data, and it does not expose an answer key (`item_answer_versions` stays server-side regardless — see Finding 7). Business/product impact only.

---

## 2. [rls] MEDIUM — RLS test runner crashes mid-run non-deterministically; silent-drop risk if the `:ci` guard isn't used

**Location:** `vitest.rls.config.ts` (`isolate: false`, `fileParallelism: false`), `scripts/verify-test-run.mts`

**Finding.** `npm run test:rls` (plain vitest) and `npm run test:rls:ci` (the completeness-guarded wrapper) were both run against a freshly-reset local Supabase instance (`supabase db reset` + `scoring:bootstrap`). In two separate full-suite attempts, the single long-lived vitest worker process died partway through with `Error: Worker exited unexpectedly` — first after `resolution-rule.test.ts` (3 of 32 files run), then after starting `assessment-session-model.test.ts` (4 of 32 files run). Both times the crash point differed and was not tied to any specific file's content — re-running the "crashed" files individually or in batches of ≤8 passed cleanly every time (all 32 files, 32/32 pass — see Finding 4 for detail).

This matches the exact failure mode `vitest.rls.config.ts`'s own comments describe as previously mitigated by setting `isolate: false` ("a single long-lived process ... so there are no spawn/exit cycles left to lose") — but the crash still reproduced twice in this session on this host. `scripts/verify-test-run.mts` exists specifically to make this loud (`npm run test:rls:ci` correctly exits 1 and prints `INCOMPLETE TEST RUN` with the list of files that never ran), and did so correctly both times here. **The guard works as designed** — this finding is that the underlying crash it guards against is still live, and that `npm run test:rls` (the form named directly in `docs/RLS_TEST_PLAN.md`'s "How to run" section and the one this audit brief specified) does not self-report incompleteness — a plain look at its tail (`Test Files 1 failed | 1 passed (3)`) reads as "ran fine, found 3 bugs" unless the reader also scans for the separate "Unhandled Errors" block and does the arithmetic on the parenthesized total.

**Risk:** any CI pipeline or developer that runs `npm run test:rls` instead of `npm run test:rls:ci` gets a truncated, misleadingly-labeled result. If that pipeline doesn't hard-fail on a non-zero-but-not-`test:rls:ci` exit path, a real RLS regression introduced in a file that never got to run would ship silently. Recommend: make `test:rls` itself the guarded entrypoint (or update `RLS_TEST_PLAN.md` and any CI config to call `test:rls:ci` exclusively) and, if time allows, root-cause the worker crash (likely a leaked Postgres connection/listener accumulating across ~50-100 tests in the one shared process, given the crash point moves each run).

---

## 3. [rls] LOW — `content-answer-writer-role.test.ts` fails on a truly clean seed; bootstrap step undocumented

**Location:** `tests/rls/db.ts:86`, `docs/RLS_TEST_PLAN.md` ("How to run" section), `package.json` script `content:answer-writer:bootstrap`

**Finding.** After `supabase db reset` + `npm run scoring:bootstrap` (the sequence `npm run db:reset` runs, and the sequence `RLS_TEST_PLAN.md` documents), `tests/rls/content-answer-writer-role.test.ts` fails immediately with `password authentication failed for user "mindmosaic_content_answer_writer"`, directing the operator to run `npm run content:answer-writer:bootstrap`. That script exists and works — running it fixes the failure (23/23 pass afterward) — but neither `RLS_TEST_PLAN.md`'s "How to run" section nor `npm run db:reset` (`package.json:60`: `supabase db reset && npm run scoring:bootstrap`) invoke it. A developer or CI job following the documented steps literally will hit this every time from a clean seed.

This is not a security regression — the role genuinely doesn't exist yet until bootstrapped, so the test fails loud and specific rather than passing incorrectly — but it is exactly the kind of "known failing file" pattern that erodes trust in a red suite and makes a real regression easier to wave away. Recommend adding `content:answer-writer:bootstrap` to `db:reset` alongside `scoring:bootstrap`, and updating the doc's "How to run" section.

---

## 4. [rls] INFO — All 5 suspected-stale RLS files confirmed harness-stale, not regressions

**Files:** `assessment-session-create.test.ts`, `curriculum-adapter-and-import.test.ts`, `programme-offering-authority.test.ts`, `resolution-rule.test.ts`, `target-selector-offering.test.ts`

**Method.** Ran `supabase db reset` (recreates the DB from scratch, reapplies all 44 migrations) followed by `scoring:bootstrap` and `content:answer-writer:bootstrap`, then ran the full 32-file suite in batches of 4-8 files via `npx vitest run --config vitest.rls.config.ts <files>` (batching was necessary to route around Finding 2's crash, not to hide anything — see raw output referenced below).

**Result: 32/32 files pass, 0 failures**, including all 5 suspected files. `resolution-rule.test.ts` specifically had failed on the very first run (before the explicit `db reset`) with off-by-one row-count assertions (`total_attempts`/`total_sessions` expected 4, got 5) — consistent with leftover rows from a prior/dirty database state (this project's Docker volume persists between `supabase start` calls unless explicitly reset) rather than any bug in the resolution-rule logic itself. On the guaranteed-clean seed it passed all 20 of its own tests cleanly, including the specific counting-logic assertions that had failed before.

**Verdict for all 5: harness hygiene (stale/dirty local DB state), not a real regression.** No policy or grant on `main` is wrong.

---

## 5. [security] INFO — `origin/fix/close-exam-write-trust-boundary`: fix already merged, vulnerability closed on main

**Finding.** `git merge-base origin/fix/close-exam-write-trust-boundary origin/main` returns the branch's own tip commit — i.e., every commit on that branch is already an ancestor of `main`. The branch is fully subsumed; there is nothing on it that isn't already shipped.

The substantive fix is commit `83bd468` ("fix(security): make the server the only writer of sessions and attempts", tagged `MM-AUD-SEC-001`), which **is** on `main` @ `ff7152f`. It addresses: `exam_sessions.selected_question_ids` and `exam_attempts.result` being writable by the caller's own JWT, meaning a student could in principle choose their own paper or forge their own score. The fix moves both writes into two `SECURITY DEFINER` Postgres functions (`supabase/migrations/20260811090000_exam_write_rpcs.sql`) that re-derive role/ownership/expiry from `auth.uid()` server-side, and revokes the direct-insert grants (`20260811091000_exam_writes_revoke_direct_insert.sql`). Also revoked `TRUNCATE` on `exam_responses`/`exam_sessions`/`exam_attempts` from `authenticated` (RLS does not cover `TRUNCATE`) in `20260811093000_exam_tables_revoke_residual_writes.sql`. All these migrations are present in `supabase/migrations/` on `main`, and the corresponding RLS coverage (`exam-attempts.test.ts`, `assessment-session-create.test.ts`, `exam-responses.test.ts`, `session-storage-model.test.ts`) passed cleanly in this audit's triage (Finding 4).

**Recommendation: do not promote (nothing to promote — it's already in). The branch is stale and safe to delete** once whoever owns it confirms there's no other in-flight work on it; this audit did not delete it (read-only).

---

## 6. [auth] INFO — Per-role route authorization: no holes found

Covered by a dedicated background pass tracing: the proxy/middleware (`src/proxy.ts` → `src/lib/supabase/middleware.ts`, confirmed to only refresh cookies, never gate — role gating is correctly left to each role tree's `layout.tsx`); `requireRole()` (`src/features/auth/require-role.ts:44-71`, called from `admin/teacher/parent/student` layouts, each with `export const dynamic = "force-dynamic"` to prevent the check being prerendered away); student-owned-resource IDOR checks on exam session read/autosave/submit routes (`session_id`/`student_id` re-derived from `auth.uid()` server-side, identical 404 for "not found" vs. "not yours" — no enumeration oracle); cross-role API calls (`teacher/marking`, `teacher/assignments`, `parent/children/[childId]`) each independently re-check role/linkage before touching data; every service-role (`SUPABASE_SERVICE_ROLE_KEY`) usage found has its own authorization check preceding it, not just RLS; and CSRF/same-origin (`checkOrigin`) is applied to state-changing POSTs.

One item flagged for a later look, not a hole today: `src/features/content-platform/operator-service.ts`'s service-role usage has zero callers under `src/app` (CLI/authoring-only) — confirm it stays that way if/when the v2 content-platform pipeline gets wired to a live route.

---

## 7. [security] INFO — Answer-key / rubric leak paths: no holes found

Covered by a dedicated background pass. `item_answer_versions` (answer_key, grading_rules, rubric, private_explanation) is reachable only via `src/server/scoring/answer-access.ts` (sole sanctioned reader, dedicated least-privilege `mindmosaic_scoring` role, no `BYPASSRLS`) and `src/server/scoring/answer-version-writer.ts` (sole sanctioned writer, dedicated `mindmosaic_content_answer_writer` role, INSERT-only). Confirmed by:

- Tree-wide grep: every other mention of `item_answer_versions` in `src/` is a comment/doc reference, none is a query. A dedicated guard test, `src/tests/unit/scoring-module-boundary.test.ts`, enforces this automatically (regexes for `select/join`/`insert/update` against the string, plus a blanket "mentions it at all" check over every source file outside the two sanctioned modules) — this is a real, currently-passing regression gate, not just current-state cleanliness.
- DB-level backstop independent of application code: `item_versions` and `item_answer_versions` have RLS enabled with **zero policies** and an explicit `revoke all ... from anon, authenticated` plus a redundant column-level revoke on the four sensitive columns (`supabase/migrations/20260812090000_runtime_content_projection.sql:310-326`). A stray client-side query against these tables fails even if application logic were bypassed.
- The live question-serving path (`POST /api/exam/session`, target-model `get_assessment_session` RPC, legacy `toCandidateQuestionFromItem`) returns only `CandidateQuestion` (`Omit<Question, "answerKey"|"explanation">`), and the RPC itself builds its JSON response with an explicit column allowlist rather than spreading a row (comment at `20260816090000_assessment_session_ui_state.sql:420`: "THE COLUMNS ARE LISTED, NEVER SPREAD").
- Offline content projection (`project-question.ts`) validates the candidate-facing half against a `.strict()` schema plus a secondary recursive "find any answer-shaped field nested in visuals/candidateContent" walk.
- Teacher marking UI hardcodes `rubric: null` for target-model sittings rather than attempting to read the table (`src/app/teacher/marking/[sessionId]/[questionId]/page.tsx`), and is itself gated by the `/teacher` layout's `requireRole`.
- Draft/unpublished content: the legacy student path only ever reads git-committed, build-time bank modules (inherently pre-reviewed); the target model treats `published` status as structural, not a runtime filter; the new v2 content-platform tables (`authoring_questions` etc., shipped this same commit `ff7152f`) have `revoke all ... from anon, authenticated` and are not yet wired to any student-facing route or component at all — no live draft-leak path exists today.

**One intentional, documented exception, not a hole:** `src/app/api/exam/guest-bank/route.ts` serves the full guest question bank including answer keys, by design — guest/anonymous practice is explicitly specified to run fully client-side with client-side scoring (`docs/ASSESSMENT_SECURITY_MODEL.md`), and signed-in clients never call this endpoint.

---

## What was not covered

- Stripe `checkout`/`portal`/`cancel`/`resume`/`payment-method`/`invoices` routes were spot-checked only (`status/route.ts`, which correctly gates on `requireParentSubscriptionRow`) — not exhaustively traced for the same class of layout-vs-route gap as Finding 1.
- The v2 content-platform pipeline (`src/features/content-platform/`) is new in this commit and not yet wired to serve students; its RLS/route surface should get a fresh pass once it is.
- Root cause of the RLS worker crash (Finding 2) was not investigated beyond reproducing and characterizing it — flagged for follow-up, not fixed.
