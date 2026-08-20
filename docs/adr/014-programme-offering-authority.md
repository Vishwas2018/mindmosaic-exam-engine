# ADR-014: Programme-offering authority as reference tables

- **Status:** accepted
- **Date:** 2026-08-21
- **Spec:** §6.2, §6.3, §6.4, §22
- **Phase:** 2

## Context

ADR-001 established the *TypeScript* authority for offering validity —
`year-registry.ts`'s `EXAM_STYLE_YEAR_LEVELS` and `subject-registry.ts`'s
`isSubjectSatIn()` — and left the database projection of that authority for
later. Gate A item A11 (`supabase/migrations/20260821090000_target_selector_
canonical_offering.sql`) closed a real bug in the meantime: `create_
assessment_session` compared the raw `subject` config filter straight
against `item_versions.source_subject` with none of `REGISTRY_SUBJECT_BY_
FILTER`'s mapping applied, so a `language` paper selected zero items, and it
never checked whether the requested `(examStyle, yearLevel)` pair was a real
sitting at all.

A11's fix was a hand-restated SQL mirror of both TypeScript constants,
kept honest only by `tests/rls/target-selector-offering.test.ts` reading the
TS source at test time and asserting the two agreed — a real fix, but not
the authority spec §6.2-§6.4 describes: "assessment families and programmes
SHOULD use stable text identifiers backed by reference tables," and "the
database MUST enforce uniqueness" for the programme offering tuple. A11 left
that database-side authority unbuilt; the RPC still carried the only copy of
the rule, restated as literal `IF` branches and a `CASE` expression rather
than read from a table.

Independently, and concurrently, `feat/assessment-capability-expansion`
(migration `20260820090000`, not part of this branch's own history) built
`assessment_families`, `programmes` and `programme_offerings` for its own
purpose — six speculative families (`mathematics_competition`,
`selective_entry`, `singapore_curriculum`, `curriculum_practice` plus the two
real ones) and six programmes under them, with no `subjects` table and no
seeded offering rows. That branch does not touch NAPLAN or ICAS offerings at
all; it was building toward its own expansion content, not retiring A11's
shim.

## Decision

1. Four reference tables — `subjects`, `assessment_families`, `programmes`,
   `programme_offerings` — are the single database authority for offering
   validity, per spec §6.2-§6.4. All four use stable TEXT identifiers, never
   PostgreSQL enums (ADR-001 clause 6, restated for the same reason: an enum
   addition cannot run inside a transaction with data changes and cannot be
   reverted cleanly). `programme_offerings` enforces uniqueness on
   `(programme_id, subject_id, year_level, locale, region)`.

2. **Designed as a superset of `feat/assessment-capability-expansion`'s own
   shape, not a competitor.** The same six families and six programmes that
   branch seeds are reproduced verbatim here under `on conflict do nothing`,
   so applying both migrations in either order leaves identical data; a new
   `subjects` table is added (that branch's `programme_offerings.subject_id`
   carried no foreign key at all) and `programme_offerings.subject_id`
   references it — a strengthening that branch's own rows (there are none
   yet) cannot violate. When that branch rebases onto this one, its `create
   table` statements for these three tables and their seed `insert`s become
   no-ops to delete; everything downstream in that branch (media assets,
   item groups) is unaffected. See the migration's own header
   (`supabase/migrations/20260822090000_programme_offering_authority.sql`)
   for the line-level detail.

3. **Seeded for the two real styles**, from `EXAM_STYLE_YEAR_LEVELS` ×
   `SUBJECT_REGISTRY`, restated as literal SQL under the same "SHARED WITH
   TS, NOT IMPORTED FROM IT" discipline A11 established — Postgres cannot
   import a TypeScript module, so the seed is kept honest by
   `tests/rls/programme-offering-authority.test.ts`, which computes the same
   set from the TS registries at test time and asserts the table matches
   exactly. Two new programmes, `naplan_style_practice` and
   `icas_style_practice`, exist for this — the two real families had no
   programme of their own before this ADR, only an assessment-family row.

4. **`create_assessment_session` retires A11's inline mirror.** The subject
   filter resolves through `public.subjects` (by `id`, or by
   `selection_filter_alias` for the one pair the two vocabularies disagree
   on — `language` → `language_conventions`) instead of a hardcoded `CASE`.
   The offering boundary is two `exists()` queries against
   `programme_offerings` instead of two hardcoded `IF` branches. No inline
   mapping remains in the function body — the source of truth is now the
   table, and the RPC reads it directly, matching the target model every
   other authority-bearing query in this schema already uses.

