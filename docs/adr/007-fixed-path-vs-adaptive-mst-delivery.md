# ADR-007: Fixed-path versus `adaptive_mst` delivery mode

- **Status:** proposed
- **Date:** 2026-08-12 (MST routing parameters drafted 2026-08-21, simulation evidence below)
- **Spec:** §11, §13.2–§13.4, §21 Phase 4, §24
- **Phase:** 4

## Scope of this draft

This pass resolves **three** of spec §24's open decisions — the ones
`docs/adaptive-testlet-strategy.md` §16 calls the inputs for its own
informally-numbered "ADR-1" — with simulation evidence: **items per adaptive
stage**, **the two routing thresholds**, and **banded versus numeric
provisional ability**. It also derives a fourth number spec §24 lists
separately, "exact per-cell depth required for adaptive readiness", as a
direct consequence of the first three, offered as input to
[ADR-010](010-capacity-gate-and-accessibility-sufficiency.md)'s own
acceptance-threshold decision rather than replacing it.

**Still an open placeholder, not addressed here**: the engine boundary
between `adaptive_mst` and fixed-path (what the engine interface is, which
decisions belong to the profile version versus the engine), allocation
mechanics when items are chosen per stage rather than up front, and what a
client is told about a session whose remaining content does not yet exist —
the rest of this ADR's original scope. Spec §24's "whether provisional
adaptive results are isolated or route-adjusted" is
[ADR-011](011-adaptive-reporting-and-calibration-claims.md)'s question, not
this one's. Until the whole of ADR-007 is accepted, the platform defaults to
fixed-path delivery and conservative learner-facing claims, unchanged by
this draft.

**Every number below is a recommendation for product-owner approval, not a
decision this pass made unilaterally.** Status stays `proposed`.

## Context

Delivery is fixed-path today: `selectExamQuestions` / `selectPatternQuestions`
run a deterministic seeded selection server-side, the whole paper is chosen at
session creation, and the client navigates freely within it. `adaptive_mst`
does not exist in production anywhere — no schema, no route, no cohort.

`src/features/adaptive-prototype/` (a spike, imported by no production code —
see its own README) implements strategy doc D1's 3-stage MST router as a pure
function: Stage 1 is medium-anchored; Stage 2 and Stage 3 each route to
`easy`/`medium`/`challenging` off a provisional-ability estimate, using the
real published bank via the platform's own `filterEligibleQuestions()`. Two
routing models were implemented so they could be compared rather than one
being assumed:

- **numeric** — `routeBand()` compares the *cumulative* running score across
  every completed stage against the two thresholds, fresh at every
  transition.
- **banded** — `stepBand()` is a Markov step: only the *current* band and the
  *just-completed stage's own local score* matter. Nothing earlier is
  remembered. Scoring at/above `routeUpAt` moves one band up from wherever the
  student currently is; at/below `routeDownAt` moves one band down; otherwise
  the band is unchanged. Already at the top or bottom band saturates.

`scripts/adaptive-prototype-grid.mts` (`npm run adaptive:grid`) drove both
models across a grid of `itemsPerStage` values, threshold pairs, and a spread
of simulated constant-ability students (`probabilisticStrategy`: each item
independently correct with a fixed probability, no difficulty-conditional
response model — that requires calibration, spec §8, which does not exist
yet), against every real `(family, year, subject)` cohort at years already
serving gated content (Y3/Y5 today — `yearLevelsWithGatedCoverage()`), plus
three representative cohorts (deep / balanced / thin-at-the-top) for the
parameter-sensitivity phase. Full output:
`scripts/out/adaptive-grid-report.json` (gitignored; regenerate with
`npm run adaptive:grid`).

## Decision (recommended)

### 1. Items per stage: **6**

Aggregate discrimination (does the router's final-stage band agree with what
the student's *true* ability would deterministically route to under the same
thresholds — see Evidence) was flat across the three sizes tested (4, 6, 8 —
all ≈78% mean agreement). The signal that actually distinguishes them is at
the hardest-to-classify ability level, 0.5 (a student genuinely on the
medium/medium boundary): agreement rose from **37% at 4 items**, to **53% at
6**, to **60% at 8** — larger stages resolve the ambiguous middle more
reliably, which is exactly what more items per stage should buy a testlet
router.

