# ADR-001: Canonical years, assessment families, programmes, and programme offerings

- **Status:** accepted
- **Date:** 2026-08-12
- **Spec:** §6 (canonical product dimensions), §7 (sources of truth), §21 Phase 0
- **Phase:** 0

## Context

### Year level

The repository already implements the canonical product range. `YEAR_LEVELS =
[1..12]` lives in `src/features/taxonomy/year-registry.ts:20`, and the same
module holds `EXAM_STYLE_YEAR_LEVELS` (`:38`), which is authoritative for which
assessment styles are actually sat at which years — NAPLAN-style at Years 3, 5,
7, 9; ICAS-style at Years 2–12. Spec §6.1 names this module explicitly and
instructs implementers to consume it rather than build a second matrix.

That registry was introduced by expansion-plan T0a precisely because "year level"
had previously meant `3 | 5` in roughly a dozen independent places. The
consolidation was largely, but not entirely, completed. As of this ADR the
surviving narrow year lists are:

| Location | Value | Classification |
| --- | --- | --- |
| `src/features/taxonomy/year-registry.ts:20` | `[1..12]` | **Canonical product range.** |
| `src/schemas/question.schema.ts:23` | `YEAR_LEVELS = [3, 5]` | **Obsolete duplicate export.** Name-collides with the registry. Zero real consumers: its only reference was a re-export from `src/features/exam-engine/types/question.ts:6`, which nothing imported. It is *not* the schema's validation authority — `yearLevelSchema` (`:48`) already accepts Years 1–12. |
| `src/features/auth/provision-child.ts:75` | `PERSISTABLE_YEAR_LEVELS = [3, 5]` | **Deliberate persistence gate.** Mirrors the live `profiles_year_level_check` constraint, verified against `pg_constraint` rather than assumed. Documented at `:56-74`. |
| `src/features/landing/content.ts` `coveredYears` | per-programme | **Display data.** A programme's declared year range, capped to what it can actually serve, so an "available" AMC-style programme does not read as available at Year 4. |
| `src/features/question-factory/taxonomy/entries.ts` `yearLevels` | per-skill | **Curriculum data.** Values vary per entry (`[6]`, `[3,4]`, `[5,6]`, `[3,4,5,6]`). This is the year span of one skill, not a product range. Already cross-checked against the registry by `taxonomy/validate.ts:107`. |

### Valid versus ready

Spec §6.3 requires validity and readiness to stay separate. That split already
exists and is load-bearing:

- **Valid** — derived from `year-registry.ts` (does this style/year sitting
  exist?) plus `subject-registry.ts` (does this subject run at this year under
  this style? — `isSubjectSatIn`).
- **Ready** — computed in the server-only `src/features/taxonomy/coverage.ts`,
  which counts eligible questions in the gated bank per (year, style, subject)
  cell against `GATED_COVERAGE_THRESHOLD = 30`.

The docblock at `coverage.ts:15-36` states why they must not be merged:
collapsing them would let publishing content make "NAPLAN-style Year 4" look
valid, or let an empty bank make a real sitting vanish from planning. That is
exactly spec §6.3's requirement, already satisfied.

### Families, programmes, offerings

`ExamStyle` (`naplan_style | icas_style`) is today's assessment-family axis. The
spec's third family, `curriculum_practice`, is not yet represented. "Programme"
exists informally in `src/features/catalogue/` as `PROGRAMS` with an optional
`scope: { yearLevel, examStyle, subject }`, and `resolveProgramStatuses()`
(`coverage.ts:179`) promotes a scoped `coming_soon` programme to `live` when its
cell clears the threshold. There is no `programme_offering` concept and no
locale axis at all; content is implicitly `en-AU` (`metadata.locale`).

## Decision

1. `src/features/taxonomy/year-registry.ts` `YEAR_LEVELS` **is** the sole
   product-range year authority. No module MAY export a second constant that
   claims to define which years the product supports, in code, SQL or content.
   The database representation MUST be `smallint check (year_level between 1 and
   12)` (spec §6.1) — never a UUID lookup whose only content is the number.

2. `EXAM_STYLE_YEAR_LEVELS` **is** the sole authority for valid style/year
   sittings. Any new family added under clause 6 MUST add its row here rather
   than carry its own year list.

3. A narrower year list MAY exist only when it is a **named gate** that
   documents what it gates and cites this registry. Specifically:
   - `PERSISTABLE_YEAR_LEVELS` (persistence gate) is retained. It MUST continue
     to state that it mirrors a database constraint and MUST NOT be read as the
     product's supported years.
   - `SUPPORTED_CONTENT_YEAR_LEVELS` (content-availability gate, renamed from
     the obsolete `YEAR_LEVELS` in `question.schema.ts` — see clause 4) is
     retained on the same terms.
   - Per-programme `coveredYears` and per-skill `entries.ts` `yearLevels` are
     **data**, not gates, and are out of scope for consolidation. They are
     already validated against the registry where a validity question arises.

