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

**Status: Done.** Commits `82680aa`, `8e1b4d6` (docs), `e1002c5` (a legitimate
follow-up test-expectation fix — see below).

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

**Gates:** tsc clean · lint clean · unit 4839/4839 (`test:ci`) · RLS full
guard 420/420 (`test:rls:ci`) · `next build` clean · fresh `supabase db
reset` applies all 35 migrations · migration-registry 35/35 ok · `graphify
update` run.

### Two things found and resolved during verification (neither is a real regression)

**1. Environment step, not a bug — `mindmosaic_scoring` role password.**
The first full guard run showed `target-sitting-end-to-end.test.ts` failing
from step 6 onward with `password authentication failed for user
"mindmosaic_scoring"` (truncated out of the initial `tail`, which made it
*look* like a silent downstream write failure — assessment_results/
manual_marks read back empty because the scoring module's connection never
authenticated at all, not because it wrote nothing). A fresh `supabase db
reset` does not preserve that role's local dev password;
`npm run scoring:bootstrap` re-sets it
(`SCORING_DB_URL=postgresql://mindmosaic_scoring:local-dev-scoring-not-a-secret@...`).
After bootstrapping, the suite passes 11/11. **Action for future verification
passes on this branch: always run `npm run scoring:bootstrap` immediately
after `supabase db reset`, before any RLS suite that scores.** Not
documented as a required post-reset step anywhere obvious — worth adding to
`docs/MIGRATIONS.md` or a `postreset` npm script if this recurs.

**2. Genuine, expected test-expectation fix — `assessment-session-create.test.ts`.**
With the scoring role fixed, one real failure remained:
`"refuses a scope with no eligible content rather than serving an empty
paper"` expected MM212 for `naplan_style` + `digital_technologies`, which
A16 now (correctly) rejects with MM229 at the offering boundary — NAPLAN
never sets Digital Technologies, so that combination stopped being "a real
offering with an empty pool" and became "not a real offering" the moment
A16 could tell the difference, which is exactly what A16 was built to do.
Fixed by pointing the test at `language` (a real NAPLAN Year 5 offering
this fixture genuinely has no content for) — commit `e1002c5`. Searched
every other RLS file that calls `create_assessment_session`
(`grep -rln create_assessment_session tests/rls`); all others use
`naplan_style` + `numeracy` (well-supported) or a private sentinel
`examStyle` outside `{naplan_style, icas_style}` (exempt from the boundary
check entirely, same as before A16), so this was the only affected fixture.

Full guard reruns after both fixes: unit 4839/4839, RLS 420/420, both green.

## Task 2 — A15: immutable config-version tables + FK-pinned sessions

