import "server-only";

import {
  DEFAULT_ITEMS_PER_STAGE,
  DEFAULT_ROUTING_THRESHOLDS,
  routeBand,
  selectStageItems,
  type ContentScope,
  type RoutingThresholds,
} from "@/features/adaptive-prototype";
import {
  filterEligibleQuestions,
  ISOLABLE_SUBJECT_FILTERS,
  REGISTRY_SUBJECT_BY_FILTER,
  type SubjectFilter,
} from "@/features/exam-engine/selection";
import { getExamBank } from "@/server/exam-bank";
import type { ExamStyle, Question, YearLevel } from "@/schemas/question.schema";

import { DIFFICULTY_BANDS, PROGRAMME_BY_FAMILY, type DifficultyBand } from "./capacity-report";
import { isSubjectSatIn } from "./subject-registry";
import { validStyleYearPairs } from "./year-registry";

/**
 * Spec §13.3-§13.4's route-level capacity simulator: the richer measurement
 * `capacity-report.ts`'s own header named as blocked on ADR-007 (routes,
 * stages) existing. ADR-007 (accepted 2026-08-21) fixed the inputs this
 * needed: 3-stage MST, `itemsPerStage = 6`, `routeDownAt/routeUpAt = 0.4/0.6`,
 * numeric provisional ability. This module is deliberately read-only and
 * schema-free, exactly like `capacity-report.ts` — it re-derives everything
 * from the served/projected bank and the real adaptive-prototype routing
 * functions, never from a database.
 */

/**
 * A reachable band-path through the ADR-007 MST. Stage 1 is always
 * medium-anchored (D1). `stage2Band`/`stage3Band` are DERIVED, not asserted:
 * `enumerateReachableRoutes` runs every possible (Stage 1 correct count,
 * Stage 2 correct count) pair at `itemsPerStage` through the real
 * `routeBand()` function and collects the distinct outcomes, so "reachable"
 * means the actual numeric routing model can produce this exact path, not a
 * hand-picked cross product ADR-007 §4 merely asserted informally.
 */
export interface MstRoute {
  readonly stage2Band: DifficultyBand;
  readonly stage3Band: DifficultyBand;
  readonly path: readonly [DifficultyBand, DifficultyBand, DifficultyBand];
  readonly label: string;
}

/**
 * Every distinct band-path a student can traverse under the real numeric
 * routing model. At `itemsPerStage = 6` and the accepted 0.4/0.6 thresholds
 * this proves out to all 9 combinations of (stage2Band, stage3Band) —
 * confirming ADR-007 §4's "Stage 2 and Stage 3 can each independently land
 * on any band" is exactly true here, not merely a reasonable assumption —
 * but the function makes no such assumption itself: it walks every
 * (0..itemsPerStage) x (0..itemsPerStage) score pair and asks the real
 * router, so it stays correct if `itemsPerStage`/thresholds ever change.
 */
export function enumerateReachableRoutes(
  itemsPerStage: number = DEFAULT_ITEMS_PER_STAGE,
  thresholds: RoutingThresholds = DEFAULT_ROUTING_THRESHOLDS,
): readonly MstRoute[] {
  const seen = new Map<string, MstRoute>();
  for (let stage1Correct = 0; stage1Correct <= itemsPerStage; stage1Correct += 1) {
    const stage2Band = routeBand(stage1Correct / itemsPerStage, thresholds);
    for (let stage2Correct = 0; stage2Correct <= itemsPerStage; stage2Correct += 1) {
      const runningAfterStage2 = (stage1Correct + stage2Correct) / (itemsPerStage * 2);
      const stage3Band = routeBand(runningAfterStage2, thresholds);
      const path = ["medium", stage2Band, stage3Band] as const;
      const key = path.join(">");
      if (!seen.has(key)) {
        seen.set(key, { stage2Band, stage3Band, path, label: path.join(" -> ") });
      }
    }
  }
  return [...seen.values()].sort(
    (a, b) =>
      DIFFICULTY_BANDS.indexOf(a.stage2Band) - DIFFICULTY_BANDS.indexOf(b.stage2Band) ||
      DIFFICULTY_BANDS.indexOf(a.stage3Band) - DIFFICULTY_BANDS.indexOf(b.stage3Band),
  );
}

