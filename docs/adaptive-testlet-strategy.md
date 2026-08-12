# Adaptive Testlet Strategy — Content & Delivery Plan (v3)

> Status: proposed (v3 — second architect review incorporated, pre-implementation)
> Date: 2026-08-11
> Target repository: **mindmosaic-exam-engine** (confirmed).
> Governance: this repo's `CLAUDE.md` contains **only Graphify instructions** — there is
> no ADR/deviation convention here (the heavy governance lives in a *different* repo,
> `LegacyRepos/mindmosaic`, and does not govern this tree). Before implementation, either
> establish `docs/adr/` + a deviation log in this repo and cite it, or explicitly record
> that this work is governed ad hoc. Do not cite a governance doc this repo doesn't have.

## 0. v3 changelog (architect review #2)

- **§6 census corrected (P0).** My v2 table was the *partial* explicit-literal parse I
  flagged as directional. A resolved census over `getExamBank("published")` (runtime
  questions always carry a validated difficulty) shows all cohorts *do* span three bands.
  The content gate is justified by **blueprint-cell capacity**, not band absence.
- **§2 "what exists" corrected (P1).** `difficultyMix` is accepted by the schema but
  applied nowhere (`sourcePool()` ignores it); `Adaptation` is a learner-facing disclosure
  vocabulary and the schema *requires* `fixed_path` for every NAPLAN pattern. There is no
  pattern-kind to extend — adaptive delivery is net-new (§2, §4/D1).
- **New §7 stage-transition contract (P0):** MST cannot freeze a completed stage today.
- **§10 expanded (P1):** snapshot columns + concurrency control + server-owned forms.
- **§8 reframed (P1):** eligibility/calibration are orthogonal versioned dimensions, not
  an extension of `published`.
- **New §13 reporting (P1):** raw percentages aren't comparable across adaptive routes.
- **§12 assets:** promote `form-partition.ts`, `selection-units.ts`, manifest provenance.

## 1. Goal

A difficulty-banded, blueprint-modelled **pool** delivered as **testlets** whose difficulty
**rises or falls with the student's answers** (NAPLAN tailored-test design), with **no
repeated questions across sittings of the same subject** where capacity allows.

## 2. What actually exists (corrected)

**Not seams — do not build on these as if they were:**

- `difficultyMix` — a `patternSource` schema field that `sourcePool()`
  (`select-pattern-questions.ts:41`) never reads. Unimplemented, not leverage.
- `Adaptation` (`exam-pattern.ts`) — a *disclosure* vocabulary (`no_section_lock`,
  `fixed_path`). The schema *requires* every `naplan_style` pattern to declare `fixed_path`
  (`exam-pattern.ts:~268`). This forbids adaptive NAPLAN; it is not an engine-mode hook.

**Real assets to promote rather than recreate:**

- Stable disjoint **form partitioning** — `form-partition.ts:5` (provably disjoint sittings).
- Whole-**passage grouping** by stimulus-content identity — `selection-units.ts:27`.
- `sourcePool()` year/style/subject/strand/type filtering — the eligibility base.
- `server-only` bank (`server/exam-bank.ts`) — answer keys already off the signed-in client.
- Published **manifests** carry `blueprintId`, `contentHash`, `revision`
  (though bank assembly currently *strips* this provenance from runtime questions — see §12).
- Difficulty estimator (`question-factory/difficulty/`) — structural proxy; eligibility-only,
  **not** psychometric calibration (§8).

**Net-new required:** a delivery mode. Add `deliveryMode: "fixed_path" | "adaptive_mst"`
(or a distinct pattern schema). Do **not** encode engine mode as an `Adaptation`.

## 3. The hard part

Static selection picks all items up front and stores them in
`exam_sessions.selected_question_ids`, scoring server-side from that fixed list. Adaptive
means the served set isn't knowable at start, responses must be **sealed and scored per
stage** (§7), and selection must be **concurrency-safe and server-owned** (§10). Guests keep
the static flow; **adaptive is signed-in only**.

