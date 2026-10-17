## Release: dev → main

Promotes everything on `dev` (102 commits, 308 files, merge commit, no squash). `main` is a strict ancestor of `dev`; `git merge-tree` is clean.

**The two database migrations were applied to hosted BEFORE this PR, deliberately** (database first, because Vercel deploys `main` the moment this merges):
- `20261005090000_revision_bound_publication_approvals` (adds approvals/gate tables and triggers; replaces `create_assessment_session`, which no live caller reaches)
- `20261013090000_timed_writing_parent_marking` (adds writing tables and functions; restates `erase_student`, which is live code but unreachable by any user today, signature-compatible; its new behaviour is not yet verified)

Hosted ledger should read 49 rows, newest `20261013090000`. Plan, runbook and rollback: `docs/plans/dev-to-main-release-plan-2026-10-14.md`.

### What changes at runtime
- `getExamBank()` is filtered by a publication gate that fails closed to an empty bank on any evidence problem. Guarded by `content/publication-approvals/.gitkeep` and a unit test. Verified on a dev preview before this PR (step 4).
- `getQuestionById()` searches `publishedExamBank` only. Measured: 0 ids in the curated bank are missing from it.
- `next.config.ts`: trace includes for manifests and approvals; image formats/qualities.
- New writing routes (`/api/writing/**`, `/student/writing`, `/parent/writing`, `/writing/**`); no prompt is approved yet, so they serve nothing. `/dev/*` routes are preview-gated and off in production.
- Landing rewrite; `metadataBase`/sitemap/robots use the Vercel production URL.
- Not touched: billing, auth, Supabase client helpers, middleware.

### Required checks (merge only when all green)
`core`, `e2e`, `e2e-auth`, `rls`. Merge commit. No admin bypass.

### Post-merge checks (production)
1. Deployment READY; function size sane.
2. `/api/exam/guest-bank` non-empty.
3. Test child: Year 5 practice starts and returns items; onboarding questions return 5.
4. Runtime logs: no `Missing publication evidence`.
5. `/student/writing` and `/parent/writing` degrade cleanly (no prompt approved).
6. No account erasure is run until `erase_student` is verified on a restored copy.

### Rollback
- Code: `vercel rollback dpl_8MBkfHPm4KmuXoeKopoBpGPBU4tB --scope vishwas2018s-projects` (main @ `47c11ba8`), then a `git revert -m 1 <merge>` PR.
- Database: leave as is. Both migrations are compatible with the old code. Reverse SQL exists in `docs/plans/rollback/` (refuses if rows exist).

### Not in this release
PR #51 adds a third migration replacing `create_exam_session` (the live hot path, signature-compatible). It ships as its own release after this one.