8 was not recommended over 6 because the content cost is real and immediate:
worst-case single-sitting depth needed per band scales with `itemsPerStage`
(§4 below), and the degradation census (Phase A) shows several real cohorts
degrading *more* at 8 than at 6 — e.g. `icas_style Y5 language` goes from 33%
of stages degraded at 4 items to 87% at both 6 and 8; `naplan_style Y3
language` is clean at 4 and 6 but starts degrading at 8. 6 captures most of
8's mid-ability discrimination gain (53% vs 60%, both well above 4's 37%)
without asking for the largest content floor.

### 2. Routing thresholds: **routeDownAt = 0.4, routeUpAt = 0.6** (the existing default — retained, not changed)

Mean discrimination was nearly identical across the three threshold widths
tested — narrow (.45/.55) 79%, default (.4/.6) 79%, wide (.3/.7) 77% — and
threshold choice barely moved the outcome at the recommended stage size
(sensitivity range 0 percentage points at 6 items, vs 8%: at 8 items). Routing
quality in this simulation is **not strongly sensitive to where these two
thresholds sit**, which is itself useful evidence: there is no simulated case
for moving off the values `defaults.ts` already shipped as a placeholder.
`wide` was measurably (if modestly) the worst of the three and is not
recommended.

### 3. Provisional ability model: **numeric** (cumulative running score)

