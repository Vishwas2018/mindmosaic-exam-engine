# Test results

Final verification of the code at commit **`60f90afa06bd12d37e1cca76ab40fecb6d9348f5`** (working tree clean), run on 19 Oct 2026 in the dedicated worktree `C:\tmp\wt-scholarship-prod` with CI's placeholder Stripe values. The database-backed checks ran against an **isolated** local Supabase created fresh for the run (own project id `mindmosaic-scholarship-prod-isolated`, ports 58320 to 58329) and pinned with `RLS_EXPECTED_DB_PORT=58322`; no other local stack was used. The browser suites used ports 3144 and 3146 because 3100 and 3145 were taken by other processes. Production was never contacted.

The commit that carries this file is documentation and evidence only (`git diff 60f90afa..HEAD` touches nothing outside `docs/reviews/scholarship-2026-10-18/`). The raw summary is `evidence/final-checks-60f90afa.txt`.

## Required checks (every one passed on its first attempt)

| Check | Result at 60f90afa |
|---|---|
| `npm run typecheck`, `npm run lint` | pass |
| `npm test` (as CI runs it, `test:ci`) | **Complete run: 356 files, 6321 tests, all concluded, none failed** |
| `npm run build` | pass |
| `npm run validate:questions`, `check:answers -- --include-published`, `questions:validate-ledger` | pass |
| `npm run content:verify-publication` | authored 1548, eligible 0, **problems 0** (nothing is approved anywhere on `dev`) |
| `npm run audit:bank` | integrity problems 0 |
| `npm run programmes:readiness` | runs; the four scholarship papers unavailable, written expression deferred |
| `npm run test:rls` (as `test:rls:ci`) | **Complete run: 36 files, 579 tests (577 pass, 2 expected-fail by design), all concluded, none failed** |
| `npm run test:e2e` | **243 passed** |
| `npm run test:e2e:auth` | **53 passed** |

Also run and passing: `content:validate-scholarship-drafts`, `questions:gate`, `projection:verify`, `content:validate-roadmap-drafts`, `content:verify-roadmap-amc-answers`, `visuals:validate-bar-models`; `migrations:record` and `migrations:status` (50 of 50 applied, verified, no drift); `programmes:check-gates` (database and TypeScript gate modes agree for all 7 scholarship programmes); `projection:apply` and `projection:verify -- --live` twice (clean, idempotent); `cutover:verify -- --fixture` (reconciliation clean).

## What happened on the way (kept, not hidden)

- **First verification attempt at `cd2f2e41` failed, correctly:** my new guard unit test, placed under `src/`, tripped the existing `scoring-module-boundary` test (the dedicated credential variable names must appear nowhere else under `src/`). I moved the test under `tests/rls/` and restarted.
- **Second attempt (`5b516549`) failed the RLS suite five times, correctly:** the guard test mocked `pg`, and the RLS project runs every file in one process with a shared module registry (`isolate: false`), so the mock either failed to apply or leaked into later files (one attempt: 486 failures). Fixed by removing the mock (`60f90afa`); the guard's refusal is now asserted through the error type it throws before any connection.
- A run of the suite against a database that had already had `projection:apply` run on it fails 12 tests in `assessment-session-create`; those suites assume no projected content, which is why CI runs `rls` before `projection:apply`. The final run used a freshly created database in CI's order.
- **Two e2e flakes earlier in the session** (a results-page colour-contrast scan measured mid-animation, and the Chapter 2 progress navigator timing out under load) passed on re-run; neither failed in the final run.

## The two RLS failure modes

See `RLS-FLAKINESS.md` for the full diagnosis and `CROSS-STACK-ACCESS.md` for the access to another local database that the first one caused.

1. **Eleven `No assessment session` failures: fixed.** A test file deleted `SCORING_DB_URL` for everyone after it. Variables are now scoped to the file and restored even when a test fails, a per-file safety net restores them regardless, and a database-target guard refuses to run unless every database variable names one local database.
2. **Silent worker exit: reproduced, characterised, not fixed.** On this Windows host and Node v24.15.0 the vitest worker occasionally exits with `0xC0000409` (a native abort), with no JavaScript-level trace, at a rate that rises with database traffic (`evidence/worker-crash-rates.txt`). It also occurs on plain `origin/dev`. The test-run guard now keeps the real exit code, signal and full log, and fails on crash text even when vitest exits 0. During the investigation one real crash under the new guard produced a refusal with a full run record (`evidence/worker-crash-run-record.json`). It did not occur in the final run; it could occur in the next one, and the right response is a rerun, not a retry loop.

## New coverage for this release

