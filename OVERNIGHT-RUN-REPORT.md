# Overnight autonomous run — 2026-08-20/21

> Branch: `fix/close-exam-write-trust-boundary`. Nothing pushed. Cohort stays
> `enabled=false, cohort_mode='off'` throughout. This file is updated after
> every task, so a mid-run stop still leaves a full record.

## Numbering note (resolved without stopping the run)

The overnight prompt's Task 1 labelled the programme-offering authority work
"A14" and Task 2 labelled the config-version work "A15". Earlier in this same
session the operator was asked to resolve a collision — the checklist's
*existing* A14 ("Manifest-gate reconciliation") and A15 ("Config-pin
reproducibility") are unrelated open items — and explicitly chose to file the
programme-offering work as **A16** instead. That decision stands. Task 2's
"A15" label, by contrast, genuinely matches the *existing* A15 topic
(immutable config-version rows is one of that item's own two accepted
resolutions), so Task 2 closes the real A15. This is a clerical numbering
resolution, not a product-owner call, so the run was not stopped for it.

## Task 1 — A16: canonical programme-offering authority

**Status: Done.** Commit `82680aa`.

- `supabase/migrations/20260822090000_programme_offering_authority.sql`:
  `subjects`, `assessment_families`, `programmes`, `programme_offerings`
  (stable TEXT ids, unique on `programme_id, subject_id, year_level, locale,
  region`), seeded 99 rows for NAPLAN (Y3/5/7/9) and ICAS (Y2-12) from
  `EXAM_STYLE_YEAR_LEVELS` × `SUBJECT_REGISTRY`. Superset-compatible with
  `feat/assessment-capability-expansion`'s own `assessment_families`/
  `programmes`/`programme_offerings` (same six families/programmes seeded
  verbatim under `on conflict do nothing`) — see the migration header for
  the exact convergence note that branch should follow at rebase time.
- `create_assessment_session` restated: subject resolution and the
  `(examStyle, yearLevel[, subject])` offering boundary now query
  `programme_offerings`/`subjects` directly. No inline mapping remains. The
  boundary is *stricter* than A11 left it — a real style/year with an
  unsupported subject (NAPLAN-style Science) now fails MM229 too.
- `scripts/migrations/registry.ts`: A11's two checks updated in place (they
  asserted literal text this migration retires — see the registry comment
  for why leaving them as-is would permanently red-flag a correctly-applied
  migration) plus three new checks for A16 itself.
- `tests/rls/programme-offering-authority.test.ts` (17 cases): seeded-set
  parity against the TS registries, every valid offering still routes, three
  new invalid-combination rejections (NAPLAN Y4, NAPLAN Science, ICAS Y10
  Digital Technologies), unrecognised-subject regression, and the
  read-appropriate/not-learner-writable privilege proof.
- `docs/phase2-cutover-readiness-checklist.md` updated with the A16 row and
  a note that it is additional hardening, not one of the seven items Gate
  A's own closure criteria depends on.

**Gates:** tsc clean · lint clean · unit 4839/4839 (`test:ci`) · RLS: this
migration's own two test files pass 29/29; the full guard run has a
pre-existing, unrelated failure — see below · `next build` clean · fresh
`supabase db reset` applies all 35 migrations · migration-registry 35/35 ok
· `graphify update` run.

### Finding: pre-existing regression in `target-sitting-end-to-end.test.ts` (NOT caused by A16)

Steps 7–10 of the A6 end-to-end suite fail: `assessment_results` and
`manual_marks` end up with **zero rows** after step 6 (`scoreAssessmentSession`)
reports a correct in-memory summary (`totalItems: 3, correctCount: 1,
objectivePercentage: 50`, session status flips to `submitted`). History,
pending-marks and assignment-attribution reads then all see nothing, because
there is nothing to see.

**Confirmed pre-existing, not a regression from Task 1:** `git stash`ed all
three Task 1 files, ran a fresh `supabase db reset` on bare `HEAD`
(`ac10bf2`), and reran `tests/rls/target-sitting-end-to-end.test.ts` in
isolation — identical failure, identical row counts (5 failed / 6 passed).
Restored the stash afterward; Task 1's own commit is unaffected.

This is a real defect (the scoring module computes a correct result but its
write step appears to no-op), not a timeout/hang — different symptom class
from what Task 5 describes. Flagged here rather than chased under Task 1's
scope. **Recommended for morning review as its own fix, ideally before
relying on `target-sitting-end-to-end.test.ts` as Gate A's E2E proof for
anything built on top of it (Task 2's replay proof in particular sits
directly downstream of scoring).**

## Task 2 — A15: immutable config-version tables + FK-pinned sessions

Status: see below (in progress / continues after this report entry).

## Task 3 — A4 whole-data-graph erasure scope

Status: not yet started.

## Task 4 — Missing §22 proof-obligation tests

Status: not yet started.

## Task 5 — Full `npm test` completion investigation

Status: not yet started. Note: Task 1's own full-suite run (`test:ci`)
completed normally (350s, 252/252 files, 4839/4839 tests, no hang) — so
if the timeout Task 5 describes is real, it is not reproducing on every run
under the current guard. Needs its own investigation as scoped.

## Task 6 — Consolidation

Status: not yet started (this file itself is the running consolidation and
will be finalized as part of Task 6).

---

## Morning review — priority list (updated as the run proceeds)

1. **`target-sitting-end-to-end.test.ts` steps 7-10 fail on bare `HEAD`**
   (before any overnight-run change) — scoring computes a correct summary but
   writes nothing to `assessment_results`/`manual_marks`. Confirmed
   reproducible via controlled `git stash` comparison. Not caused by A16.
   Needs root-cause investigation; likely affects any later work (Task 2's
   replay proof, Task 4's scoring-adjacent §22 tests) that assumes this
   suite is a working end-to-end proof.
