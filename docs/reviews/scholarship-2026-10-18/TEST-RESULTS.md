# Test results (18 Oct 2026)

Everything below was run in the dedicated worktree `C:\tmp\wt-scholarship-prod` on branch `release/scholarship-prod`, with CI's placeholder Stripe values. The database-backed checks ran against an **isolated** local Supabase (own project id `mindmosaic-scholarship-prod-isolated`, ports 58320 to 58329); the other local stacks on this machine were not used or modified, and the browser suites used ports 3144 and 3146 because 3100 and 3145 were already taken by other processes. Production was never contacted.

## Required checks

| Check | Result |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` (run as CI does, `npm run test:ci`) | **356 files, 6312 tests, all pass** |
| `npm run build` | pass |
| `npm run validate:questions` | pass |
| `npm run check:answers -- --include-published` | pass |
| `npm run questions:validate-ledger` | pass |
| `npm run content:verify-publication` | authored 1548, eligible 0, awaiting approval 1548, **problems 0** (nothing is approved anywhere on `dev`, so this is unchanged for every programme) |
| `npm run audit:bank` | integrity problems 0 |
| `npm run programmes:readiness` | runs; all four scholarship papers report unavailable, the written-expression paper deferred |
| `npm run test:rls` (as `test:rls:ci`) | **35 files, 566 tests, all pass on the last of four runs. See the flakiness note.** |
| `npm run test:e2e` | **243 passed** (guest suite, production build, own port) |
| `npm run test:e2e:auth` | **53 passed** (against the isolated Supabase, own port) |

Also run, because CI's `core` and `rls` jobs run them: `content:validate-scholarship-drafts`, `questions:gate`, `projection:verify`, `content:validate-roadmap-drafts`, `content:verify-roadmap-amc-answers`, `visuals:validate-bar-models` (all pass); `migrations:record` and `migrations:status` (50 of 50 applied, verified against live objects, no drift); `programmes:check-gates` (database and TypeScript gate modes agree for all 7 scholarship programmes); `projection:apply` and `projection:verify -- --live` twice (clean and idempotent); `cutover:verify -- --fixture` (reconciliation clean).

## Flakiness, stated plainly

**The RLS suite is not stable on this machine, and that is not caused by this branch.** Eleven tests in three target-model files (`pending-manual-marks-consistency`, `target-http-lifecycle`, `target-sitting-end-to-end`) fail in a full run and pass when those files run alone (29 of 29). To check whether this branch was responsible I ran the unmodified `origin/dev` (`3b85a102`) three times in a fresh, separate install against the same database: it failed with the identical 11 tests twice and passed once. On this branch: failures with the same 11 tests on runs 1 and 3, a worker crash ("Worker exited unexpectedly") on run 2 and a clean 566 of 566 on run 4. Other runs at earlier commits showed the same mix, including worker crashes, while free memory on the machine was under 4 GB. **Root cause found (19 Oct).** `tests/rls/assessment-scoring.test.ts` ends with an unconditional `delete process.env.SCORING_DB_URL`, and the suite runs as one long-lived process (`isolate: false`). Any later file that reads `scoringDbUrl()` then falls back to the built-in default port 56322. Where that is the database under test (CI, the documented setup) nothing goes wrong; when `SCORING_DB_URL` points elsewhere, as on this machine, the scoring module queries the wrong database and reports `No assessment session`. Whether it bites depends on file order, and vitest orders by its result cache, which is why it looked random. Reproduction: a pinned-order config running `assessment-scoring` first fails exactly these 11 tests every time (twice), the reverse order passes (twice), and restoring the variable instead of deleting it makes the forward order pass (twice) and 2 of 3 full runs pass 566 of 566. A second, separate failure remains: an occasional silent exit of the vitest worker fork (about 1 run in 3 here), already documented in `vitest.rls.config.ts`; the guard script makes it loud. See `rls-flake-diagnosis.md` in the handoff folder. The patch is not applied in this branch.

**Two guest e2e tests failed once in the first full run and passed in isolation and in the second full run:** the accessibility scan of the results page (colour contrast measured mid-transition) and the pre-existing scholarship Confidence Mode simulation. The other failure in that run was my own new spec asserting text inside a closed disclosure; fixed. The final full guest run is 243 of 243.

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
export SCORING_DB_URL=postgresql://mindmosaic_scoring:local-dev-scoring-not-a-secret@127.0.0.1:<db-port>/postgres
export CONTENT_ANSWER_WRITER_DB_URL=postgresql://mindmosaic_content_answer_writer:local-dev-content-answer-writer-not-a-secret@127.0.0.1:<db-port>/postgres
npm run scoring:bootstrap && npm run content:answer-writer:bootstrap
npm run migrations:record && npm run migrations:status && npm run programmes:check-gates && npm run test:rls:ci

# browsers: choose free ports (3100 and 3145 are the defaults and may be taken; Playwright silently REUSES whatever is listening)
PW_PORT=<free> npm run test:e2e
# .env.e2e.local from .env.e2e.local.example with the Supabase URL changed to the isolated API port, then:
npm run e2e:seed && PW_AUTH_PORT=<free> npm run test:e2e:auth
```

Important: `tests/rls/db.ts`, `scripts/bootstrap-*.mts` and a few scripts default to port 56322. If `SCORING_DB_URL` and `CONTENT_ANSWER_WRITER_DB_URL` are not exported as above, the scoring-role tests connect to whatever is on 56322, which on a shared machine is somebody else's database.
