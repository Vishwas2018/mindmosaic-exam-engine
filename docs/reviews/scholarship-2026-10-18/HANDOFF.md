# Handoff: four separate statuses (19 Oct 2026)

Code verified at `60f90afa` (see `TEST-RESULTS.md`); the commit carrying this file is documentation and evidence only. The final SHA is the tip of `release/scholarship-prod` in `C:\tmp\wt-scholarship-prod`. Production, approvals, merges and deployment remain on hold. The rejected `git push` was not retried or worked around.

## 1. Repository publication: not done

The branch exists only locally; there is no PR. Needed from the repository owner, in this order:

1. Push `release/scholarship-prod` (or allow me to) and open a **draft** PR into `dev`.
2. Compare it with **PR #51** (kept open; head `aa3da4c1`, two commits, both ancestors of this branch, identical migration file). Merging #51 first then this PR needs no conflict resolution.
3. Add `scholarship-drafts` to the required status checks on `dev` and `main` (`BRANCH-PROTECTION.md`). The workflow change that makes the job blocking is committed; GitHub enforces nothing for a job that is not a required check.

## 2. Engineering stability: good, with one environmental caveat

- Every required check passed on its first attempt at `60f90afa`, including the complete RLS suite (36 files, 579 tests) and both browser suites.
- **Fixed:** the eleven `No assessment session` RLS failures (a test file deleted a shared environment variable). Variables are now restored after every file, even when a test fails; a database-target guard refuses to run unless every database variable names one local database; a per-file safety net restores them regardless.
- **Characterised, not fixed:** an occasional silent worker crash on this Windows host (`0xC0000409`, Node v24.15.0; reproduced, rate measured, not seen on the Linux CI runs of `dev`). It cannot now go unnoticed: the test-run guard keeps the real exit code, signal and full log and fails on crash text even when vitest exits 0. A crash means a rerun, not a retry loop.
- **Cross-stack access:** while the first bug was live, the scoring module made an unknown number of short read-only connections (about eleven per affected full run) (`BEGIN`, one `SELECT`, `ROLLBACK`) to another local Supabase stack on port 56322. Confirmed by code and reproduction; not visible in that stack's logs (connections and selects are not logged there, and the retained log starts after my earliest affected runs); no write path was reachable. Full assessment: `CROSS-STACK-ACCESS.md`. Worth telling the owner of `mindmosaic-rls-harness`.
- Open design choices, deliberate: Confidence Mode and shorter practice modules are not offered on scholarship papers; scholarship papers are signed-in only.

## 3. Content readiness: partial; not a release

- 160 of 160 keys independently verified; four named content concerns corrected; 30 items revised (all dependants of a changed passage re-pinned). Content has not changed since `403e7c58`; the packet, sheets and decision sheet were regenerated and are identical.
- 45 items (NR 26, maths 19) pass every machine gate and await **Vish's review**.
- 35 NR and maths items are correct but blocked on difficulty labels: **Vish decides** (`difficulty/difficulty-decision-sheet.csv`; recommended: relabel `nr-003`, `nr-005`, `nr-007`, `maths-023` to easy; do not approve the advisory policy just to clear the rest).
- 80 Verbal and Reading items have **no valid different-provider review**; the estimator would also block 43 of them on difficulty. The answer-withheld packet and exact prompt are in `external-review/`.
- No section has enough approvable items for a whole paper (26/40, 19/40, 0/45, 0/35).
- No approval, signature or human check was recorded by anyone.

## 4. Production readiness: no

Nothing is approved, no complete paper can be sat, and production's migration state has not been checked: someone holding the credential must run a read-only `npm run migrations:status` (or `supabase migration list --linked`) against production. The scholarship migration (`20261014090000`) is verified only on fresh isolated databases. Rollout needs Vish's content approval and a separate rollout authorisation; the owner merges `dev` to `main`.

## Remaining blockers, in order

1. Owner: push, draft PR, compare with #51, add `scholarship-drafts` to required checks.
2. Vish: review the 45 ready items; decide the 35 difficulty labels (and the 43 Verbal/Reading estimator conflicts, after the external review).
3. Vish: run the different-provider review of the 80 Verbal and Reading items, then `scripts/verify-scholarship-external-review.mts` on the reply, then fix, ingest and re-run the gates.
4. Owner: read-only migration status check against production.
5. Vish: approve content; separately authorise the rollout.
