# Handoff: restart checkpoint

Session ended on a usage limit, mid-task. No background process is running; nothing continues by itself.

## Where things are

- Worktree `C:\tmp\wt-beta-rc`, branch `integration/beta-consolidation`, draft PR #123 into `dev`. Supersedes #119.
- Local gates on the merge commit `11bb13e4`: typecheck 0 errors, eslint 0 errors, vitest 7,267 / 7,267, `next build`
  ok, question / answer / ledger / lesson validators exit 0. Later commits were checked with typecheck, eslint and
  the affected test files only, not the full suite.
- CI on `d7914c21`: core, rls, scholarship-drafts pass. e2e 383 passed / 3 failed / 1 flaky. e2e-auth 74 passed /
  9 failed.
- Fixes for those failures are in `488998ad` and `4491b920`. **Their CI result has not been read.**

## Resume here

1. `gh pr checks 123`. If either E2E job is red, download the `e2e-test-results` / `e2e-auth-test-results` artifact
   and read `error-context.md` for the failing test.
2. D-009 (two "PIN 1 of 6" inputs in CI only) is expected to still fail. See DEFECT-REGISTER.md. Do not mask it.
3. Run the full `npm test` on the branch head before asking for a merge.
4. Then the open rows of DEFECT-REGISTER.md (D-013, D-014, D-015).

## Not done this session

- Records still to write: TASK-LEDGER, REPOSITORY-AUDIT, FEATURE-MATRIX, DESIGN-TRACEABILITY, SECURITY-REVIEW,
  TEST-RESULTS, RELEASE-CHECKLIST, BETA-TEST-PLAN.
- No hosted DEV testing. No acceptance scenario A–E was run. No design-fidelity comparison. No dependency audit.
- Student, assessment-engine, results and admin workstreams were not audited beyond what the E2E failures exposed.
- The 40-odd other open PRs were listed but not triaged.
- The main checkout's uncommitted billing rewrite was not touched. It will conflict with this branch in
  `ParentShell`, `parent/page.tsx` and `parent/children/page.tsx`.

## Waiting on the owner

- Hosted DEV: migrations `20261031090000` / `20261031090100` and `EXAM_WRITE_DB_URL` (DATABASE-READINESS.md).
- Human `approvedBy` on the content the family will sit.
- Merge of #123 once CI is green.

## Decisions

All readiness decisions are **NO-GO**: DEV integration (CI not green), DEV deployment, supervised family beta,
expanded beta, production.
