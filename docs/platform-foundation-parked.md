# Platform Foundation — Parked (revisit after the pilot)

> Decision (2026-08-23): pause the platform-deepening to run a lean, content-first adaptive
> pilot and validate the product with real users first. The foundation below is real,
> committed, and correct — it is **parked, not abandoned**. Resume from here once the pilot
> shows the adaptive experience lands with kids and parents.

## Why parked

The route-level capacity simulator made the honest state plain: the engine is built and proven,
the measurement tools are all in place — but the content bank is nearly empty (best cohort =
2 clean adaptive sittings; pilot cohorts at 0) and no real child has used any of it. We were
building industrial-grade scale and compliance ahead of proving the product works. So: validate
small first, industrialize once the answer is yes.

## What is DONE and committed (resumable as-is)

Branch `fix/close-exam-write-trust-boundary`, HEAD `7168fac`, nothing pushed, cohort flag
ships `enabled=false, cohort_mode='off'` throughout.

- **Phase 0** — governance/contracts, ADR convention, single year authority (year-registry).
- **Phase 1** — immutable runtime content projection with dual provenance (factory-manifest +
  curated-git-authored), RLS-proven.
- **Phase 2 / Gate A (engineering-green, A1–A16)** — version-pinned sessions, server-authoritative
  scoring via the isolated least-privilege scoring role, resume state, marking + assignment write
  paths, read dispatch by origin, cohort boundary proven un-bypassable, offerings authority
  (programme_offerings, A16), operational erasure (admin-processed, 30-day recovery), retention
  schedule (ADR-012). The cutover model exists but is OFF.
- **Phase 3 (partial)** — immutable framework/blueprint/profile version tables (§22 replay proven);
  band-level and route-level capacity simulators; ADR-007 accepted (MST params: 6 items/stage,
  thresholds 0.4/0.6, numeric ability).
- **Adaptive prototype** — 3-stage MST router that demonstrably routes difficulty
  (`src/features/adaptive-prototype/`, spike, not wired to production).
- **Content pipeline hardened** — enforced `questions:gate` (composition/audit/ledger),
  honest append-only ledger, quarantine mechanism; generator ≠ auditor ≠ final-reviewer rule.

## What REMAINS on the platform track (in order, for when we resume)

1. Finish Phase 3: `assessment_forms` / form-versions / form-items (§10.4).
2. Phase 4: the **production** adaptive engine — real MST on the normalized model: exposure
   control across sittings (the no-repeat window), sealed atomic stage transitions (§12.6),
   cohort wiring, using the ADR-007 params. This is what turns the prototype into production.
3. Gate B (§12.7 steps 9–10): open a canary → drain → close legacy writes → contract/drop legacy
   (behind its own ADR).
4. Phase 5: analytics + empirical calibration (the pilot itself starts producing the response
   data this needs).
5. Phase 6: institutional tenancy (organizations/memberships) — deferred non-goal.

## Parked decisions to pick back up

- **Lean-vs-thorough** (this doc's decision) — revisit after the pilot verdict.
- **B5 cross-workstream reconciliation** — the isolated `feat/assessment-capability-expansion`
  branch changes `manual_marks`'s ON CONFLICT and widens the scoring-role grant; must fold in at
  merge without regressing A2/A13.
- **ADR-004 real blueprints** — the seeded blueprints are honest "whole-eligible-pool"
  placeholders; adaptive routing that constrains each stage by strand/skill will need richer
  blueprint versions (they supersede the placeholders; the tables are versioned for exactly this).

## Discipline to preserve when resuming (don't relearn the hard way)

- Cohort flag stays OFF until Gate A green + an explicit operational decision to open a canary.
- Migration discipline (§19.1): timestamped SQL + `scripts/migrations/registry.ts` entry +
  a verification check + RLS/privilege tests, per migration.
- Server-authoritative scoring; the ONLY reader of `item_answer_versions` is the isolated scoring
  module (least-privilege `mindmosaic_scoring`, never `service_role`).
- Keep the run-completeness guard and `questions:gate` enforced; green must mean green.
- Nothing pushed without the verification round; one concern per commit; never
  `git commit -- <pathspec>` (it re-stages working-tree content).

## Resume trigger

Return here once the pilot answers: **does adaptive difficulty land with kids, and do parents
value it?** If yes → industrialize from this foundation (Phase 4 → Gate B → scale). If no → the
deferral was correct; re-scope before investing further.

Pointers: `docs/spec/scalable-assessment-platform-spec-v1.md`,
`docs/phase2-cutover-readiness-checklist.md`, `docs/adr/`, `docs/adaptive-testlet-strategy.md`,
`docs/content-track-handoff.md`.
