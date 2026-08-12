# ADR-009: Exposure keys, enemy-set assessment, no-repeat window and forced-reuse policy

- **Status:** proposed
- **Date:** 2026-08-12
- **Spec:** §9.6, §13.1–§13.2, §21 Phase 4
- **Phase:** 4 (with Phase 3 inputs)

## Placeholder

This ADR must define what an exposure key is keyed on, which guarantees are
best-effort versus hard, how long a learner's no-repeat window runs, and what
happens when the eligible pool is too small to honour it — the forced-reuse
policy, which must be explicit rather than an emergent property of the selector.
It must also define enemy-set assessment: which items conflict (generated
variants, near-duplicates, shared construction templates, items that give away
each other's answers), how a conflict is recorded, and how the selector honours
it. Spec §1.1 makes enemy-set *handling* conditional on defined conflicts while
requiring an explicit enemy-set *assessment* before an item can be
adaptive-eligible, and this ADR must keep those two apart.

**Separation this ADR must preserve (carried forward from the v1.1 spec
review).** Item-level **`adaptive_eligibility`** is an intrinsic property of one
item version — machine-scorable, renderers supported, blueprint/family/stimulus/
enemy-set metadata complete, no unresolved correctness/originality/QA flags,
answerable from its accessible representation. It is decidable by looking at the
item alone. Cohort- or route-level **`adaptive_readiness`** is a property of a
*pool* under a *delivery configuration*, produced by the capacity simulator over
the already-eligible items. **Capacity is not a per-item eligibility field.**
Spec §9.7's eligibility list currently ends with "the applicable peer pool and
blueprint cells pass their capacity gates", which reads as a capacity condition
on item eligibility; that clause belongs to readiness, not eligibility, and
ADR-010 owns it. Collapsing the two would make an item's stored eligibility
flip whenever *other* items are published or retired, which is both wrong and
unstable — an item does not become individually unfit because its neighbours
thinned out.