**Status: Skipped — STOP-AND-DOCUMENT, genuine architectural conflict, not
an engineering gap.** Not a refusal to do the work; a specific, load-bearing
contradiction between what the task asks for and two things already on the
record (ADR-006 §1, and the Phase 0 contracts' own documented scope) that a
"build it properly now" instruction does not, by itself, resolve.

**What the task asks for vs. what exists:**

1. **ADR-006 §1 (accepted, 2026-08-12) explicitly defers this exact table
   set to Phase 3, and states why**, not just when: "a foreign key to an
   absent table is either a stub table (a second independently-maintained
   answer) or a nullable column that means nothing. A text pin recorded now
   is a true record of what the sitting ran under; Phase 3 adds the
   referential integrity when the referents exist." Building
   `framework_versions`/`blueprint_versions`/`assessment_profile_versions`
   now doesn't just move a date forward — the ADR's stated
   objection ("FK to an absent table") is actually resolved by doing so
   (the table stops being absent), which is a real, citable argument *for*
   proceeding. That much I could act on unilaterally, and would, if it were
   the only issue.

2. **It is not the only issue.** `src/schemas/platform/assessment-blueprint-
   version.schema.ts` requires every blueprint cell to declare exactly one
   `subjectId` (not optional) and exactly one of `itemCount`/`proportion`
   (spec §10.2's own "explicit matching constraints" requirement), and
   `assessment-profile-version.schema.ts` requires each profile to pin
   exactly one `programmeOfferingRefSchema` — one subject, one year, one
   style, one locale. That is the correct shape for a *curated, blueprint-
   governed paper* (what Phase 3's real assessment forms will be), and
   Task 1 (A16) now has 99 real offerings it could bind to.

   But `create_assessment_session` as it exists today (and as every Gate A
   item through A16 leaves it) is **explicitly not that**. It is a
   dynamically-filtered pool allocation: the learner picks yearLevel /
   examStyle / subject / questionCount at request time (10, 20, 30 or
   "full", up to 200), and the RPC selects whatever matches from the whole
   eligible pool. The existing placeholder name says so directly —
   `c_blueprint_version constant text := 'phase2-unblueprinted.v1'` is not a
   lazy stand-in for a real blueprint that happens to be text; it is an
   honest label for "this session was not produced under a blueprint at
   all," which the migration's own comment (20260812120000) confirms:
   "Phase 3 replaces each of these with a real reference."

   A single canonical "phase2 fixed" blueprint/profile, as the task
   describes it (one row each, reused across every session), cannot
   represent this without inventing product semantics that don't exist
   anywhere in the spec, the ADRs, or the code:
   - One profile per `programmeOfferingRefSchema` means one profile per
     Task 1 offering (up to 99), not one flat profile — or the schema's own
     "exactly one offering" constraint has to be silently violated.
   - A cell's mandatory single `subjectId` cannot represent "whatever
     subject the learner chooses this request," which is exactly what
     `subject: 'mixed'` and every other filter value mean today.
   - A cell's mandatory `itemCount`/`proportion` cannot represent
     "whatever the learner's `questionCount` parameter says," which varies
     per request, not per profile.

   Filling these in with *something* that satisfies the Zod schema (a
   sentinel subject, a proportion of 1, one profile standing in for all 99
   offerings) would not be "building the real phase2 fixed
   framework/blueprint/profile" — it would be fabricating a blueprint shape
   for a delivery model that has never had one, and then pinning every
   future session to that fiction permanently (these rows are meant to be
   immutable). That is a product decision (does Phase 2 get a real
   blueprint per offering now, or does the ad hoc pool-allocation model stay
   unblueprinted until Phase 3 as ADR-006 already decided) which this run is
   not positioned to make silently.

**What's genuinely tractable and NOT blocked:** `framework_versions` alone
(delivery mode, navigation, timing, stages, tools) describes *how a Phase 2
sitting actually behaves* accurately and completely — there is no
blueprint-shaped mismatch there. I did not build it in isolation, because
A15's own checklist wording and the task's §22 replay proof both operate at
the *profile* level (a session's `assessment_profile_version` pin), and a
framework table nothing references yet would be schema for its own sake
(spec §19.3's own "no speculative tables with no consumer" rule) rather than
progress toward A15's actual close condition.

**Recommendation for morning review:** this needs one explicit product
decision before it can proceed: either (a) Phase 2 gets real, offering-
scoped blueprints and profiles now — meaning up to 99 trivial "whole
matching pool" blueprints, one per Task 1 offering, each genuinely
representing "no further constraint beyond the offering itself" — accepting
that as real product scope rather than a placeholder; or (b) A15 is
re-scoped to something ADR-006 §1 didn't already answer differently, e.g.
hashing the *literal placeholder pin strings themselves* into an immutable,
content-addressed row (closer to "make the text pin verifiably reproducible"
than "give it referential integrity"), which wouldn't need a blueprint at
all. Either is a reasonable call; neither is this run's to make.

## Task 3 — A4 whole-data-graph erasure scope

Status: not yet started.

## Task 4 — Missing §22 proof-obligation tests

Status: not yet started.

## Task 5 — Full `npm test` completion investigation

Status: not yet started. Note: Task 1's own full-suite run (`test:ci`)
completed normally (350s, 252/252 files, 4839/4839 tests, no hang), and the
full RLS guard (`test:rls:ci`) completed normally too (420/420, ~23-31s) once
the scoring role was bootstrapped — so if the timeout Task 5 describes is
real, it is not reproducing on every run under the current guard. Needs its
own investigation as scoped; the `scoring:bootstrap` step above is worth
ruling in/out first since an unauthenticated scoring connection could itself
manifest as a hang under different retry/backoff behaviour than the fail-fast
seen here.

## Task 6 — Consolidation

Status: not yet started (this file itself is the running consolidation and
will be finalized as part of Task 6).

---

## Morning review — priority list (updated as the run proceeds)

1. **Product decision needed: A15's actual scope.** Task 2 (immutable
   config-version tables) is skipped, not done — see that section above for
   the full reasoning. Short version: ADR-006 §1 deferred this to Phase 3 for
   a stated reason that building the tables now would resolve, but the
   Zod contracts those tables would hold assume a blueprint-governed paper
   model Phase 2's actual create path has never had. Needs one of the two
   options in that section chosen before engineering resumes on A15.
2. **Local verification workflow gap:** `supabase db reset` does not
   preserve `mindmosaic_scoring`'s local dev password; any RLS run that
   scores needs `npm run scoring:bootstrap` run immediately after reset, and
   nothing currently enforces or documents that ordering. Worth adding to
   `docs/MIGRATIONS.md`'s reset instructions or wiring into a
   `postreset`-style script so this can't be missed again (it cost real time
   this run before the true cause — an auth failure, not a write bug — was
   found).
