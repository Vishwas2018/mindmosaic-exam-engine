# Clean `origin/dev` baseline — 5 October 2026

Commit `cc50a9a1ea13339897c081f652b757d50bf222c5` was checked in the detached worktree `baseline-dev-2026-10-05`. Source files were unchanged. The tests used the local Supabase stack and CI's documented dummy Stripe values; no hosted database was changed. Full logs are retained in the worktree's ignored `.verification` directory.

| Suite | Passed | Failed | Baseline failure |
| --- | ---: | ---: | --- |
| `npm run test:ci` | 5,450 | 1 | `src/tests/unit/year-authority.test.ts > (a) one product-range year authority > declares YEAR_LEVELS in exactly one module` exceeded its 5-second timeout during the full run. All 303 files and 5,451 tests concluded. An isolated rerun passed. |
| `npm run test:rls:ci` | 499 | 0 | None; 32/32 files completed. |
| `npm run test:e2e:auth` | 42 | 1 | `student dashboard: accessibility and responsive layout > /student/assignments (no attempts yet) has no violations at every viewport`: horizontal overflow assertion failed. |
| `npm run test:e2e` | 172 | 0 | None. |

The unit timeout is a load-sensitive baseline observation, not a stable product failure: its isolated rerun passed. The authenticated assignments overflow failure was observed once on `dev`; branch failures with other test names need independent classification and repair.

An earlier unguarded `npm test` run in this clean checkout failed in `stripe-webhook-route.test.ts` because `.env.local` was absent. `test:ci` uses CI's dummy Stripe environment values and did not have that failure. The four-suite comparison above uses the requested guarded command.
