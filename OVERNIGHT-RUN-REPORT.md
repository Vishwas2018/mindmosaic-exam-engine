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

**Status: Done.** No schema change — a verification-coverage gap, not a
mechanism gap.

Before adding anything, audited what `erase_student` (20260815110000)
actually reaches, live: queried `information_schema` for every foreign key
targeting `profiles(id)` (33 rows, one query, not a grep) and classified
each as either child-identity (deleted or cascaded on erasure) or an actor
column (teacher/admin/parent who *performed* an action, never the child
being erased — correctly untouched). Every child-identity table turned out
to already be mechanically covered, either by an explicit `delete` in
`erase_student` or by `on delete cascade` from `profiles`/`assessment_
sessions`/`exam_attempts`, which `erase_student` deletes explicitly. The
gap external review #8 points at is real but narrower than "erase_student
doesn't reach these tables" — it's "nothing had ever seeded a row in
`assignment_students`, `class_students`, `manual_marks`, `essay_marks` or
`session_ui_state` and checked it was gone afterward." Those claims were
true by code inspection, never proven by a running test.

Also found, via the same audit, that `outbox_events` — one of spec §17.5's
named surfaces ("outbox/job payloads") — genuinely exists in this schema
(`session_id` cascades from `assessment_sessions`) but has never been
written to (`-- outbox_events — created, unwritten (§15.2, §19.3)`); correctly
wired, currently and honestly empty. `caches`, `exports`, `search index` and
fine-grained telemetry do not exist anywhere in `supabase/migrations/`
(confirmed by source grep) — ADR-012 §6 already says this about telemetry
("none yet — n/a"), and the same is now true of the other three. Nothing to
seed, nothing to erase, nothing to fake.

**What was built:** `tests/rls/resolution-rule.test.ts`, new describe block
5 (two tests):
1. Seeds real rows in every previously-unverified child-identity table for
   `STUDENT_A` — including a second, non-terminal session specifically for
   `session_ui_state` (its own trigger refuses a write to the terminal
   session `createTargetSitting`'s fixture normally leaves, correctly, for
   every role — so a genuinely active sitting was the honest way to get a
   real row there, not a workaround). Asserts every seeded surface is
   non-zero *before* erasure (a fixture bug that seeded nothing would
   otherwise pass the "after" assertion vacuously) and zero *after*.
2. A durable regression guard: queries `information_schema` for every live
   FK to `profiles(id)` and fails if the set doesn't match a maintained
   allowlist of child-identity + actor columns — so a future migration that
   adds a new table naming a child directly fails this test immediately,
   rather than shipping an untaught link silently.

**Not done, deliberately:** no legal-hold mechanism (ADR-012 §8 already
defers this, correctly — pre-production, nothing to hold), no automated
sweep for the 30-day/12-month/90-day retention windows (ADR-012 §7's own
tracked follow-up, orthogonal to erasure-on-request), no backup-controls
(ADR-012 already states plainly that nothing in this repository controls
backups — restated here, not newly claimed as solved).

**Gates:** tsc clean · lint clean · unit 4839/4839 · RLS 422/422 (420 + 2
new) · `next build` clean · fresh `supabase db reset` (no new migration —
test-only change) · migration-registry 35/35 ok (unchanged) · `graphify
update` run.

## Task 4 — Missing §22 proof-obligation tests

**Status: Audited, nothing to add.** Not a shortcut — checked each obligation
the task itself named as an example, plus the ones Task 1/3 newly made
buildable, against the actual test suite before writing anything, and every
one turned out to already have real, specific coverage:

- **"Historical content cannot drift" (revise an item, replay an old
  session, identical result)** — `tests/rls/assessment-scoring.test.ts`
  line 469, `"scores an old sitting against the revision it served, not the
  current one"`, under the `"determinism and version pinning (§14.2, §22)"`
  describe block. Exactly this proof, already named for §22 in its own
  comment.
- **"Learners cannot forge scores" (attempt direct score/result
  insertion)** — `tests/rls/assessment-session-model.test.ts` line 248,
  `"refuses a forged result — a learner cannot write their own score"`, plus
  a full grant/RLS-policy sweep on `assessment_results` and
  `session_responses` in the same file (lines 172-307).
- **"The raw answer never leaves the scoring module" (DTO contract test,
  log scan, import-boundary check on the scoring credential)** —
  `src/tests/unit/scoring-module-boundary.test.ts`, in full: the credential
  named nowhere outside the one module, no fallback to another credential,
  server-only guard, unreachable from any `"use client"` file or barrel
  re-export, no `console.*` call anywhere in the module, no exported type
  carrying an answer field, and no file outside the module querying
  `item_answer_versions` at all. More rigorous than what I would have
  written for this task.
