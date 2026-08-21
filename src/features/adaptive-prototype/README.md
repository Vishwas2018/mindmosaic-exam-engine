# Adaptive routing prototype — SPIKE, not production

> Engine-logic only. No database, no session model, no UI, no cohort wiring.
> Nothing under `src/features/adaptive-prototype/` is imported by any
> production route, component, or RPC. Read
> `docs/adaptive-testlet-strategy.md` (v3) first — this prototype implements
> that doc's D1 (3-stage MST) as a pure, runnable function, nothing more.

## What this proves

A visible, deterministic demonstration that difficulty **rises and falls
with how a student answers**, using the real, published content bank:

- **Stage 1 is medium-anchored** (D1: "Stage 1 has a fixed blueprint/
  difficulty"). Every session starts here regardless of who's sitting it.
- **Stage 2's band is chosen from Stage 1's own score**, and **Stage 3's
  band is chosen from the running score across Stage 1 + Stage 2** — both
  through the same `routeBand()` function, exactly as D1 describes: "Routing
  testlet -> Stage 2 band from S1 score -> Stage 3 band from running score."
- Items are pulled from `getExamBank("published")` — the same served,
  gated, non-double-counted bank `scripts/audit-bank.mts` and
  `scripts/capacity-report.mts` already treat as authoritative — filtered by
  `filterEligibleQuestions()` (the platform's own eligibility filter, not a
  reimplementation) and then by the routed band.
- Run `npm run adaptive:demo` to see it: a strong run (`allCorrectStrategy`)
  climbs to `challenging` by Stage 3, a weak run (`allWrongStrategy`) drops
  to `easy`, and a mixed run settles on `medium`.

## What this deliberately does NOT do

Everything the strategy doc itself defers past this prototype:

- **No exposure control across sittings** (§9-§11, D2). No 50-sitting
  no-repeat guarantee, no multi-key exposure ledger. This prototype only
  guarantees an item is never served twice *within one simulated session*
  (`simulator.ts` tracks served ids across all three stages) — that's basic
  engine hygiene, not the production exposure system.
- **No calibration** (§8, §13). `metadata.difficulty` is the *authored*
  band — a structural proxy, explicitly not psychometric. The routing
  thresholds here are placeholder spike defaults
  (`defaults.ts`), not the calibrated values §16 defers to a future ADR-1.
- **No offerings/blueprint model** (§9, ADR-004/ADR-006 §1 Phase 3). Item
  selection is year/style/subject/band only — no blueprint cells, no item
  families, no stimulus grouping, no enemy sets.
- **No cohort/flag wiring, no production session model** (§7, §10). This
  never touches `platform_flags`, `assessment_sessions`, the stage-
  transition contract, or any Supabase table. It is an in-memory function
  call; nothing here is sealed, persisted, or concurrency-safe.
- **No Phase 2 cutover interaction.** Reads `@/server/exam-bank` the same
  way `scripts/audit-bank.mts` does; writes nothing anywhere.

## What production would add, per the strategy doc

Everything §14's build sequence lists past step 0 (the capacity census —
already done, see `scripts/capacity-report.mts`):

1. **Content readiness** — grow the thin cells this prototype's own
   `degraded` flag surfaces (the strategy doc's Y5-challenging finding, §6).
2. **Model content** — blueprints, testlet forms, item families,
   stimulus/family IDs; stop bank assembly from stripping manifest
   provenance (§12).
3. **Capacity gates per cell/route** (§9) — the earlier band-level
   `capacity-report` is the input, not the gate itself.
4. **Schema** — `deliveryMode`, `assessment_session_items` (§10) with
   snapshot columns, a stage state machine, RLS, a serialized stage RPC,
   server-owned form selection.
5. **Engine** — this prototype's routing logic, but reading real
   `adaptiveEligibilityStatus`/`calibrationStatus` (§8) instead of raw
   `metadata.difficulty`, plus the multi-key exposure filter (§11).
6. **Delivery** — the §7 sealed per-stage transition endpoint (atomic,
   idempotent, seal-then-score-then-route-then-allocate) and a sanitized DTO.
7. **Reporting** — route-adjusted/scaled scoring or isolated pilot results
   (§13); raw percentages are not comparable across routes.
8. **Pilot**, then **calibrate** from live response data (§14 steps 8-9).

Six ADRs are still unwritten (§15): MST model + capacity-gate definition,
`deliveryMode` vs. a distinct pattern schema, the stage-transition contract,
the session model's concurrency/serialization, the exposure ledger, and the
orthogonal publication/eligibility/calibration dimensions. This prototype
does not answer any of them — it exists so the routing *shape* is visible
and arguable before that governance work starts.

## Files

- `types.ts` — the spike's own types (`ContentScope`, `RoutingThresholds`,
  `AnswerStrategy`, stage/session results). Not a session model.
- `defaults.ts` — placeholder items-per-stage and routing thresholds,
  explicitly labeled as not-yet-calibrated.
- `routing.ts` — `routeBand(runningScore, thresholds)`, the one routing
  decision D1 describes, called at both transitions.
- `item-pool.ts` — `selectStageItems()`, pulling from the real bank via
  `filterEligibleQuestions()` and degrading gracefully when a band is thin.
- `simulator.ts` — `runAdaptiveSession()`, the 3-stage loop that ties the
  above together and returns the full path.
- `answer-strategies.ts` — the three scripted mock-student patterns
  (`allCorrectStrategy`, `allWrongStrategy`, `mixedStrategy`) the demo and
  tests drive the router with.

Run the demo: `npm run adaptive:demo`.
Run the tests: `npx vitest run src/tests/unit/adaptive-prototype`.
