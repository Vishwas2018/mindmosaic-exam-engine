# Handoff: restart checkpoint

Last updated 2026-11-13 (evening). No background process is running; nothing continues by itself.

## Where things are

- Worktree `C:/tmp/wt-beta-rc`, branch `integration/beta-consolidation`, draft PR #123 into `dev`. Supersedes #119.
- Remote head `ff775d2d` (pushed by the owner). CI on that head: see TEST-RESULTS below / `gh pr checks 123`.
- Hosted DEV `mfglzabnayacssgertat`, 2026-11-13:
  - `20261031090000` applied; `20261031090100` is the only migration not applied.
  - `mindmosaic_exam_writer` has a password (SCRAM verifier set by `exam-writer-setup.cjs`; plaintext never
    printed or stored). Verified as the writer: executes `create_exam_session_for` / `record_exam_attempt_for`,
    not the legacy `create_exam_session`; SELECT on `exam_sessions`, `exam_attempts`, `profiles`, `auth.users`
    and INSERT on `exam_sessions` all return 42501.
  - `EXAM_WRITE_DB_URL`: sensitive, Preview target, value set by the setup script.
  - A second `EXAM_WRITE_DB_URL` with target **development** (created 06:27 UTC by the owner) holds the old,
    now-invalid password. Deleting it needs an interactive confirmation the agent will not skip; owner to delete
    in the Vercel dashboard. It affects only `vercel dev` / `vercel env pull`.
- Preview `mindmosaic-exam-engine-rg3yjc7he-vishwas2018s-projects.vercel.app` (`ff775d2d`):
  - Client bundles: 42 files from `/sign-in`, `/student`, `/parent` name only `mfglzabnayacssgertat`.
  - Server side: the Preview accepted DEV-issued student JWTs and every attempt it wrote was read back from DEV
    PostgREST identical to the Preview's response, so its server writes land on DEV.
  - Hosted acceptance (`run-preview-acceptance.cjs`): **65/66**. The single failure is `FORGE-RPC` (a student can
    still call the legacy `record_exam_attempt` directly), the expected pre-lockdown finding that `090100` closes.
- Content: 77 of the 78 family-beta items carry the owner's approval (Vishwas Joshi, `ff775d2d`). Y5 Q20
  (`man-eb2d2e6d5ddfebf6c5085c6e`) was corrected after review and awaits the owner's separate approval.

## Resume here

1. `gh pr checks 123`. Check skip counts, not only colours.
2. Owner decision on `20261031090100` (DATABASE-READINESS.md, "Lockdown approval request"). **It breaks exam
   start and submit on every Preview built from a branch without the new write path, `dev` included** (`dev` does
   not contain `20261031090000`'s app changes). Either merge #123 into `dev` first, or accept that window.
3. After approval: apply that file alone through the linked dir `C:/tmp/mm-dev-link` (never `db push`), record it
   in the ledger, rerun `run-preview-acceptance.cjs <host>`; `FORGE-RPC` must pass and the other 65 stay green.
4. Browser passes of scenarios A–E (BETA-TEST-PLAN.md).

## Not done

- Records still to write: TASK-LEDGER, REPOSITORY-AUDIT, FEATURE-MATRIX, DESIGN-TRACEABILITY, SECURITY-REVIEW.
- Browser runs of scenarios A–E on the Preview. No design-fidelity comparison. No dependency audit.
- The 40-odd other open PRs were listed but not triaged.
- The main checkout's uncommitted billing rewrite was not touched. It will conflict with this branch in
  `ParentShell`, `parent/page.tsx` and `parent/children/page.tsx`.

## Waiting on the owner

- Approval of `20261031090100`, and the order relative to merging #123 into `dev`.
- Approval of corrected Y5 Q20.
- Delete the stale development-target `EXAM_WRITE_DB_URL` in Vercel.
- Merge of #123 into `dev`.

## Decisions

- Hosted exam path on the DEV Preview (start, autosave, resume, submit, scoring, history, isolation, RLS): **GO**
  (65/66, the one failure is the known pre-lockdown hole).
- Supervised family beta: **NO-GO** until `090100` is applied and `FORGE-RPC` passes, Y5 Q20 is approved or
  removed from the paper, and scenarios A–E pass in the browser.
- Expanded beta, production: **NO-GO**.
