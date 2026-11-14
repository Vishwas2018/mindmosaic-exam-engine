# Family beta: master plan

Goal: one consolidated `dev` that a real family can use end to end (parent signs up, adds a child, child signs in,
sits an approved assessment, both see the genuine result), verified on hosted DEV (`mfglzabnayacssgertat`).

Status words used across these records: VERIFIED COMPLETE, IMPLEMENTED BUT UNVERIFIED, PARTIALLY COMPLETE, MISSING,
BROKEN, BLOCKED, SUPERSEDED, INTENTIONALLY DEFERRED. "Verified" always names the evidence and the commit.

## Phases

| # | Phase | State | Evidence / next step |
|---|-------|-------|----------------------|
| 1 | One integration branch: #119 reconciled onto `dev` (#120–#122) | IMPLEMENTED BUT UNVERIFIED | PR #123. Local gates green; CI E2E not yet green. See TEST-RESULTS.md |
| 2 | Green CI on the integration branch (core, rls, e2e, e2e-auth) | PARTIALLY COMPLETE | core + rls green. E2E fixes pushed; one unexplained failure (D-009) |
| 3 | Merge #123 into `dev` | BLOCKED on 2, then on repository merge policy | Owner merges, or confirms the agent may |
| 4 | Hosted DEV database: migrations `20261031090000` → deploy → `20261031090100`, `EXAM_WRITE_DB_URL` | BLOCKED (owner credentials) | DATABASE-READINESS.md; `docs/runbooks/legacy-exam-write-lockdown.md` |
| 5 | Hosted acceptance scenarios A–E | BLOCKED on 3 and 4 | BETA-TEST-PLAN.md |
| 6 | Human content approval (`approvedBy`) for the programme the family will sit | BLOCKED (human gate, rule 8) | `docs/runbooks/content-approval.md` |
| 7 | Close remaining open PRs as superseded or re-scoped | NOT STARTED | REPOSITORY-AUDIT.md lists each |

## What is deliberately not in this plan

- Paid billing, live Stripe checkout, entitlement enforcement (`BILLING_ENFORCEMENT_ENABLED` stays unset).
- Production (`main`, `uermhsptduikehuyceiz`). Nothing here touches it.
- Publishing any assessment content. No agent supplies an `approvedBy`.
- Enforcing the Content-Security-Policy (see ARCHITECTURE-DECISIONS.md, AD-002).

## Order of work for the next session

1. Read HANDOFF.md, then TASK-LEDGER.md.
2. Get PR #123 CI green (D-009 first).
3. Continue the unverified rows of FEATURE-MATRIX.md, highest priority first.
