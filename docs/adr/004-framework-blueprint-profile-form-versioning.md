# ADR-004: Framework, blueprint, profile and form versioning

- **Status:** accepted (2026-08-23, framework/blueprint/profile only —
  forms/form-versions, spec §10.4, remain undecided; see "Decision" below)
- **Date:** 2026-08-12
- **Updated:** 2026-08-23 (decision recorded — option 1)
- **Spec:** §10, §21 Phase 3
- **Phase:** 3

## Decision (2026-08-23)

**Option 1**, from "The question this ADR has to answer before Phase 2 can
touch it" below: real, offering-scoped `framework_versions` /
`blueprint_versions` (+ `blueprint_cells`) / `assessment_profile_versions`
tables now, seeded with one framework (today's fixed-path behaviour), and
one "whole matching pool, no constraint beyond the offering itself" blueprint
+ profile per `programme_offerings` row (99 today) — genuinely representing
what `create_assessment_session` already does, not a placeholder. Built in
`20260823090000`/`20260823100000`/`20260823110000`; verified against
`src/schemas/platform/` by `scripts/verify-config-versions.mts`; proof that
superseding a profile after a session pins it does not move the session's
read in `tests/rls/config-version-tables.test.ts`'s `§22 replay proof` suite.

**Scope of this decision.** Framework/blueprint/profile only. Forms and
form-versions (spec §10.4) and the capacity simulator (spec §13.4) are
explicitly the next Phase 3 steps, not built by this decision or its
migrations.

**config_pin_registry (Gate A item A15, `20260822100000`) — superseded in
meaning, not removed.** A15 content-addressed the six placeholder pin TEXT
values (`assessment_profile_version`, `framework_version`,
`blueprint_version`, `taxonomy_version`, `engine_algorithm_version`,
`scoring_algorithm_version`) precisely because this ADR had not yet decided
what a real blueprint/profile meant — see its own migration header. That
gap is now closed for three of the six: `framework_version` and
`blueprint_version` and `assessment_profile_version` have real, immutable
tables that are now the actual source of meaning, and
`assessment_sessions.assessment_profile_version_id` (20260823110000) is the
FK a reader should follow for those three going forward.

`config_pin_registry` and the composite FKs it enforces on
`assessment_sessions` are **not removed or weakened** by this decision —
doing so would edit already-applied migration behaviour for no operational
gain and would drop the one guarantee A15 gave the *unchanged* text columns
(that they can only hold a known, immutable identity). It continues to
enforce all six text pins exactly as before, unconditionally, for every
session regardless of whether the new FK also resolved. Two of the six —
`taxonomy_version` and `engine_algorithm_version` — have no Phase 3 table
yet and remain wholly on `config_pin_registry`; this decision does not
touch them.

So: **coexist in mechanism, supersede in meaning, for three of the six
kinds.** A future pass that removes the now-redundant
`framework_version`/`blueprint_version`/`assessment_profile_version` text
columns (once every reader has moved to the FK) would be the point at which
`config_pin_registry`'s coverage of those three kinds is actually retired —
not this one.

## Placeholder

Assessment configuration splits into four independently versioned things: a
**framework version** (delivery behaviour shared across profiles — mode,
navigation, timing, stage structure, submission, scoring policy, supported
question types, tool permissions, adaptive routing), a **blueprint version**
(what the assessment measures, decomposed into normalized cells queryable by
section/stage, subject, strand/skill, difficulty band, question type, cognitive
demand, stimulus requirement, marks, item count, estimated time and
machine/manual scoring eligibility), an **assessment profile version** (the
binding of programme offering + framework + blueprint + delivery mode + duration
+ scoring algorithm version + availability), and **form versions** (curated
assessments whose `assessment_form_items` pin item-version IDs with ordinal,
section/stage, marks override and blueprint-cell assignment). This ADR must
decide the versioning and supersession rules for each, how a session pins an
exact profile version rather than a mutable "current" profile, what constitutes
a breaking versus additive configuration change, and how publishing a form
snapshots it so a later item revision cannot alter an already published form.
Phase 0 defines the Zod contracts for these objects as repository assets in
`src/schemas/platform/` — discriminator plus `schemaVersion` on every one, per
spec §10.1 — without any database tables; this ADR decides the storage and
lifecycle. It must also resolve the naming collision the Phase 0 contracts flag:
the question factory's existing `blueprints/` module means "generation blueprint
for one question", which is a different concept from an assessment blueprint.

## The question this ADR has to answer before Phase 2 can touch it

An attempt (2026-08-21, product-owner-directed) to build real
`framework_versions`/`blueprint_versions`/`assessment_profile_versions`
tables now, ahead of Phase 3, and pin `assessment_sessions` to them by FK
instead of the placeholder text pins ADR-006 §1 uses today, stopped here —
not on the storage layer, which is straightforward, but on a genuine
semantic conflict this ADR is the right place to name precisely:

**`assessmentProfileVersionSchema` (and the blueprint cells it composes)
assumes a curated, blueprint-governed paper.** A profile pins exactly one
`programmeOfferingRefSchema` (one subject, one year, one style, one locale).
A blueprint cell requires exactly one `subjectId` and exactly one of
`itemCount`/`proportion`. That is the right shape for what Phase 3's real
assessment forms will be.

**Phase 2's `create_assessment_session` is not that, and has never claimed
to be.** It is a dynamically-filtered pool allocation: the learner chooses
`yearLevel`/`examStyle`/`subject`/`questionCount` at request time (10, 20,
30, or "full", up to 200), and the RPC selects whatever matches from the
whole eligible pool. The existing placeholder name says so by design —
`c_blueprint_version constant text := 'phase2-unblueprinted.v1'` — and
20260812120000's own comment: "Phase 3 replaces each of these with a real
reference." A single canonical "phase2 fixed" blueprint/profile, reused
across every session regardless of what the learner actually chose, cannot
represent a per-request subject or a per-request item count without
inventing values the Zod contracts require but no user input ever supplied
— and once written, these rows are meant to be immutable, so the invention
would be permanent.

This ADR, when it is written for real, has to choose one of (at least) two
paths, and it is the product-owner call, not an implementation detail:

1. **Give Phase 2 real, offering-scoped blueprints and profiles now** — one
   trivial "whole matching pool, no further constraint" blueprint per
   ADR-001/ADR-014 offering (up to 99 today), each genuinely representing
   "no constraint beyond the offering itself" rather than a placeholder.
   This is real product scope, not a stopgap, and needs sizing as such.
2. **Re-scope what a Phase-2 session pins** to something that does not
   require a blueprint at all — for instance, hashing the literal
   placeholder pin strings into an immutable, content-addressed row, which
   would give the text pins real referential stability without claiming
   Phase 2 sessions are blueprint-governed when they are not.

Recorded so the next attempt does not rediscover the same wall: the FK
storage layer is not what stopped this attempt — the schema's own
assumptions about what a "blueprint" is did.