Aggregate discrimination was close to a tie — numeric 78%, banded 79% — and a
constant-ability simulated student cannot fully separate the two models: they
provably diverge only when a student's *recent* performance differs from
their *cumulative* performance (proven directly —
`src/tests/unit/adaptive-prototype/simulator.test.ts`'s
"banded vs numeric ability models diverge on a recent-performance-drop" case:
a student who is perfect in Stage 1 then drops to 2/6 in Stage 2 is kept at
`challenging` for Stage 3 by the numeric model (cumulative (6+2)/12 = 0.667)
and dropped to `medium` by the banded model (Stage 2's own score, 0.333,
alone) — but a *constant*-probability mock student never produces this
pattern on purpose, so the grid's aggregate numbers cannot say which reaction
is more *correct* for a real, non-constant learner.

Given near-parity on the evidence available, the recommendation rests on two
things the simulation did not measure directly:

- **Forward compatibility with calibration.** Spec §8 makes calibration a
  versioned, numeric, empirically-derived dimension. A numeric running score
  is the natural interim stand-in for a future calibrated ability estimate
  (theta); a banded model discards exactly the information (how far above or
  below the threshold, not just which side) a numeric ability estimate would
  need.
- **Reporting simplicity.** A single cumulative score is what a running score
  actually *means* to a learner or teacher ("how am I doing overall");
  banded's per-stage step has no such direct reading and would need its own
  translation for spec §13/ADR-011's reporting question.

This is the one recommendation in this ADR that is a judgement call rather
than a clear simulated performance gap, and is flagged as such for review.

### 4. Derived minimum per-band depth (informs ADR-010)

At the recommended `itemsPerStage = 6`, no item is ever re-served within one
sitting (the simulator's own exclusion tracking, proven by
`src/tests/unit/adaptive-prototype/simulator.test.ts`), so the worst case for
a *single* sitting is: Stage 1 always draws from `medium`; Stage 2 and Stage 3
can each independently land on any band. A non-`medium` band (`easy`,
`challenging`) is reachable by at most 2 of the 3 stages; `medium` is
reachable by all 3 (Stage 1, plus Stage 2 and/or Stage 3 if the student stays
in the middle). That gives, at `itemsPerStage = N`:

| Band | Worst-case draw in one sitting |
| --- | --- |
| `easy` | `2N` |
| `medium` | `3N` |
| `challenging` | `2N` |

**At `N = 6`: easy 12, medium 18, challenging 12.** This is not a theoretical
ceiling that never happens — the degradation census's "observed maximum
single-sitting draw" at `N = 8` hit exactly `2N`/`3N`/`2N` (16/24/16), so the
worst case is real and reachable, not a pessimistic bound.

**This is a `single-sitting, no-degrade` floor, not the spec §13.2 50-sitting
no-repeat guarantee.** The two are different targets stacked on top of each
other:

- **Near-term (pilot-ready):** a cell with at least 12/18/12 real items per
  band can run one sitting, for any student path, without the router ever
  degrading. This is the number the content track can act on now.
- **Long-term (D2's hard guarantee, past the capacity gate):** if every one
  of `targetNoRepeatExams = 50` sittings independently hits the worst case
  (a conservative, safe assumption — not every sitting will, but a capacity
  *gate* should not depend on which ones do), the no-repeat floor is
  `50 x` the row above: **easy 600, medium 900, challenging 600**. No cohort
  measured today is within an order of magnitude of this — it is the
  aspirational target D2 already frames as "best-effort until the gate
  passes", not a near-term content commitment.

`scripts/capacity-report.mts` already supports `--items-per-cell=N` as a
uniform multiplier, but not a *band-specific* one — applying 2N/3N/2N today
means running it three times with three different `--items-per-cell` values
and reading the matching band's column, or a small follow-up enhancement to
accept per-band multipliers. Neither is done in this pass; flagged as a real,
small, separate follow-up rather than silently left undiscoverable.

**Which real cohorts already clear the near-term floor, at N=6** (from the
degradation census, all 18 real Y3/Y5 cells): all **9 Year-3 cohorts** (both
styles, every subject) plus **ICAS Y5 Numeracy** — 10 of 18. The other **8
Year-5 cohorts** (NAPLAN Y5 Numeracy/Reading/Language; ICAS Y5
Reading/Language/Science/Digital Technologies/Spelling) do not, several by a
wide margin (ICAS Y5 Science degrades on literally every stage that reaches
it — it has zero content in any band, matching
`docs/content-track-handoff.md`'s own finding). This is the same priority
list the content track's census already produced, now with a precise,
derived numeric target — 12/18/12 — replacing the placeholder "50" the
capacity report shipped with by default.

## Evidence (simulation grid)

Full detail in `scripts/out/adaptive-grid-report.json`
(`npm run adaptive:grid` to regenerate — read-only, ~3 seconds, no DB). The
headline tables:

**Mean discrimination by items-per-stage** (averaged over thresholds, ability
models, and the three representative cohorts):

| items/stage | mean agreement |
| ---: | ---: |
| 4 | 78% |
| 6 | 78% |
| 8 | 78% |

**Discrimination by ability level** (numeric model, default thresholds, mean
across the three representative cohorts) — where the real signal is:

| items/stage | ability=0.9 | ability=0.7 | ability=0.5 | ability=0.3 | ability=0.1 |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 4 | 100% | 77% | **37%** | 77% | 97% |
| 6 | 100% | 87% | **53%** | 50% | 100% |
| 8 | 100% | 70% | **60%** | 80% | 100% |

Extremes (0.9, 0.1) discriminate almost perfectly regardless of stage size —
the signal is unambiguous. The near-threshold levels (0.7, 0.3) are noisy at
only 10 trials per cell (statistical precision at that trial count is roughly
±10-20 points, so small differences between adjacent stage sizes there are
not strong evidence on their own). The ability=0.5 column is the one
consistent, monotonic trend, and is what §1's recommendation rests on.

**Mean discrimination by threshold set:**

| thresholds | mean agreement |
| --- | ---: |
| narrow (.45/.55) | 79% |
| default (.4/.6) | 79% |
| wide (.3/.7) | 77% |

**Threshold sensitivity** (range of mean agreement across the three threshold
sets, by items-per-stage — low means routing quality barely depends on
exactly where the thresholds sit):

| items/stage | range |
| ---: | ---: |
| 4 | 1% |
| 6 | 0% |
| 8 | 8% |

**Mean discrimination by ability model:** numeric 78%, banded 79% (see §3).

**Degradation census** (default thresholds, ability 0.9/0.5/0.1, 5 trials
each, all 18 real Y3/Y5 cohorts, `itemsPerStage ∈ {4, 6, 8}`): 0% degraded
across every stage instance for 9 of 18 cohorts at every stage size tested
(all Year-3 cohorts); every Year-5 cohort except ICAS Numeracy degrades at
every stage size tested, several severely (ICAS Y5 Science: 100% at every
size — it is empty). Full per-cohort table in
`scripts/out/adaptive-grid-report.json`'s `degradationCensus`.

## Consequences

- A pilot built on these three recommendations can start on the 10 cohorts
  that already clear the near-term (single-sitting) floor without the
  router ever degrading, while the content track works the 8 that do not —
  a concrete, evidence-derived priority list rather than "grow everything".
- The `banded` ability model now exists as a real, tested alternative in the
  prototype (not a hypothetical) — if a future decision reverses §3's
  recommendation, or wants a non-constant-ability simulation to re-test it,
  the code and the divergence test are already there.
- The 12/18/12 (near-term) and 600/900/600 (long-term) numbers are
  *derived*, not independently re-validated against a real adaptive
  session's actual behavior — they follow deductively from the exclusion
  rule the prototype implements (never re-serve an item within one sitting)
  and were spot-checked, not exhaustively proven, against the simulation's
  observed maximum draws. `scripts/capacity-report.mts` needs the
  band-specific enhancement noted in §4 before these numbers can be applied
  mechanically rather than by hand.
- This ADR still does not resolve the engine-boundary questions its original
  placeholder named. `adaptive_mst` remains unbuildable in production until
  those are answered, regardless of whether §1-§3's recommendations are
  accepted.

## Alternatives considered

- **Recommend `itemsPerStage = 8`** for its higher mid-ability discrimination
  (60% vs 6's 53%). Rejected as the *primary* recommendation: the marginal
  gain over 6 is smaller than the marginal content cost (worst-case depth
  scales linearly with `N`, and several real cohorts measurably degrade more
  at 8 than at 6), and 8's threshold-sensitivity (8%) is higher, meaning it
  is also more exposed to getting §2's thresholds wrong.
- **Recommend `itemsPerStage = 4`** for the lowest content floor. Rejected:
  it clearly resolves the ambiguous middle ability worst (37% vs 53%/60%),
  which is close to the coin-flip a 3-band router should not be producing at
  its own decision boundary.
- **Pick asymmetric thresholds** (e.g. easier to route up than down, or vice
  versa) to bias the router toward or away from harder content. Not tested —
  the grid used symmetric pairs around 0.5 only. Flagged as untested rather
  than silently ruled out; an asymmetric pair is a legitimate follow-up
  question if a product reason to bias the router ever appears.
- **Recommend `banded` provisional ability** for its lower per-transition
  state (only current band + last stage's score, vs numeric's full running
  tally). Rejected on the current evidence: no discrimination advantage was
  measured, and it discards information (distance from threshold, not just
  side) a future calibrated ability estimate will want.
- **Skip the simulation and pick round numbers by inspection.** Rejected —
  that is exactly what §16 left open rather than guessed at, and it is what
  this ADR exists to replace with measured evidence.

## Verification

| Claim | Where it is proved |
| --- | --- |
| The numeric and banded ability models are genuinely different algorithms, not the same logic under two names | `src/tests/unit/adaptive-prototype/simulator.test.ts`, "banded vs numeric ability models diverge on a recent-performance-drop" — a scripted case where they provably disagree on Stage 3's band |
| An item is never re-served within one sitting, which the 2N/3N/2N worst-case depends on | `src/tests/unit/adaptive-prototype/simulator.test.ts`, "never serves the same item twice across stages, even when two stages land on the same band"; `real-bank.test.ts`'s equivalent case against the real bank |
| The worst-case single-sitting depth (2N/3N/2N) is reachable, not merely an upper bound | `scripts/adaptive-prototype-grid.mts`'s Phase A "observed maximum single-sitting draw" — hit exactly 16/24/16 at `N=8` |
| The degradation census and parameter grid are reproducible | `npm run adaptive:grid` — deterministic (seeded), read-only, no DB; re-running reproduces `scripts/out/adaptive-grid-report.json` byte-for-byte given the same bank content |
| Routing thresholds are read consistently by both ability models | `src/tests/unit/adaptive-prototype/routing.test.ts` — `routeBand`/`stepBand` share the same threshold-ordering guard and are tested against the same threshold fixtures |
