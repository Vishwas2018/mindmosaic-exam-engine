# ADR-016: Versioned Australian curriculum platform

- **Status:** Accepted
- **Date:** 2026-08-28
- **Scope:** Foundation–Year 10 curriculum identity, provenance, mapping and learner preference

## Context

MindMosaic previously used curriculum names and free-text strand labels without
an authoritative, versioned model. Australian jurisdictions do not share one
interchangeable structure: the Australian Curriculum uses years and bands,
Victoria uses developmental levels and bands, and NSW uses stages. A school
year therefore cannot stand in for a curriculum level or stage.

The existing `framework_versions` tables describe assessment delivery
behaviour. Reusing them for curriculum releases would conflate two independent
version domains.

## Decision

### Authority, source and release

A curriculum source is a retrieved authority snapshot with jurisdiction,
sector applicability, URL, retrieval time, fingerprint, licence declaration
and immutable licence evidence. A curriculum release belongs to exactly one
source. Its jurisdiction must match the source and its school sectors must be a
non-empty subset of the source sectors.

ACARA Version 9 is represented as a national release. Victorian, NSW and
Western Australian curricula are distinct state releases even when they adopt
or adapt ACARA material. Crosswalks express reviewed relationships; release
identity is never collapsed through similarity.

No official releases or descriptors are seeded by the platform migration.
Repository fixtures use `SYN-*` identifiers and `example.invalid` URLs.

### Curriculum hierarchy and applicability

Release-scoped nodes form an immutable hierarchy:

`year | level | band | stage | learning_area | discipline | strand |
sub_strand | content_descriptor | achievement_standard`.

Year, level, band and stage are independent applicability axes. A record may
use more than one axis, but the presence of two axes does not claim they are
equivalent.

### Crosswalk semantics

Crosswalk relations are directional from source to target:

- `exact` and `equivalent` require a target;
- `broader` means the source is broader than the target;
- `narrower` means the source is narrower than the target;
- `related` records a non-equivalent reviewed relationship;
- `unmapped` is the only relation without a target.

Taxonomy alignment is a separate reviewed relation. Neither an alignment nor a
curriculum descriptor implies that MindMosaic has supporting questions.
Coverage is computed separately using a versioned coverage policy.

### Immutability, supersession and review

Sources, evidence, releases, nodes, applicability, crosswalks and alignments
are append-only. Corrections create a superseding record. Review history is an
append-only sequence locked against concurrent forks:

`draft → in_review → approved | rejected`.

Approved and rejected are terminal for that entity. A revised decision
requires a superseding entity and a new review sequence.

### Licence evidence and official text

A licence label alone is not permission. Every source references immutable
evidence recording its URL, retrieval time, fingerprint and whether storage
and display are permitted. `display` requires both storage and display
permission; `store_only` requires storage permission. Official text stored on
a node must cite the matching source licence. Public catalogue responses omit
official text unless the query requests it and validated evidence permits
display.

Metadata-only records do not establish that official codes, titles or
hierarchies are categorically free of copyright. Commercial ingestion remains
subject to source-specific legal review and permission where required.

### Access boundary

Authoritative curriculum tables have RLS enabled and no privileges for `anon`
or `authenticated`. Learner-facing consumers use a server-side implementation
of the database-independent `CurriculumCatalogue`, which validates and filters
results before returning them.

Learner curriculum preferences consist of a jurisdiction and school sector.
Both are null or both are present, only student profiles may hold them, and
parents modify linked children through the existing server-authorised child
boundary. No new direct authenticated profile-column grant is introduced.

### Programme offering region and year range

Programme-offering identity includes `region`, whose value is `global` or one
of AU, ACT, NSW, NT, QLD, SA, TAS, VIC or WA in both TypeScript and PostgreSQL.
Learner profiles may store Years 1–12 independently of current content
coverage.

## Consequences

- Curriculum existence, mapping, review and content coverage remain auditable
  and independently versioned.
- Jurisdiction research can be imported later without changing the contracts.
- The parent explorer can represent honest empty and unverified states.
- Official-source ingestion must retain evidence and pass legal review; this
  ADR does not itself authorize copying VCAA, NESA or other restricted text.
- Senior secondary certificates remain outside this F–10 model and require a
  later decision.