## 4. Locked decisions

### D1 — 3-stage MST, rotating Stage-1 forms (via `form-partition.ts`)

Routing testlet → Stage 2 band from S1 score → Stage 3 band from running score. Stage 1 has
a **fixed blueprint/difficulty** but rotates equivalent **forms** using the existing disjoint
form partitioning, so it is not identical items for every student. Items-per-stage and the
two thresholds are pinned in ADR-1.

### D2 — Exposure: best-effort, hardening to a guarantee only past the capacity gate

`assessment_session_items` (§10) is the exposure ledger. `targetNoRepeatExams = 50` drives
the window; oldest-first forced reuse when the pool can't sustain it. **The absolute
"no-repeat" goal holds only for a cohort/cell whose capacity gate (§9) passes** — elsewhere
it is explicitly best-effort with a recorded forced-reuse reason.

### D3 — Scope: signed-in only

Adaptive behind authenticated, serialized RPCs; keys never leave the server; guests
unchanged; static (`fixed_path`) and adaptive coexist.

## 5. Progressive session model

Superseded by §10 (normalized, snapshotted, concurrency-controlled).

## 6. Feasibility — resolved census (corrected)

Resolved over `getExamBank("published")` (runtime difficulty is schema-validated,
`question.schema.ts:95`):

| Cohort | easy | medium | challenging |
| --- | ---: | ---: | ---: |
| Y3 NAPLAN Numeracy | 77 | 35 | 16 |
| Y3 NAPLAN Language | 49 | 32 | 15 |
| Y3 NAPLAN Reading | 37 | 40 | 20 |
| Y5 NAPLAN Numeracy | 36 | 52 | **3** |
| Y5 NAPLAN Reading | 9 | 41 | **6** |
| Y5 NAPLAN Language | 21 | 16 | **3** |

**All cohorts span three bands** (my v2 claim of empty Y3 top bands was the partial parse and
is withdrawn). But content is nowhere near the 50-sitting, per-cell exposure target —
especially **Y5 challenging (3/6/3)**. **The content gate is justified by blueprint-cell
capacity (§9), not band absence.** A consistently-medium path over 50 sittings alone can
consume 1,500 medium items, so 1,500 is a floor and must be measured per
`examType × year × subject × band × blueprint cell`.

## 7. Stage-transition contract (NEW — P0)

Today responses are one mutable JSON object until final submit
(`api/exam/session/[id]/responses/route.ts:79`) and the UI allows unrestricted backward
navigation. MST cannot route on answers a student can still change. Each stage transition
must be a single **atomic, idempotent** operation that:

1. validates the expected current stage (reject stale/out-of-order transitions);
2. **persists and seals** that stage's responses (immutable stage-response rows / a sealed
   snapshot — no later mutation);
3. **scores** the sealed responses server-side;
4. records the routing score and the routing **decision**;
5. allocates the next testlet;
6. on retry, **returns the existing allocation** rather than allocating again.

Requires a per-session **stage state machine** and immutable stage snapshots. Without this, a
student can edit Stage 1 after Stage 2 is chosen, and concurrent/retried requests can allocate
multiple next stages.

## 8. Eligibility & calibration as orthogonal dimensions (reframed — P1)

`published` is the terminal *publication* state in the factory workflow
(`workflow/states.ts`); do not extend it into a routing lifecycle. Model instead as
independent, versioned dimensions on a runtime question:

- `publicationStatus` (unchanged factory meaning)
- `adaptiveEligibilityStatus` — requires immediate machine scoring, supported renderer,
  blueprint metadata, no unresolved QA flags, sufficient peer pool; essay/manual items
  **never** eligible
- `calibrationStatus` + `calibrationVersion`

The difficulty estimator is a **structural proxy**, explicitly not psychometric — it supports
eligibility *review* only. Calibration must come from empirical response data.

## 9. Capacity gates

Minimum pool per **blueprint cell and route**, not per subject. A cohort is
adaptive-eligible only when every band its routes can reach meets its floor with real
easy/challenging reserves. This is the true first gate (see Y5 challenging above).

