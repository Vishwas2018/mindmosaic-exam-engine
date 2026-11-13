# Handoff: restart checkpoint

Last updated 2026-11-13. No background process is running; nothing continues by itself.

## Where things are

- Worktree `C:/tmp/wt-beta-rc`, branch `integration/beta-consolidation`, draft PR #123 into `dev`. Supersedes #119.
- CI on `dc144775`: all five checks green. core 7,271 unit tests; e2e 386 passed, 1 flaky
  (`a11y-auth-pages.spec.ts:40`, a known flake); e2e-auth 84 passed, **9 skipped**; rls and scholarship-drafts pass.
- Those 9 skips were every test that reads an email. `0670902e` switched them on (`E2E_MAILPIT_URL`,
  `E2E_TOKEN_HASH_TEMPLATES`). First run: 88 passed, 5 failed. `cdfede1c` fixes those five. **Read its CI result
  before trusting the email-confirmation and recovery paths.**
- Hosted DEV: `20261031090000` applied, `20261031090100` not. No migration was applied by the agent; no credential
  on the machine can. See DATABASE-READINESS.md.

## Resume here

1. `gh pr checks 123`. A red E2E job now uploads `e2e-test-results` / `e2e-auth-test-results`; read
   `error-context.md` for the failing test before changing code. Check the skip count, not just the colour.
2. Do not merge #123 into `dev` until `EXAM_WRITE_DB_URL` exists in Vercel Preview: without it, signed-in exam
   start and submit return 503 on the DEV deployment.
3. Open rows of DEFECT-REGISTER.md (D-013, D-014, D-015).
4. Remaining records and workstreams listed below.

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
