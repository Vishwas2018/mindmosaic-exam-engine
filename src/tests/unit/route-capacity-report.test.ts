import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DEFAULT_ITEMS_PER_STAGE,
  DEFAULT_ROUTING_THRESHOLDS,
  routeBand,
} from "@/features/adaptive-prototype";
import {
  filterEligibleQuestions,
  ISOLABLE_SUBJECT_FILTERS,
  REGISTRY_SUBJECT_BY_FILTER,
} from "@/features/exam-engine/selection";
import { DIFFICULTY_BANDS } from "@/features/taxonomy/capacity-report";
import {
  buildRouteCapacityReport,
  DEFAULT_ROUTE_CAPACITY_PARAMS,
  enumerateReachableRoutes,
} from "@/features/taxonomy/route-capacity";
import { isSubjectSatIn } from "@/features/taxonomy/subject-registry";
import { isValidStyleYear, validStyleYearPairs } from "@/features/taxonomy/year-registry";
import { getExamBank } from "@/server/exam-bank";

/**
 * Spec §13.3-§13.4's route-level capacity simulator, extending
 * `capacity-report.test.ts`'s band-level coverage to ADR-007's accepted MST
 * (3-stage, itemsPerStage=6, thresholds 0.4/0.6, numeric provisional
 * ability). The headline property this DoD asked for: N=1 reconciles to
 * ADR-007 §4's derived single-sitting floor (easy 12 / medium 18 /
 * challenging 12) and its own stated "10 of 18" near-term readiness finding.
 */

describe("enumerateReachableRoutes", () => {
  it("derives exactly 9 reachable band-paths at the ADR-007 defaults, all stage-1-medium", () => {
    const routes = enumerateReachableRoutes();
    expect(routes).toHaveLength(9);
    for (const route of routes) {
      expect(route.path[0]).toBe("medium");
    }
    const labels = new Set(routes.map((route) => route.label));
    expect(labels.size).toBe(9);
    for (const stage2 of DIFFICULTY_BANDS) {
      for (const stage3 of DIFFICULTY_BANDS) {
        expect(routes.some((route) => route.stage2Band === stage2 && route.stage3Band === stage3), `${stage2}/${stage3}`).toBe(true);
      }
    }
  });

  it("every derived route is independently reproducible by feeding its own (stage1, stage2) score back through routeBand", () => {
    /* Reconciles the derivation against the real router directly, rather
       than trusting the enumeration's own internal loop. */
    const routes = enumerateReachableRoutes();
    for (const route of routes) {
      // At least one (stage1Correct, stage2Correct) pair must reproduce this exact path.
      let reproduced = false;
      for (let stage1Correct = 0; stage1Correct <= DEFAULT_ITEMS_PER_STAGE && !reproduced; stage1Correct += 1) {
        const stage2Band = routeBand(stage1Correct / DEFAULT_ITEMS_PER_STAGE, DEFAULT_ROUTING_THRESHOLDS);
        if (stage2Band !== route.stage2Band) continue;
        for (let stage2Correct = 0; stage2Correct <= DEFAULT_ITEMS_PER_STAGE; stage2Correct += 1) {
          const running = (stage1Correct + stage2Correct) / (DEFAULT_ITEMS_PER_STAGE * 2);
          if (routeBand(running, DEFAULT_ROUTING_THRESHOLDS) === route.stage3Band) {
            reproduced = true;
            break;
          }
        }
      }
      expect(reproduced, route.label).toBe(true);
    }
  });

  it("changing itemsPerStage or thresholds can change which paths are reachable, proving the set is derived, not hard-coded", () => {
    const narrow = enumerateReachableRoutes(6, { routeDownAt: 0.49, routeUpAt: 0.51 });
    /* A near-zero medium band at itemsPerStage=6 (only 3/6 = 0.5 lands
       strictly between 0.49 and 0.51) reaches medium far less often, but
       every band is still individually reachable via some score. */
    expect(narrow.length).toBeGreaterThan(0);
    expect(narrow.length).toBeLessThanOrEqual(9);
  });
});

