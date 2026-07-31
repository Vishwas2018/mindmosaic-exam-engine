# Overnight audit — 2026-07-31 — STATUS

**All 7 packages completed. No package stopped short. Nothing is awaiting a
decision to *proceed with the audit itself* — everything below is a
decision awaiting your input on what to *do next*, which is a different
thing.**

## Packages

| Package | Status | Report |
|---|---|---|
| A — migration drift | **Complete.** Premise was stale (3 migrations already applied in a prior session); reconfirmed 8/8 clean, no remediation needed. | `package-a-migration-drift.md` |
| B — durable-attempts integrity | **Complete.** Row immutability and no-answer-key-leakage hold, test-covered. Two real gaps found: no optimistic concurrency on autosave; idempotent replay returns an error, not the original result. | `package-b-durable-attempts.md` |
| C — RLS empirical audit | **Complete.** Every testable boundary passed, including a fresh behavioral re-confirmation of MM-AUTH-01. One methodology error caught and corrected in-flight (confounded teacher probe, redone with a synthetic identity). | `package-c-rls-empirical.md` |
| D — billing/entitlement | **Complete.** Premise was stale here too (transactional-apply migration already applied); webhook idempotency live-verified by direct rolled-back RPC call. Billing enforcement is currently off by flag (reported, not judged). | `package-d-billing-entitlement.md` |
| E — full gate suite + content state | **Complete.** All 8 gates green from a clean run (0 failures across typecheck/lint/3098 tests/e2e/build/bundle/question-validation). 288 publication intact. **0 of 132 ordered retroactive reviews have been ingested.** | `package-e-gate-suite-content-state.md` |
| F — branch reconciliation | **Complete.** 18 branches; 16 already fully merged (safe to delete except the explicitly-retained backup ref); 2 have real unmerged work, deep-dived as requested. | `package-f-branch-reconciliation.md` |
| G — consolidated executive audit | **Complete.** Risk register, prioritized backlog, GO/NO-GO, top 3 actions. | `package-g-executive-summary.md` |

## Guardrails held throughout

- **No live-database writes committed.** Every probe against the live
  project ran inside `BEGIN...ROLLBACK`; every one was confirmed to leave
  zero residue where a residue check was possible (synthetic teacher
  identity, RPC replay probe).
- **Never ran as service role for an RLS probe.** All Package C
  impersonation used `set local role authenticated/anon` +
  `request.jwt.claims`, matching what PostgREST actually sets per request.
- **No merges to main, no publishing, no force-push.** Every commit this
  run was a plain, forward-only, docs-only push (`e245a69` →
  `d2880d7`, 7 commits, one per package).
- **Sole-writer re-verified before every commit** — checked for
  `.git/*.lock` across the main worktree and both linked worktrees, and
  confirmed `git log --all -1`'s timestamp moved forward as expected, each
  time, immediately before staging.
- **content/icas-1000-\*, the 288 published content, and the frozen Mission
  3 contract were never touched** — read, in the case of the 288 manifests
  (to count them and grep for review-chain markers), never written.
- Small increments: each package's report was committed and pushed
  individually as it finished, so partial progress was durable throughout
  the run rather than sitting uncommitted until the end.

## What's awaiting your decision (not blocking, informational)

These are the substantive findings that need a call from you — none of them
stopped the audit; they're the actual output of it:

1. **The 132-question retroactive review** (Package E / G #1) — complete it
   now, or make an explicit interim-risk decision. This is the one finding
   with a direct line to the two real children's actual scores.
2. **SMTP + `site_url`/`uri_allow_list`** (carried from earlier this
   engagement, restated in Package G #2) — needs configuring before a
   second parent account would have working password reset.
3. **`SUPABASE_ACCESS_TOKEN` revocation** (Package G #3) — recommended
   repeatedly across this engagement, still present in `.env.local`,
   still a one-click fix.
4. **The two durable-attempts gaps** (Package B) — worth fixing together,
   same root cause (no version discipline on session/response tables).
5. **`BILLING_ENFORCEMENT_ENABLED`** (Package D) — a decision about whether
   to flip it now that `/billing` is a real page, or deliberately hold.
6. **Branch cleanup** (Package F) — 16 branches ready to delete on your
   go-ahead; two need a product decision (`feature/pb2-blueprint-binding`:
   rebase and land, or shelve; `claude/mission3d-third-remediation`: park
   or delete).

## Uncommitted, pre-dating this audit — left untouched

`docs/DEPLOYMENT.md` (modified), `package.json` (modified),
`REPO-AUDIT-REPORT.md` (untracked, another session's), `scripts/audit-auth-
users.mts` (untracked) were all present in the working tree before this
audit began and were deliberately never staged by any package's commit —
each commit above staged only its own new report file, checked individually
before committing. They remain exactly as they were found.