export interface RouteAttempt {
  readonly route: MstRoute;
  /**
   * How many consecutive sittings this ONE route completed with every
   * stage filling cleanly, before either degrading or hitting `searchCap`.
   * Exposure (`selectStageItems`'s `excludeIds`) accumulates across every
   * sitting AND across all three stages within a sitting — an item already
   * served anywhere in this route's history is never re-served, which is
   * spec §13.2's multi-key exposure at the one key this codebase actually
   * implements today (item identity); stimulus/family/enemy-set exclusion
   * remain future work, exactly as `item-pool.ts`'s own header notes.
   */
  readonly maxCleanSittings: number;
  /** True when `maxCleanSittings === searchCap` without ever degrading —
   * report as "at least this many", not an exact ceiling. */
  readonly capped: boolean;
  /** The band whose pool ran out, causing the first degradation. Null when
   * the route never degraded within `searchCap`. */
  readonly bindingBand: DifficultyBand | null;
  /** The 1-based sitting at which degradation first occurred. Null when the
   * route never degraded within `searchCap`. */
  readonly degradesAtSitting: number | null;
}

export interface RouteCapacityParams {
  readonly itemsPerStage: number;
  readonly thresholds: RoutingThresholds;
  /** Spec §13.4's "configured number of consecutive sittings" — the target N
   * a cohort is checked against. N=1 reproduces ADR-007 §4's single-sitting
   * 12/18/12 floor; larger N walks toward spec §13.2's 50-sitting target. */
  readonly sittings: number;
  /** How far the simulator actually searches for each route's true maximum,
   * independent of `sittings` — always clamped to at least `sittings` so
   * "ready at N" and "the real max clean N" come from the same pass. */
  readonly searchCap: number;
}

export const DEFAULT_ROUTE_CAPACITY_PARAMS: RouteCapacityParams = {
  itemsPerStage: DEFAULT_ITEMS_PER_STAGE,
  thresholds: DEFAULT_ROUTING_THRESHOLDS,
  sittings: 50,
  searchCap: 200,
};

/**
 * Attempts to construct sittings 1, 2, 3, ... for ONE route against ONE
 * cohort's real eligible bank, stopping the moment any stage in any sitting
 * cannot fill `itemsPerStage` items from its band without repeating an item
 * already served earlier in this route's history (this sitting or any
 * previous one). Reuses `selectStageItems` — the real adaptive-prototype
 * selection function, same shuffling and same `degraded` semantics
 * `runAdaptiveSession` uses for a single sitting — rather than a parallel
 * arithmetic shortcut, so this stays correct if the eligibility filter or
 * exclusion rule the prototype uses ever changes.
 */
function attemptRoute(
  cohortBank: readonly Question[],
  scope: ContentScope,
  route: MstRoute,
  itemsPerStage: number,
  searchCap: number,
): RouteAttempt {
  const usedIds = new Set<string>();
  let cleanSittings = 0;
  let bindingBand: DifficultyBand | null = null;
  let degradesAtSitting: number | null = null;

  sittingLoop: for (let sitting = 1; sitting <= searchCap; sitting += 1) {
    for (const [stageIndex, band] of route.path.entries()) {
      const pool = selectStageItems(
        cohortBank,
        scope,
        band,
        itemsPerStage,
        usedIds,
        `route-capacity:${route.label}:sitting${sitting}:stage${stageIndex + 1}`,
      );
      for (const item of pool.served) usedIds.add(item.id);
      if (pool.degraded) {
        bindingBand = band;
        degradesAtSitting = sitting;
        break sittingLoop;
      }
    }
    cleanSittings = sitting;
  }

  return {
    route,
    maxCleanSittings: cleanSittings,
    capped: degradesAtSitting === null,
    bindingBand,
    degradesAtSitting,
  };
}

