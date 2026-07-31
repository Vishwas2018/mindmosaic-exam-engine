# Package F — branch reconciliation

`git fetch origin --prune` first (nothing pruned, nothing new). 18 remote
branches exist besides `origin/main` itself — one more than the brief's
"17," noted rather than silently reconciled away: `origin/main` was counted
once elsewhere but the full remote branch list genuinely has 18 siblings.
For each, ancestry was checked directly with `git merge-base --is-ancestor`,
not inferred from ahead/behind counts alone (a first pass using only
`rev-list --left-right --count` was cross-checked this way, since the two
can disagree if a branch was rewritten).

## Disposition table

| Branch | Merged into main? | Last commit | Disposition |
|---|---|---|---|
| `backup/pre-audit-main-f65a512` | **yes** (ancestor) | pre-audit snapshot | **keep** — explicitly retained per `publication-288-posthoc-audit.md`'s addendum as "the audit record, not a staging area." Do not delete. |
| `feat/deploy-readiness` | **yes** (ancestor) | merged this session, `--no-ff` | **delete** — fully merged, its own purpose is done, nothing else points to it |
| `feat/landing-design-system-polish` | **yes** (ancestor) | — | **delete** — fully merged |
| `feature/admin-analytics` | **yes** (ancestor) | — | **delete** — fully merged |
| `feature/parent-dashboard` | **yes** (ancestor) | — | **delete** — fully merged |
| `feature/practice-bank-and-ui` | **yes** (ancestor) | — | **delete** — fully merged |
| `feature/student-assignments-engagement` | **yes** (ancestor) | — | **delete** — fully merged |
| `feature/student-core` | **yes** (ancestor) | — | **delete** — fully merged |
| `feature/teacher-tools` | **yes** (ancestor) | — | **delete** — fully merged |
| `integration/governed-question-factory` | **yes** (ancestor) | — | **delete** — fully merged |
| `night-e2e` | **yes** (ancestor) | — | **delete** — fully merged |
| `night-g3-bank` | **yes** (ancestor) | — | **delete** — fully merged |
| `night-g5-bank` | **yes** (ancestor) | — | **delete** — fully merged |
| `night-responsive` | **yes** (ancestor) | — | **delete** — fully merged |
| `night-security` | **yes** (ancestor) | — | **delete** — fully merged |
| `night-seo` | **yes** (ancestor) | — | **delete** — fully merged |
| `claude/mission2-fixture-prep` | **no** — 12 exclusive commits | 2026-07-12 | **delete (superseded)** — see below |
| `claude/mission3d-third-remediation` | **no** — 16 exclusive commits | 2026-07-17 | **park/delete (superseded)** — deep-dived below |
| `feature/pb2-blueprint-binding` | **no** — 10 exclusive commits | 2026-07-17 | **merge-candidate, needs a real rebase** — deep-dived below |

**16 of 18 are already fully merged and safe to delete outright** — I did
not delete any of them (no merges, no branch deletion in this audit's
guardrails), but the classification is unambiguous: `git merge-base
--is-ancestor <branch> main` returned true for all sixteen, meaning every
commit on each already exists in `main`'s history. The one exception in
that group, `backup/pre-audit-main-f65a512`, is also a true ancestor but
carries an explicit "keep indefinitely" instruction from an earlier report
and should not be deleted with the rest.

## Deep-dive: `claude/mission3d-third-remediation` vs current `main`

**Verdict: superseded, not a merge-candidate.**

This branch is an earlier, abandoned attempt at question-factory gate
integrity — its own commit trail (`feat: reserve trusted report families and
add governed evidence writer`, `feat: mint and re-verify correctness-pass
attestation`, `feat: remove public builder/write access to trusted
evidence`) describes a "governed authority / trusted report family"
architecture, last touched 2026-07-17 — **13 days before the 2026-07-30
publication-288 audit that found the actual incident this repo needed
fixing.** Checked directly: this branch's own `publication/eligibility.ts`
contains **no reference to `correctness`, `review_required`, or
`difficulty_review_passed`** — the exact gap the real incident hinged on.
This branch would not have caught the 132-question problem either; it was
solving a different, earlier-conceived problem.

`main` since fixed the actual incident via a different, later, and
already-merged path: `f53b227` (P0-A, verify every upstream gate),
`6913a8d`/`00c4fbf`/`b1fe8db` (P0-B, durable review chains), `55c0833`
(P0-C, different-provider independence) — all confirmed ancestors of `HEAD`
in Package E. `git diff --stat` against `main` on
`src/features/question-factory/` shows **51 files, 2515 insertions(+),
1449 deletions(-)** — the branch touches the exact same subsystem
(`publication/eligibility.ts`, `publication/manifest-schema.ts`,
`staging/orchestrate-staging.ts`) with a fundamentally different design.
Merging it now would not add anything the shipped fix lacks; it would
reopen a design competition against code that is already live, tested
(Package E: 219 test files, 0 failures), and has already been used to
publish 288 real questions. **Recommend: do not merge. Park the branch
(keep the ref, do not delete) only if its "trusted report family" tests are
wanted as reference material for a future hardening pass; otherwise delete.**

## Deep-dive: `feature/pb2-blueprint-binding` vs current `main`

**Verdict: a real, still-relevant feature — genuine merge-candidate, but
expect substantial conflicts.**

Unlike the branch above, this one is about a distinct feature — binding an
authoring "blueprint" (template) to a candidate question at manual
ingestion (`feat: add blueprint-binding module for governed manual
batches`, `feat: bind blueprints per candidate at manual ingestion`,
`feat: add blueprints-seed CLI and --binding-manifest ingest flag`), plus
several hardening fixes on top (non-mutating preflight inspection,
rejecting invalid manifests before any filesystem trace, deterministic
binding-run authorisation). Nothing in its own commit trail is a duplicate
attempt at the correctness-gate incident. This looks like real, wanted
functionality that simply stalled.

The conflict risk is real, not theoretical: `git diff --stat` against
`main` on the same directory shows **69 files, 5090 insertions(+), 1556
deletions(-)**, and it touches the identical hot files P0-A/B/C already
rewrote — `publication/eligibility.ts`, `publication/manifest-schema.ts`,
`staging/orchestrate-staging.ts`, `provenance/review-chain.ts`. Both
branches diverged from a common ancestor around 2026-07-16/17 and evolved
`publication/`/`staging/` independently and heavily since. A merge or
rebase here is not a formality — it needs someone to reconcile two
independent rewrites of the same lifecycle-gate code, and the newer one
(on `main`) has 15 days of subsequent hardening and a live incident
response behind it that this branch never saw. **Recommend: rebase onto
current `main` before attempting to land it, treating `main`'s
`publication/`/`staging/` code as authoritative and re-applying only the
blueprint-binding-specific logic on top** — not a straight three-way merge,
which would be fighting the gate-chain fix over files it doesn't know
exist in their current form.

## Nothing merged, nothing deleted

Per the guardrails: recommendation only. No branch was merged, deleted, or
force-pushed as part of producing this report.
