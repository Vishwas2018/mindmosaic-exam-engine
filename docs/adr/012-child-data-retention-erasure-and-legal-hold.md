# ADR-012: Children's data retention, erasure, de-identification and legal-hold ownership

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §17.5, §25.11
- **Phase:** cross-cutting (blocking for institutional launch)

## Placeholder

The platform's subjects are children, and its records are their assessment
performance. This ADR must name the retention owner for each category of child
data, the retention period, the expiry or deletion behaviour, the export
behaviour, and the erasure semantics — including what erasure means for data
that has already been aggregated into analytics projections, and for immutable
evidence that other guarantees depend on. It must decide where de-identification
is used instead of deletion and what makes de-identification irreversible in
practice rather than in intent, given that a small cohort plus a timestamp plus a
score distribution can re-identify. It must define legal hold: who can place
one, what it suspends, and how a held record is distinguished from one that
merely failed to expire. Spec §25.11 makes this concrete for every new field: no
child-data field may ship without a declared purpose, retention owner,
expiry/deletion behaviour, export behaviour and an erasure test. That rule
applies from Phase 1 onward, so this ADR gates every phase that adds child data
even though it is not itself a phase deliverable. The existing parent-child
linkage (`parent_children`, `is_parent_of`) and provisioned student profiles
(`src/features/auth/provision-child.ts`) are the current surface it must cover.