- **"Cross-user data cannot leak" (two-student isolation)** — not one
  dedicated suite, but pervasive: `STUDENT_A`/`STUDENT_B` isolation is
  asserted directly in the majority of `tests/rls/*.test.ts` files (e.g.
  `assessment-session-model.test.ts` line 341, `"hides another student's
  session and result"`), which is the same guarantee a single consolidated
  suite would prove, distributed at the point each surface is introduced
  rather than centralized.
- **"Migrations cannot silently drift" (migration registry, fresh apply +
  live verification)** — `src/tests/unit/migration-registry.test.ts` plus
  the `migrations:status`/`migrations:record` mechanism itself (exercised
  live in every task's own DoD gate this run, including this one).
- **"Runtime publication mirrors the real factory" (published-only
  projection)** — closer inspection changed what this needed to mean:
  `load-manifests.ts` reads only from `content/question-factory/published-
  manifests/`, a directory the factory's own publish step populates, so the
  projector has no state field to filter and "attempt every non-published
  `CANDIDATE_STATES` value" doesn't map onto a projector-level test at all.
  The real guarantee lives at the factory's publish gate instead, and it is
  covered: `src/tests/unit/question-factory/publication.test.ts` refuses a
  candidate that finished the pipeline but was never staged, one only just
  ingested, and — unconditionally — a deterministic-fixture-generated one
  even after reaching `staged`.
- **Offering authority** — Task 1's own `tests/rls/programme-offering-
  authority.test.ts` (17 cases).
- **Config replay** — blocked on Task 2, which is itself blocked (see
  above); genuinely not buildable until that product decision lands.

**Correctly out of scope, per the task's own "do not stub or fake" rule:**
adaptive capacity simulation, adaptive accessibility-sufficiency review,
adaptive enemy-set conflict metadata, forced-reuse explainability under
adaptive routing, cross-organization isolation (organizations don't exist —
ADR-013/Phase 6), published-forms drift (forms don't exist — Phase 3),
taxonomy-version replacement (single fixed taxonomy pin today, nothing to
replace yet). None of these have an honest test to write against the
current codebase.

## Task 5 — Full `npm test` completion investigation

**Status: Could not reproduce across four full runs today. Not forcing a
fix, per the task's own instruction — reporting findings and stopping here.**

Four independent full-suite runs today, all clean, all exiting on their own
(no hang, no `--forceExit` needed, no manual kill):

| Run | Command | Result | Wall time |
| --- | --- | --- | --- |
| 1 | `npm run test:ci` (guarded, Task 1) | 252/252 files, 4839/4839 tests | 350.0s |
| 2 | `npm run test:ci` (guarded, Task 3) | 252/252 files, 4839/4839 tests | 236.7s |
| 3 | `npm test` (unguarded, plain `vitest run`) | 252/252 files, 4839/4839 tests | 218.5s |

(A fourth, `npm run test:rls:ci`, is the RLS guard, not the unit suite, but
completed cleanly too — 420-422/420-422 across three runs today, 19-31s
each.)

All three unit-suite wall times fall inside or near the task's own quoted
"~124-304s" range, and none of them hung, timed out, or required
intervention — `timeout 400 npm test` (a hard external timeout wrapper)
returned exit code 0 on its own well before the 400s ceiling. The plain
`vitest run` invocation (no guard script involved at all) also exited
cleanly, which rules out "the guard itself is what makes it hang."

**What this does and doesn't tell us:** it does not mean the problem Task 5
describes is imaginary — four green runs on one machine, one afternoon, is
not proof a flake class doesn't exist, especially one already documented
elsewhere in this checklist as real (A12's own note: "one worker-fork flake
on first attempt, clean on immediate retry — the same known flake class
`verify-test-run.mts` exists to catch"). It does mean I have no reproduction
to root-cause against, and the task is explicit that guessing at a fix
without one is the wrong move: "If the cause is unclear or a fix would be
risky/fragile, DO NOT force it." Recommending this be re-attempted on
whatever machine/CI environment originally observed the non-completion,
ideally with the exact command and any partial output captured, since that
is the one piece of evidence this run's clean repro attempts cannot supply.

## Task 6 — Consolidation

**Status: Done.**

- `docs/phase2-cutover-readiness-checklist.md`: A16 row closed with full
  evidence and the convergence note; a new top-of-file pointer to this
  report; A4's row extended with the whole-graph proof. **Gate A status is
  unchanged by this run**: A9-A13 remain closed, A14 (manifest-gate
  reconciliation) and A15 (config-pin reproducibility) remain open,
  product-owner decisions, exactly as before. A16 is additional hardening
  and was never one of the seven items Gate A's own closure criteria
  depends on — see that row's note for why. **Gate A is not engineering-green
  after this run** (it was not claimed to be; the overnight prompt's framing
  that "A14/A15 were the last two" conflated this run's programme-offering
  work, filed as A16 per the earlier explicit decision, with the checklist's
  actual, unrelated A14).
- `docs/adr/014-programme-offering-authority.md` (new, **accepted**): the
  full decision record for A16 — context, decision, consequences,
  alternatives considered, verification. Mirrors ADR-001's own structure.
- `docs/adr/004-framework-blueprint-profile-form-versioning.md` (updated,
  still **proposed** — not accepted, honestly left as such): replaced the
  one-paragraph placeholder with a concrete, named blocking question —
  exactly the blueprint/profile semantic conflict Task 2 hit — and two
  real options for whoever picks it up next, so the next attempt does not
  rediscover the same wall from a cold start.
- `docs/HANDOFF.md` does not exist in this repository (checked: no file at
  that path, no similarly-named file anywhere under `docs/`). Not created
  from scratch — this report plus the checklist already serve as the single
  current-state document this run's own closing instruction asks for
  ("OVERNIGHT-RUN-REPORT.md as the single place I read first"), and adding
  a second, overlapping doc artifact the codebase has never used would be
  scope the task didn't actually need.

### Final gate results (this run's last full verification pass)

| Gate | Result |
| --- | --- |
| `tsc --noEmit` | Clean |
| `eslint .` | Clean |
| Unit suite (`test:ci`, guarded) | 252/252 files, 4839/4839 tests |
| RLS suite (`test:rls:ci`, guarded) | 26/26 files, 422/422 tests |
| `next build` | Clean |
| Fresh `supabase db reset` | 35/35 migrations applied, no drift |
| Migration-registry verification | 35/35 `ok` |
| `graphify update` | Run after every code change |

### Every commit this run made, in order

1. `82680aa` — feat(taxonomy): build A16 canonical programme-offering
   authority, retire A11's inline shim
2. `8e1b4d6` — docs(checklist): close A16, start overnight run report
3. `e1002c5` — fix(tests): update assessment-session-create fixture for
   A16's stricter offering boundary
4. `6ebf6bf` — docs: correct Task 1 report — scoring role auth, not a code
   regression
5. `8034e8a` — docs(overnight): skip Task 2 (A15 config-version tables) —
   genuine ADR conflict
6. `9e13f31` — test(erasure): prove erase_student reaches the whole
   child-identity graph (A4)
7. `153e56a` — docs(overnight): Task 4 audit — §22 obligations already
   covered, nothing to add
8. `3eead59` — docs(overnight): Task 5 — could not reproduce full-suite
   non-completion
9. *(this commit)* — docs(overnight): Task 6 consolidation — ADR-014,
   ADR-004 update, checklist Gate A summary, final report

Nothing pushed. Cohort unchanged: `enabled=false, cohort_mode='off'`
throughout, in every environment this run touched (each RLS test's own
transaction rolls back; the only committed-fixture suite,
`target-sitting-end-to-end.test.ts`, restores the flag to off in its own
`afterAll` and asserts it in its own last test).

## Morning review — final priority list

1. **Product decision needed: A15's actual scope** (Task 2). Two concrete
   options recorded in this file's Task 2 section and in the freshly
   substantive `docs/adr/004-framework-blueprint-profile-form-versioning.md`.
   Not an engineering gap — the storage layer was never the blocker.
2. **Product decision needed: A14's actual scope** (the checklist's real
   A14, manifest-gate reconciliation) — untouched by this run, still exactly
   as it was: dual-provenance in the spec, or route curated content through
   the manifest process. Not attempted this run because it is explicitly
   scoped as a product-owner decision in the checklist itself, independent
   of everything this run's tasks covered.
3. **Local verification workflow gap:** `supabase db reset` does not
   preserve `mindmosaic_scoring`'s local dev password; run
   `npm run scoring:bootstrap` immediately after every reset, before any
   RLS suite that scores. Worth documenting in `docs/MIGRATIONS.md` or
   wiring into a `postreset`-style script.
4. **Task 5's non-completion symptom did not reproduce** across four runs
   today. Not fixed, not disproven — needs the environment that originally
   saw it, ideally with captured partial output, since a clean local repro
   has nothing to root-cause against.
5. **Nothing else in this run needs a decision.** Task 3 (A4 whole-graph
   erasure proof) and Task 4 (§22 audit) are both genuinely closed, with
   evidence, no open questions attached.

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