| Requirement | Where |
|---|---|
| Approval failures: missing, duplicate, stale, mismatched, non-human approver, bad id, bad key, orphan approval | `src/tests/unit/question-factory/scholarship-strict-assembly.test.ts` (13) |
| Production draft exclusion; enforcement by default; legacy programmes in report mode | `src/tests/unit/scholarship-release-candidate.test.ts` |
| Section selection; one item short means unavailable, even when a module is requested | same |
| Shared-passage consistency; four whole passages; a passage short by one question is unavailable | same |
| Correct, incorrect and unanswered scoring | same |
| Guest bank never carries scholarship; students only; custom and mixed draws refused; answer-stripped payload; Confidence Mode request ships no explanation | `scholarship-guest-bank.test.ts`, `scholarship-session-route.test.ts` |
| Start screen: sign-in required for guests, no module, no Confidence Mode, honest disclosure | `src/tests/components/scholarship-pattern-starter.test.tsx` |
| Catalogue and landing availability agree with eligible content | `scholarship-availability.test.ts`, `scholarship-coverage.test.ts` |
| Review package matches the drafts; sheets are publish-compatible; packet has no answers | `scholarship-release-package.test.ts` |
| External-review response checks; requeue helper | `scholarship-external-review.test.ts` |
| Entitlements and tenant isolation; mode column; duplicate submission; immutable history; migration re-run safety | `tests/rls/scholarship-sessions.test.ts` (13) |
| Environment restored even when a test fails; refusal to run against a split, remote or mis-pinned database before any connection | `tests/rls/db-target-guard.test.ts` |
| Crashed, signalled or silent runs can never report success; native exit codes decoded | `src/tests/unit/test-run-guard.test.ts` |
| Difficulty decision sheet complete, blank, and consistent with the estimator file | `src/tests/unit/scholarship-release-package.test.ts` |
| Keyboard and phone-width journeys; coming-soon papers cannot be started | `e2e/scholarship-availability.spec.ts` |
| Existing AMC, NAPLAN and ICAS behaviour | the unchanged existing suites above (unit, RLS, both e2e suites) |

**Not covered, and why.** *Refresh, resume and retry of a real scholarship sitting* run through the generic session routes (`/api/exam/session/active`, `.../responses`, `.../submit`), which this release does not change; their existing tests pass, and the RLS file proves the duplicate-submission and immutability properties for a scholarship session. There is deliberately no approved scholarship content, so no end-to-end sitting of a real paper can be run; `e2e/scholarship-simulation.spec.ts` (mocked routes) is the sitting-level coverage. **Historical results**: attempts are never modified (RLS test); a session scores against the bank the server holds at submit time, so a revised question keeps its id and is scored on its new content: avoid content deploys while students are mid-paper (see `RELEASE-PLAN.md`).

## Exact rerun instructions

```
# once, in this worktree
npm ci
export STRIPE_SECRET_KEY=sk_test_dummy_placeholder_not_a_real_key_00000000 STRIPE_WEBHOOK_SECRET=whsec_dummy_placeholder_not_a_real_secret_0000 NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy_placeholder_not_a_real_key_0000 STRIPE_PRICE_FAMILY_MONTHLY=price_dummy_placeholder_monthly_00000000 STRIPE_PRICE_FAMILY_ANNUAL=price_dummy_placeholder_annual_000000000
npm run typecheck && npm run lint && npm run test:ci && npm run build
npm run validate:questions && npm run check:answers -- --include-published && npm run questions:validate-ledger
npm run content:verify-publication && npm run audit:bank && npm run programmes:readiness && npm run content:validate-scholarship-drafts

# database checks need a local Supabase that is NOT shared with anything else
# (copy supabase/ to a temp dir, change project_id and every port, then `supabase start --workdir <dir>`), then:
export SUPABASE_DB_URL=postgresql://postgres:postgres@127.0.0.1:<db-port>/postgres RLS_TEST_DB_URL=$SUPABASE_DB_URL DATABASE_URL=$SUPABASE_DB_URL
export RLS_EXPECTED_DB_PORT=<db-port>
export SCORING_DB_URL=postgresql://mindmosaic_scoring:local-dev-scoring-not-a-secret@127.0.0.1:<db-port>/postgres
export CONTENT_ANSWER_WRITER_DB_URL=postgresql://mindmosaic_content_answer_writer:local-dev-content-answer-writer-not-a-secret@127.0.0.1:<db-port>/postgres
npm run scoring:bootstrap && npm run content:answer-writer:bootstrap
npm run migrations:record && npm run migrations:status && npm run programmes:check-gates && npm run test:rls:ci

# browsers: choose free ports (3100 and 3145 are the defaults and may be taken; Playwright silently REUSES whatever is listening)
PW_PORT=<free> npm run test:e2e
# .env.e2e.local from .env.e2e.local.example with the Supabase URL changed to the isolated API port, then:
npm run e2e:seed && PW_AUTH_PORT=<free> npm run test:e2e:auth
```

Database variables: the RLS suite now refuses to start unless `RLS_TEST_DB_URL`, `SUPABASE_DB_URL`, `DATABASE_URL`, `SCORING_DB_URL` and `CONTENT_ANSWER_WRITER_DB_URL` (whichever are set) are all local and all name the same host and port, and the two role URLs default to the primary's host and port. On a machine that shares Docker with other Supabase stacks also export `RLS_EXPECTED_DB_PORT=<your db port>` so a missing `RLS_TEST_DB_URL` cannot silently select the default 56322. Several scripts outside the suite (`scoring:bootstrap`, `content:answer-writer:bootstrap`, `programmes:check-gates`, the projection scripts) still default to 56322 when `SUPABASE_DB_URL` is unset: always export it. To keep the log, exit code and a run record of a test run, set `TEST_RUN_RECORD_DIR=<dir>`.
