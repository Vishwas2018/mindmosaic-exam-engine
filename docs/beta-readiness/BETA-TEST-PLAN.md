# Beta test plan: acceptance scenarios A–E on hosted DEV

Target: a Preview deployment of `integration/beta-consolidation` (later `dev`) connected to DEV
`mfglzabnayacssgertat`. Identities: synthetic `mm-dev-*@example.com` accounts on DEV only. Production is never used.

A scenario counts as passed only when it ran against the deployed Preview. A CI run on the local Supabase stack is
recorded in the last column as supporting evidence, never as the pass.

| Step | How it runs on the Preview | Supporting CI coverage (local stack) |
|------|----------------------------|--------------------------------------|
| **A. Parent onboarding** | | |
| A1 register, A2 verify email | Browser. Needs a mailbox the agent may read: DEV sends real email, so this needs an owner-provided test inbox or the owner clicking the link | `e2e/auth/email-confirmation-and-recovery.spec.ts` (Mailpit) |
| A3 sign in | Browser or script | `auth-journey.spec.ts` |
| A4 create child, A5 set PIN, A6 print card | Browser as the synthetic parent | `parent-*` specs |
| **B. Student assessment** | | |
| B1 child signs in, B2 My Space | Browser with the child's login code and PIN | `student-exam-session.spec.ts` |
| B3 approved programme | Blocked on D-016: no family-beta item carries a human `approvedBy` | |
| B4 start, B5 answer several types, B6 submit, B7 marks | `run-preview-acceptance.cjs` (API level, 188-question oracle) plus one browser sitting | `student-exam-session.spec.ts`, scoring unit tests |
| B8 review answers and explanations | Browser | `a11y-results-review.spec.ts` |
| **C. Persistence** | | |
| C1-C3 sign out, back in, history kept | Script `HISTORY` check plus browser | `student-exam-session.spec.ts` |
| C4-C5 parent sees the right child's real progress | Browser as the synthetic parent | `family-overview` component tests only |
| **D. Security** | | |
| D1 wrong PIN, D2 bad code | Browser | `auth-journey.spec.ts` |
| D3 admin routes denied | Script: `/admin` as student and parent | `admin-workspace.spec.ts` |
| D4 second family isolation | Script with `mm-dev-parent2` | `rls` job |
| D5 another student's attempt | Script `ISO-*` checks | `rls` job |
| D6 failure handling honest | Script: submit after the writer is unset is not run on DEV; covered by unit tests of `legacy-exam-writes.ts` (503 `not_configured`) | unit |
| **E. Mobile** | Repeat A3-A6, B1-B8 at 390 px in the browser | `e2e` mobile projects |

## Order

1. Owner: Supabase CLI sign-in (setup script runs B3/B4/C1 of RELEASE-CHECKLIST).
2. Owner approval: push and redeploy the Preview.
3. Agent: `run-preview-acceptance.cjs <host>`; `FORGE-RPC` is expected to fail at this point.
4. Agent: browser passes of A, B, C, D, E with synthetic identities.
5. Owner approval: apply `20261031090100`; agent reruns step 3 (now `FORGE-RPC` must pass) and B4-B7.

## Results

### 2026-11-13, Preview `rg3yjc7he` (`ff775d2d`), before `20261031090100`

`run-preview-acceptance.cjs`: 65/66 passed. Covered: B4-B7 at API level (NAPLAN 3 forms, ICAS 2 forms; create,
no answer leak, autosave, resume, submit, forged client score ignored, totals and per-question status equal to the
independent oracle, single persisted attempt, resubmit 409, post-submit autosave 409), C1-C3 (`HISTORY`), D5
(`ISO-SUBMIT`, `ISO-AUTOSAVE`, `ISO-READ`, `ISO-RLS`) and anonymous read denied. Failed: `FORGE-RPC`, the
known legacy-RPC hole that `20261031090100` closes.

Not yet run on the Preview: A1-A6, B1-B3, B8, C4-C5, D1-D4, E (browser passes).