## 10. Session model, snapshotting & concurrency (expanded — P1)

`assessment_session_items` (RLS in the same migration) — the served-order record **and** the
multi-key exposure ledger, snapshotting values so later lookups never depend on a drifting
compiled bank:

- `session_id`, `ordinal`, `stage`, `target_band`, `routing_decision`, `seed/form`
- `question_id` **+ `question_revision`/`content_hash`**
- `stimulus_id`, `item_family_id`, `blueprint_cell_id`
- `served_at`, and any **forced-reuse reason / window depth**

Plus the §7 sealed **stage-response** rows/snapshots.

**Concurrency (P1):** selection must not be "read history in the route, insert after" — two
tabs would see the same history and pick overlapping items. The stage RPC needs
**per-student/session serialization** and must **revalidate the proposed allocation
transactionally** before insert. **Form/exposure selection must be server-owned** — today
`form`/`formCount` are client inputs (`scoring/server-scoring-contract.ts:59`) and cannot
drive adaptive rotation.

## 11. Multi-key exposure

Tracked via the snapshotted columns in §10 (question, stimulus/passage, item-family), because
generated variants repeat a template/passage under different IDs. Reconciled with D2: a hard
guarantee only where the capacity gate passes.

## 12. Assets to promote (overlooked in v2)

`form-partition.ts` (disjoint forms → Stage-1 rotation), `selection-units.ts` (passage
grouping), and manifest provenance (`blueprintId`/`contentHash`/`revision`). **Bank assembly
currently strips provenance from runtime questions** — it must stop stripping, or re-attach
`blueprint_cell_id`/`content_hash`, so §10 can snapshot real values.

## 13. Reporting (NEW — P1)

`buildExamResult()` reports raw objective percentage (`scoring/exam-report.ts:156`). Students
on different routes sit differently difficult papers, so raw percentages are **not
comparable**. The pilot must either introduce route-adjusted/scaled reporting, or **isolate
adaptive pilot results** from mastery, history comparisons, and teacher analytics until
calibration exists.

## 14. Build sequence

0. Measure per cohort × band × blueprint cell (definitive capacity census).
1. Content readiness (gate): grow thin cells, esp. Y5 challenging.
2. Model content: blueprints, testlet forms, item families, stimulus/family IDs;
   stop stripping manifest provenance.
3. Capacity gates per cell/route.
4. Schema: `deliveryMode`; `assessment_session_items` (§10) + sealed stage responses;
   stage state machine; RLS; serialized stage RPC; server-owned forms.
5. Engine: stage router + ability update + multi-key exposure filter + eligibility filter;
   `adaptive_mst` delivery mode.
6. Delivery: per-stage sealed transition endpoint (§7); sanitized DTO.
7. Reporting: route-adjusted or isolated pilot results (§13).
8. Pilot with provisional thresholds.
9. Calibrate from live response data before claiming NAPLAN-like measurement quality.

## 15. ADRs to write (revised)

1. MST model — 3 stages, rotating Stage-1 forms, items-per-stage, routing thresholds,
   band-vs-numeric ability, **and the per-cell capacity-gate definition**.
2. **`deliveryMode`** vs distinct pattern schema (not `Adaptation`).
3. **Stage-transition contract** — state machine, sealed stage responses, idempotent retry.
4. **Session model** — `assessment_session_items` snapshot columns + concurrency/serialization
   + server-owned form selection.
5. Exposure — multi-key ledger, `targetNoRepeatExams`, forced-reuse, guarantee-past-gate.
6. Orthogonal `publicationStatus`/`adaptiveEligibilityStatus`/`calibrationStatus` dimensions.
7. Reporting — route-adjusted/scaled vs isolated pilot results.

Plus establish the **governance location** (ADR/deviation dir) this repo currently lacks.

## 16. Open questions for ADR-1

Items per stage (→ exam length); the two routing thresholds; ability as banded score vs
numeric; minimum per-cell depth before a cohort is adaptive-eligible.
