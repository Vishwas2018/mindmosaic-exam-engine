# ADR-004: Framework, blueprint, profile and form versioning

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §10, §21 Phase 3
- **Phase:** 3

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
