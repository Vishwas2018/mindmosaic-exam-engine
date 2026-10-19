# Branch protection: owner action needed

Read on 19 Oct 2026 with `gh api repos/Vishwas2018/mindmosaic-exam-engine/branches/<branch>/protection` (read-only):

| Setting | `dev` | `main` |
|---|---|---|
| Required status checks | `core`, `e2e`, `e2e-auth`, `rls` | `core`, `e2e`, `e2e-auth`, `rls` |
| Require branches to be up to date (`strict`) | no | no |
| Required approving reviews | 0 | 0 |
| Require code-owner review | no | no |
| Enforce for administrators | no | no |
| Force pushes | blocked | blocked |

## What this release changed

`.github/workflows/ci.yml`: the `scholarship-drafts` job no longer has `continue-on-error: true`, so a failing draft validation now fails the workflow run. The job runs `npm run content:validate-scholarship-drafts` (schema, solvers, answer positions, stems, encoding, runtime isolation) and passes on this branch.

## What only the repository owner can do

Making a job blocking in the workflow file does **not** stop a merge by itself. GitHub blocks a merge only for checks listed under branch protection, and `scholarship-drafts` is not listed. Until it is added, a red `scholarship-drafts` run is visible on the PR but mergeable.

1. Settings, Branches, the rule for `dev`: add **`scholarship-drafts`** to "Require status checks to pass before merging".
2. Do the same for the rule on `main` (the owner merges `dev` to `main`).
3. Optional, for the same reason: set "Require branches to be up to date" if the owner wants every PR re-tested against the latest `dev`; today a PR can merge on a check run against an older base.

I did not change any repository setting and did not try to.

## Related, not changed

- `core` runs `npm run test:ci`; `rls` runs `npm run test:rls:ci`. Both go through `scripts/verify-test-run.mts`, which now also fails on a crashed worker whatever vitest's exit code says, and can keep the full log, exit code and a run record when `TEST_RUN_RECORD_DIR` is set. CI does not set it. To keep the evidence of a red run, add `TEST_RUN_RECORD_DIR: test-results/run-records` to those two steps and an `actions/upload-artifact` step with `if: always()`; I left the `core` and `rls` jobs untouched because the brief only allowed changing the scholarship job.
- The `rls` job relies on the default database port. Setting `RLS_EXPECTED_DB_PORT: "56322"` in that job's `env` would make the new database-target guard assert the port explicitly; the guard already refuses any mismatch between variables without it.
