# Architecture Decision Records

This directory holds the decision records required by
[`docs/spec/scalable-assessment-platform-spec-v1.md`](../spec/scalable-assessment-platform-spec-v1.md)
§23. It was created by Phase 0 (§21); before Phase 0 this repository had no ADR
convention, and design rationale lived in module docblocks and migration comments.

Those docblocks are not being replaced. They remain the right place for "why is
this function written this way". An ADR is for a decision that **spans modules,
constrains future work, and would be expensive to reverse** — the kind of thing a
docblock cannot hold because no single file owns it.

## Convention

- One file per decision, named `NNN-kebab-case-title.md`, numbered to match the
  §23 list. The numbering is fixed by the spec; do not renumber.
- Copy [`000-template.md`](000-template.md) to start a new one.
- Status is one of:
  - `proposed` — written down, not yet agreed. Carries no authority.
  - `accepted` — agreed. Code and migrations MUST conform.
  - `superseded by ADR-N` — kept for the record; never edited except to add the
    supersession line.
- An accepted ADR is **append-only**. Correcting it means a new ADR that
  supersedes it, so the reasoning trail survives.
- A phase is not done until the ADRs it touches are updated (spec §25.10).

## Status

| ADR | Title | Status |
| --- | --- | --- |
| [001](001-canonical-years-families-programmes-offerings.md) | Canonical years, assessment families, programmes, programme offerings | accepted |
| [002](002-git-authoring-source-vs-supabase-runtime-projection.md) | Git authoring source vs Supabase runtime projection | accepted (+ Phase 1 amendments A, B) |
| [003](003-immutable-item-answer-stimulus-versioning.md) | Immutable item/answer/stimulus versioning | accepted (+ amendments A, B) |
| [004](004-framework-blueprint-profile-form-versioning.md) | Framework, blueprint, profile and form versioning | proposed |
| [005](005-legacy-exam-table-cutover.md) | Legacy `exam_*`/`essay_marks` cutover, backfill, rollback, retirement | accepted (§2 superseded by ADR-006 C) |
| [006](006-normalized-session-item-and-response-model.md) | Normalized session-item and response model | accepted (+ amendments A, B, C) |
| [007](007-fixed-path-vs-adaptive-mst-delivery.md) | Fixed-path vs `adaptive_mst` delivery mode | proposed |
| [008](008-adaptive-stage-transition-and-concurrency.md) | Adaptive stage transition and concurrency contract | proposed |
| [009](009-exposure-enemy-sets-and-reuse-policy.md) | Exposure keys, enemy sets, no-repeat window, forced reuse | proposed |
| [010](010-capacity-gate-and-accessibility-sufficiency.md) | Capacity-gate and accessibility-sufficiency thresholds | proposed |
| [011](011-adaptive-reporting-and-calibration-claims.md) | Adaptive reporting and calibration claims | proposed |
| [012](012-child-data-retention-erasure-and-legal-hold.md) | Children's data retention, erasure, de-identification, legal hold | proposed |
| [013](013-organization-membership-and-rls-model.md) | Organization membership and RLS model | proposed |

ADRs 001–003 were Phase-0-blocking (§21) and are written in full. ADRs 004–013
are one-paragraph placeholders that fix scope and the questions to answer; they
are deliberately `proposed`, and §24 defers several of their decisions
explicitly. Until each is accepted, the spec's default applies: fixed-path
delivery and conservative learner-facing claims.

## Companion documents

- [`phase0-legacy-session-inventory.md`](phase0-legacy-session-inventory.md) —
  the §12.7 step 1 dependency inventory. Not an ADR: it is the frozen contract
  ADR-005 and Phase 2 are written against.

## Amendments

An accepted ADR is append-only, so a decision that survives contact with
implementation is recorded as a dated **Amendment** section at the end of the
file rather than by editing the clauses above it. Phase 1 added three:

- **ADR-002 A** and **ADR-003 A** — only the 288 factory items have publication
  manifests, so `publication_manifest_id` is nullable and every version carries
  a `provenance_class` discriminator. The exit gate reads "every published item
  matches a governed *source*", not "a manifest".
- **ADR-002 B** — `item_scopes`/`item_skills` deferred to Phase 1b, because
  `programme_offerings` and `taxonomy_nodes` do not exist and stubbing either
  would create a second answer to a question ADR-001 §7 already assigns to
  `year-registry.ts` and `subject-registry.ts`.