5. **The boundary is strengthened beyond what A11 checked.** A11 validated
   only `(examStyle, yearLevel)`. Because `programme_offerings`' natural key
   already includes `subject_id`, there is no reason not to use it: a real
   `(examStyle, yearLevel)` pair with a subject that style never sets — NAPLAN
   Science, ICAS Digital Technologies past Year 7 — now fails MM229 at the
   boundary instead of falling through to MM212's generic "no eligible
   content," indistinguishable from a genuine coverage gap. An unrecognised
   subject filter (not a `subjects.id` or alias at all) still falls to
   MM212 unchanged — MM229 is reserved for combinations the table can name as
   invalid, not garbage input it has never heard of.

6. **Reference tables are read-appropriate, not learner-writable — meaning
   RLS-enabled with zero grants to `anon`/`authenticated`,** matching the
   posture `platform_flags` and `item_versions` already use in this schema,
   and matching `feat/assessment-capability-expansion`'s own choice for
   these exact three table names. Nothing user-facing reads these tables
   directly today; `create_assessment_session` (SECURITY DEFINER, runs as
   owner) is the only reader. "Read-appropriate" therefore means read
   happens through that boundary, not through a raw table grant a learner's
   session could use to enumerate every programme/offering ahead of a real
   catalogue surface.

7. **Validity stays separate from readiness**, per ADR-001 clause 7 and spec
   §6.3: this migration adds nothing that counts published items.
   `programme_offerings` says a sitting exists; `src/features/taxonomy/
   coverage.ts` still says whether content exists for it. Publishing content
   cannot make an invalid combination valid; an empty pool cannot make a
   real sitting disappear from planning.

## Consequences

- A11's own migration-registry checks (`scripts/migrations/registry.ts`,
  entry `20260821090000`) asserted the literal text this migration retires,
  and would fail forever once this migration applies — every environment
  going forward, since both are committed. Those checks are updated in place
  to assert the current mechanism (`public.subjects`, `programme_offerings`,
  absence of the old literals) rather than the specific text A11 happened to
  write; A11's own RLS suite is unchanged and still green, because the
  *behaviour* it proves is still true, only the *mechanism* moved.
- `assessment-session-create.test.ts`'s "refuses a scope with no eligible
  content" fixture used `naplan_style` + `digital_technologies` to exercise
  the MM212 path — a combination that stopped being a content gap and
  became an invalid offering the moment this ADR's clause 5 could tell the
  difference. Repointed at `language`, a real NAPLAN Year 5 offering the
  fixture genuinely has no content for.
- The next config-version work (a real `assessment_profile_version`) has a
  real `programme_offerings` row to reference instead of inventing its own
  notion of "which offering." See ADR-004 for why that work is not yet
  unblocked by this ADR alone.

## Alternatives considered

- **Leave A11's mirror as-is, since it is already correct.** Rejected: spec
  §6.2-§6.4 asks for reference tables, not a correctly-restated literal; and
  every future consumer of "is this a real offering" (a catalogue, an admin
  screen, `feat/assessment-capability-expansion`'s own eventual NAPLAN/ICAS
  work) would otherwise have to either re-derive the TS registries itself or
  add a third copy of the same rule.
- **Wait for `feat/assessment-capability-expansion` to merge, then build on
  its tables.** Rejected: that branch is untracked/concurrent (Gate B item
  B5), has no seeded NAPLAN/ICAS offerings, and gating A11's real retirement
  on an unmerged branch's timeline would leave the hardening this ADR closes
  indefinitely deferred. Building the superset now and documenting the
  convergence path is available immediately and costs that branch nothing at
  rebase time.
- **Fold `subject_id` validation into `programmes`/`assessment_families`
  instead of a new `subjects` table.** Rejected: spec §6.4 names subjects as
  their own dimension with their own stable identifiers, and
  `feat/assessment-capability-expansion`'s unconstrained `subject_id` text
  column is exactly the gap ADR-001 clause 6 already warned a stable-id
  reference table closes.

## Verification

- `tests/rls/programme-offering-authority.test.ts` — seeded-set parity
  against `EXAM_STYLE_YEAR_LEVELS`/`SUBJECT_REGISTRY`, every valid offering
  incl. `language` still routes, three new invalid-combination rejections
  (NAPLAN Y4, NAPLAN Science, ICAS Y10 Digital Technologies), the
  unrecognised-subject-filter regression, and the read-appropriate/
  not-learner-writable privilege proof.
- `tests/rls/target-selector-offering.test.ts` — A11's own suite, unchanged
  and still green, proving the behavioural guarantee survived the mechanism
  change.
- `scripts/migrations/registry.ts` — updated checks for `20260821090000`
  plus new checks for `20260822090000`, verified against a fresh `supabase
  db reset` with no drift (35/35 migrations).