4. The duplicate `YEAR_LEVELS = [3, 5]` export in `src/schemas/question.schema.ts`
   MUST be renamed `SUPPORTED_CONTENT_YEAR_LEVELS` and documented as a
   content-availability statement — "these are the years the shipped bank
   actually holds" — never as the supported product range. It MUST NOT be
   derived from the registry by a runtime import: `question.schema.ts` →
   `year-registry.ts` would close a module cycle, because `year-registry.ts`
   already imports `ExamStyle`/`YearLevel` from the schema and
   `subject-registry.ts` (imported *by* the schema) imports the registry. That
   type-only edge is erased at runtime; a value edge would not be. The
   registry relationship is therefore enforced by regression test
   (`src/tests/unit/year-authority.test.ts`), which asserts both that the gate
   is a subset of `YEAR_LEVELS` and that it equals the distinct year levels
   actually present in the published bank.

5. **Locale is a first-class axis of the offering, and content is NOT assumed
   locale-neutral.** A translated or locale-adapted question is a **distinct
   `item_version`**, not a locale-tagged field on a shared version, and it is
   scoped to the locale-specific offering through `item_scopes`. Consequently:
   - `item_versions` MUST NOT carry a `translations` map, a `locale_variants`
     array, or any other structure that stores two locales' learner-visible
     content in one row.
   - Two locales' renderings of "the same" question MAY share an `items` row
     (stable identity) and MUST NOT share an `item_versions` row.
   - A locale change MUST produce a new content hash and a new version, exactly
     as a prompt edit does (ADR-003 §2).
   - Reading difficulty, idiom, currency, measurement convention and
     accessibility text are all locale-sensitive; treating them as neutral would
     silently deliver an unreviewed item. Locale therefore participates in the
     offering key, not in item content.

6. A **programme offering** is the tuple `programme × subject × year_level ×
   locale`, and the database MUST enforce its uniqueness. Assessment families
   and programmes MUST use stable text identifiers backed by reference tables.
   Extensible business identifiers MUST NOT use PostgreSQL enums, because adding
   a value to a Postgres enum is a schema migration that cannot run inside a
   transaction alongside data changes and cannot be reverted cleanly.

7. **Valid and ready remain separate**, with the existing modules keeping their
   current roles: validity from `year-registry` + `subject-registry`, readiness
   from the server-only `coverage.ts`. Phase 1+ database projections MUST
   preserve this semantic split and MUST NOT introduce a second, independently
   maintained rule set. Publishing content MUST NOT make an invalid combination
   valid; an empty pool MUST NOT remove a valid combination from administrative
   planning.

8. Readiness becomes **delivery-mode-specific** in Phase 3 (spec §21). Until
   then `GATED_COVERAGE_THRESHOLD = 30` remains the single fixed-path readiness
   bar, and it MUST stay tied to the largest sitting length the configurator
   offers so the catalogue and the reachability suite cannot disagree about what
   "ready" means.

## Consequences

- Widening the product's year range is a one-line change in one file, and every
  derived surface (blueprint slugs, selection config, coverage walk, subject
  spans, configurator labels) follows automatically.
- Widening what a *parent can save* still requires a `profiles_year_level_check`
  migration first. The application and the database genuinely disagree today and
  the database wins; `PERSISTABLE_YEAR_LEVELS` is the honest record of that, not
  an oversight to be deleted.
- Clause 5 costs storage and authoring effort: a full second item version per
  locale rather than a translation field. That is the intended trade. It buys
  per-locale review evidence, per-locale content hashing, and the ability to
  publish `en-AU` while `en-GB` is still in review — none of which a shared row
  can express.
- Clause 6 forbids `create type assessment_family as enum (...)`. Reference
  tables with text primary keys and foreign keys are the required shape.
- No competing product-range year source remains after this ADR's clause 4 is
  applied, which is the Phase 0 exit gate.

## Alternatives considered

- **Build a new canonical year/offering registry and migrate onto it.**
  Rejected: spec §1.1 explicitly treats `year-registry.ts` as existing
  infrastructure, not work to recreate, and a parallel registry is the exact
  failure the T0a consolidation was performed to end.
- **Delete `YEAR_LEVELS = [3, 5]` outright** (it has no consumers). Rejected in
  favour of renaming: the fact that the shipped bank holds only Years 3 and 5 is
  true, non-obvious, and worth asserting in a test. Deleting the constant would
  discard a checkable fact; renaming it converts a hazard into a guard.
- **Move the content gate into `year-registry.ts`** so all year constants sit in
  one module. Rejected: the registry's stated contract is that it holds facts
  about assessments which "never change because of what we have written"
  (`coverage.ts:21-23`). A content-availability constant would break that
  contract for a filing convenience.
- **Locale as a column on `item_versions`, content assumed neutral.** Rejected —
  see clause 5. It is the cheaper model only until the first genuinely
  locale-sensitive item, at which point it has already shipped unreviewed
  content.
- **A `locale` on the session instead of the offering.** Rejected: the offering
  is what uniqueness and readiness are computed over, so a locale outside it
  would let a "ready" offering serve items no one reviewed in that locale.

## Verification

- `src/tests/unit/year-authority.test.ts` — source-scans `src/` and asserts
  exactly one exported product-range `YEAR_LEVELS`, in `year-registry.ts`
  (clause 1); asserts the content gate is a documented subset and matches the
  bank (clause 4).
- `src/tests/unit/year-registry.test.ts` — pins the style/year matrix and the
  "NAPLAN-style Year 4 is a validation error" gate (clause 2).
- `src/tests/unit/coverage-registry.test.ts` — pins the valid/ready split:
  cells exist only for real sittings, absent rather than present-and-zero
  (clauses 7, 8).
- `src/tests/unit/subject-registry.test.ts` — pins subject spans against the
  registry range.
