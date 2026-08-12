# ADR-007: Fixed-path versus `adaptive_mst` delivery mode

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §11, §21 Phase 4
- **Phase:** 4

## Placeholder

Delivery is fixed-path today: `selectExamQuestions` / `selectPatternQuestions`
run a deterministic seeded selection server-side, the whole paper is chosen at
session creation, and the client navigates freely within it. This ADR must
define the engine boundary that lets `adaptive_mst` exist alongside fixed-path
without either leaking into the other: what the engine interface is, which
decisions belong to the profile version versus the engine, how allocation
differs when items are chosen per stage rather than up front, and what a client
is told about a session whose remaining content does not yet exist. Spec §24
defers several inputs (items per stage, routing thresholds, banded versus
numeric provisional ability, whether provisional adaptive results are isolated
or route-adjusted), so this ADR must state which are prerequisites for the pilot
and which can remain open. Until it is accepted, the platform defaults to
fixed-path delivery and conservative learner-facing claims.