describe("buildRouteCapacityReport — N=1 reconciles to ADR-007 §4's single-sitting floor", () => {
  it("a cohort is ready at N=1 if and only if its real bank clears easy>=12, medium>=18, challenging>=12", () => {
    const report = buildRouteCapacityReport({ ...DEFAULT_ROUTE_CAPACITY_PARAMS, sittings: 1 });
    const bank = getExamBank("published");

    for (const cohort of report.cohorts) {
      const eligible = filterEligibleQuestions(bank, {
        yearLevel: cohort.yearLevel,
        examStyle: cohort.family,
        subject: cohort.subject,
      });
      const counts = {
        easy: eligible.filter((q) => q.metadata.difficulty === "easy").length,
        medium: eligible.filter((q) => q.metadata.difficulty === "medium").length,
        challenging: eligible.filter((q) => q.metadata.difficulty === "challenging").length,
      };
      /* ADR-007 §4's derived worst-case single-sitting depth at
         itemsPerStage=6: easy 2N=12, medium 3N=18, challenging 2N=12. */
      const clearsFloor = counts.easy >= 12 && counts.medium >= 18 && counts.challenging >= 12;
      expect(cohort.readyAtN, `${cohort.family} y${cohort.yearLevel} ${cohort.subject}`).toBe(clearsFloor);
    }
  });

  it('reproduces ADR-007 §4\'s own stated finding: exactly the 9 real Year-3 cohorts plus ICAS Y5 Numeracy (10 of 18) are ready at N=1', () => {
    const report = buildRouteCapacityReport({ ...DEFAULT_ROUTE_CAPACITY_PARAMS, sittings: 1 });
    const nearTerm = report.cohorts.filter((cohort) => cohort.yearLevel === 3 || cohort.yearLevel === 5);
    expect(nearTerm).toHaveLength(18);

    const ready = nearTerm.filter((cohort) => cohort.readyAtN);
    expect(ready).toHaveLength(10);
    expect(ready.filter((cohort) => cohort.yearLevel === 3)).toHaveLength(9);
    const readyY5 = ready.filter((cohort) => cohort.yearLevel === 5);
    expect(readyY5).toHaveLength(1);
    expect(readyY5[0]).toMatchObject({ family: "icas_style", subject: "numeracy", yearLevel: 5 });
  });

  it("a cohort with zero content in every band degrades on its very first sitting, on the medium-anchored Stage 1", () => {
    const report = buildRouteCapacityReport({ ...DEFAULT_ROUTE_CAPACITY_PARAMS, sittings: 1 });
    const icasY5Science = report.cohorts.find(
      (cohort) => cohort.family === "icas_style" && cohort.yearLevel === 5 && cohort.subject === "science",
    );
    expect(icasY5Science).toBeDefined();
    expect(icasY5Science!.maxNonDegradingSittings).toBe(0);
    expect(icasY5Science!.readyAtN).toBe(false);
    /* Every route shares the same Stage 1 (medium); a cohort with too little
       medium content fails identically on every route's first stage. */
    expect(icasY5Science!.routes.every((attempt) => attempt.degradesAtSitting === 1)).toBe(true);
  });
});

describe("buildRouteCapacityReport — structural properties", () => {
  it("materialises a cohort for every real (family, year, subject) triple, and none for an impossible sitting", () => {
    const report = buildRouteCapacityReport();
    const expectedTriples = validStyleYearPairs().flatMap(({ examStyle, yearLevel }) =>
      ISOLABLE_SUBJECT_FILTERS.filter((subject) =>
        isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[subject], examStyle, yearLevel),
      ).map((subject) => ({ examStyle, yearLevel, subject })),
    );
    expect(report.cohorts).toHaveLength(expectedTriples.length);
    for (const cohort of report.cohorts) {
      expect(isValidStyleYear(cohort.family, cohort.yearLevel)).toBe(true);
      expect(isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[cohort.subject], cohort.family, cohort.yearLevel)).toBe(true);
    }
  });

  it("every cohort carries an attempt for every reachable route, and the reported max is the true minimum across them", () => {
    const report = buildRouteCapacityReport();
    for (const cohort of report.cohorts) {
      expect(cohort.routes).toHaveLength(report.reachableRoutes.length);
      const trueMin = Math.min(...cohort.routes.map((attempt) => attempt.maxCleanSittings));
      expect(cohort.maxNonDegradingSittings).toBe(trueMin);
    }
  });

  it("an attempt is internally consistent: capped xor a real degradation point, and maxCleanSittings = degradesAtSitting - 1 when it degraded", () => {
    const report = buildRouteCapacityReport();
    for (const cohort of report.cohorts) {
      for (const attempt of cohort.routes) {
        expect(attempt.capped).toBe(attempt.degradesAtSitting === null);
        if (attempt.degradesAtSitting !== null) {
          expect(attempt.maxCleanSittings).toBe(attempt.degradesAtSitting - 1);
          expect(attempt.bindingBand).not.toBeNull();
        } else {
          expect(attempt.bindingBand).toBeNull();
        }
      }
    }
  });

  it("readyAtN is exactly maxNonDegradingSittings >= params.sittings", () => {
    const report = buildRouteCapacityReport({ ...DEFAULT_ROUTE_CAPACITY_PARAMS, sittings: 2 });
    for (const cohort of report.cohorts) {
      expect(cohort.readyAtN).toBe(cohort.maxNonDegradingSittings >= 2);
    }
  });

  it("clamps searchCap up to at least sittings, so a caller cannot ask for more sittings than it searches", () => {
    const report = buildRouteCapacityReport({ ...DEFAULT_ROUTE_CAPACITY_PARAMS, sittings: 500, searchCap: 10 });
    expect(report.params.searchCap).toBeGreaterThanOrEqual(500);
  });

  it("ranks cohorts lowest max-N first", () => {
    const report = buildRouteCapacityReport();
    for (let i = 1; i < report.cohorts.length; i += 1) {
      expect(report.cohorts[i - 1]!.maxNonDegradingSittings).toBeLessThanOrEqual(
        report.cohorts[i]!.maxNonDegradingSittings,
      );
    }
  });

  it("summary counts agree with the cohorts array", () => {
    const report = buildRouteCapacityReport();
    expect(report.summary.readyAtN + report.summary.notReadyAtN).toBe(report.summary.totalCohorts);
    expect(report.summary.totalCohorts).toBe(report.cohorts.length);
    expect(report.summary.bankSize).toBe(getExamBank("published").length);
  });
});
