# ADR-010: Capacity-gate and accessibility-sufficiency acceptance thresholds

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §9.7, §13.3–§13.4, §21 Phase 3
- **Phase:** 3

## Placeholder

Readiness today is one number: `GATED_COVERAGE_THRESHOLD = 30` in the
server-only `src/features/taxonomy/coverage.ts`, tied to the largest sitting
length the configurator offers, applied per (year, style, subject) cell. Phase 3
makes readiness delivery-mode-specific, which this ADR must define: capacity
cells, what the 50-sitting capacity simulator asserts, per-cell depth required
for adaptive readiness (deferred by spec §24), and the acceptance thresholds
that gate a mode from being offered at all.

**This ADR owns capacity; ADR-009 owns item eligibility.** The two must not be
merged (see ADR-009's separation note). `adaptive_readiness` is computed by the
capacity simulator over the pool of items that are *already* individually
`adaptive_eligible`, for a specific cohort/route/delivery configuration. It is
recomputed when the pool changes; item eligibility is not. Spec §9.7's "the
applicable peer pool and blueprint cells pass their capacity gates" clause is
therefore a readiness condition that this ADR governs, not an item eligibility
field, and this ADR must say so where the projection schema is defined.

**Accessibility sufficiency is a hard gate, not a checklist.** An item is
adaptive-ineligible when its accessible representation does not convey
everything needed to answer — alt text, structured data, reading order, labels,
instructions and keyboard interaction — *even when the visual renderer works and
a sighted learner could answer it*. Mere presence of alt text is insufficient.
This ADR must define how sufficiency is assessed, by whom, how it is versioned
alongside the item version it judges, and what evidence is retained. Because it
is a property of the item alone, accessibility sufficiency belongs to
eligibility (ADR-009), and this ADR sets only its acceptance threshold and
review standard.