export interface CohortRouteCapacity {
  readonly family: ExamStyle;
  readonly programme: string;
  readonly yearLevel: YearLevel;
  readonly subject: Exclude<SubjectFilter, "mixed">;
  /** Every reachable route fills all `params.sittings` sittings without degrading. */
  readonly readyAtN: boolean;
  /** `min` over every reachable route's `maxCleanSittings` — the cohort's
   * true adaptive-ready depth, in sittings, at the current bank. */
  readonly maxNonDegradingSittings: number;
  /** True when `maxNonDegradingSittings === searchCap` — no route was ever
   * observed to degrade; the cohort supports at least this many sittings but
   * the true ceiling is unmeasured beyond the search bound. */
  readonly capped: boolean;
  /** The route that constrains `maxNonDegradingSittings` — null when
   * `capped` (nothing was observed to bind). */
  readonly bindingRoute: MstRoute | null;
  readonly bindingBand: DifficultyBand | null;
  /** Every reachable route's own attempt, for the detailed JSON view. */
  readonly routes: readonly RouteAttempt[];
}

export interface RouteCapacityReport {
  readonly params: RouteCapacityParams;
  readonly reachableRoutes: readonly MstRoute[];
  readonly cohorts: readonly CohortRouteCapacity[];
  readonly summary: {
    readonly bankSize: number;
    readonly totalCohorts: number;
    readonly readyAtN: number;
    readonly notReadyAtN: number;
  };
}

/**
 * Builds the route-level capacity report from the served/projected bank
 * (`getExamBank("published")`), for every real `(family, year, subject)`
 * cohort — the same two gates `capacity-report.ts`/`coverage.ts` use, so an
 * impossible sitting (e.g. NAPLAN Science) is never materialised.
 */
export function buildRouteCapacityReport(
  params: RouteCapacityParams = DEFAULT_ROUTE_CAPACITY_PARAMS,
): RouteCapacityReport {
  const searchCap = Math.max(params.searchCap, params.sittings);
  const effectiveParams: RouteCapacityParams = { ...params, searchCap };
  const bank = getExamBank("published");
  const routes = enumerateReachableRoutes(params.itemsPerStage, params.thresholds);
  const cohorts: CohortRouteCapacity[] = [];

  for (const { examStyle, yearLevel } of validStyleYearPairs()) {
    for (const subject of ISOLABLE_SUBJECT_FILTERS) {
      if (!isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[subject], examStyle, yearLevel)) continue;

      const scope: ContentScope = { examStyle, yearLevel, subject };
      const cohortBank = filterEligibleQuestions(bank, scope);
      const attempts = routes.map((route) =>
        attemptRoute(cohortBank, scope, route, params.itemsPerStage, searchCap),
      );

      const binding = attempts.reduce((tightest, attempt) =>
        attempt.maxCleanSittings < tightest.maxCleanSittings ? attempt : tightest,
      );
      const trulyBinding = binding.capped ? null : binding;

      cohorts.push({
        family: examStyle,
        programme: PROGRAMME_BY_FAMILY[examStyle],
        yearLevel,
        subject,
        readyAtN: binding.maxCleanSittings >= params.sittings,
        maxNonDegradingSittings: binding.maxCleanSittings,
        capped: binding.capped,
        bindingRoute: trulyBinding?.route ?? null,
        bindingBand: trulyBinding?.bindingBand ?? null,
        routes: attempts,
      });
    }
  }

  /* Worst (lowest max-N) first, so the cohorts most in need of content lead
     the ranking; deterministic tie-break by family/year/subject. */
  cohorts.sort(
    (a, b) =>
      a.maxNonDegradingSittings - b.maxNonDegradingSittings ||
      a.family.localeCompare(b.family) ||
      a.yearLevel - b.yearLevel ||
      a.subject.localeCompare(b.subject),
  );

  return {
    params: effectiveParams,
    reachableRoutes: routes,
    cohorts,
    summary: {
      bankSize: bank.length,
      totalCohorts: cohorts.length,
      readyAtN: cohorts.filter((cohort) => cohort.readyAtN).length,
      notReadyAtN: cohorts.filter((cohort) => !cohort.readyAtN).length,
    },
  };
}
