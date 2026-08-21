import "server-only";

import {
  filterEligibleQuestions,
  ISOLABLE_SUBJECT_FILTERS,
  REGISTRY_SUBJECT_BY_FILTER,
  type SubjectFilter,
} from "@/features/exam-engine/selection";
import { getExamBank } from "@/server/exam-bank";
import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

import { isSubjectSatIn } from "./subject-registry";
import { validStyleYearPairs } from "./year-registry";

/**
 * Spec §13.3's capacity cell, at the granularity content actually has today:
 * `family x programme x year x subject x band`. Route, stage and blueprint
 * cell are the remaining three axes §13.3 names and are deliberately absent
 * — there are no routes or stages until adaptive delivery exists (ADR-007),
 * and no blueprint cells until Phase 3 blueprints exist (ADR-004,
 * ADR-006 §1). Band-level capacity is measurable now because it is a fact
 * about content already published, not a design this module would have to
 * invent. §13.4's full route-level simulator is the later, richer version
 * of this measurement, gated on those two things existing.
 */
export const DIFFICULTY_BANDS = ["easy", "medium", "challenging"] as const;
export type DifficultyBand = (typeof DIFFICULTY_BANDS)[number];

/**
 * One programme per family today, mirrored here as a static id rather than
 * queried — this report is deliberately DB-free so it is reproducible from
 * the repository alone (spec §7's "immutable Supabase projection" of the
 * compiled bank is content-identical to it; see ADR-002 Amendment A and the
 * shadow-compare it requires). Source of the exact ids:
 * supabase/migrations/20260822090000_programme_offering_authority.sql's
 * `programmes` seed. Widen this to a real per-programme split only once a
 * family has more than one programme.
 */
export const PROGRAMME_BY_FAMILY: Readonly<Record<ExamStyle, string>> = {
  naplan_style: "naplan_style_practice",
  icas_style: "icas_style_practice",
};

export interface CapacityReportParams {
  /** Spec §13.2's no-repeat target: no repeated content across this many sittings. */
  readonly sittings: number;
  /**
   * How many items from ONE band-cell a single sitting draws. Spec §24
   * lists "items per adaptive stage" as an open decision — there is no
   * canonical value yet, so this is a placeholder multiplier the caller
   * supplies, not a spec commitment. The default (1) is the most
   * conservative reading of §13.2: a cell needs at least `sittings` distinct
   * items if a sitting draws only one from it.
   */
  readonly itemsPerCellPerSitting: number;
}

export const DEFAULT_CAPACITY_REPORT_PARAMS: CapacityReportParams = {
  sittings: 50,
  itemsPerCellPerSitting: 1,
};

export interface CapacityCell {
  readonly family: ExamStyle;
  readonly programme: string;
  readonly yearLevel: YearLevel;
  readonly subject: Exclude<SubjectFilter, "mixed">;
  readonly band: DifficultyBand;
  /** Published-quality items in the gated bank for this exact cell. */
  readonly count: number;
  readonly requiredDepth: number;
  /** `max(0, requiredDepth - count)`. Zero means the cell already meets target. */
  readonly gap: number;
  readonly ready: boolean;
}

export interface CapacityReport {
  readonly params: CapacityReportParams & { readonly requiredDepth: number };
  /** Every real (family, year, subject, band) cell, ranked furthest-gap first. */
  readonly cells: readonly CapacityCell[];
  readonly summary: {
    /** `getExamBank("published").length` — the served/projected bank this report counted. */
    readonly bankSize: number;
    readonly totalCells: number;
    readonly cellsReady: number;
    readonly cellsWithGap: number;
    /** Sum of every cell's `count`. Reconciles to `bankSize` when every published item falls in a real cell. */
    readonly totalCountedItems: number;
    readonly totalGap: number;
  };
}

/**
 * Builds the band-level capacity report from the served/projected bank
 * (`getExamBank("published")` — curated + factory-published, the same
 * gated, non-double-counted, rejected/quarantined-excluded set
 * `docs/content-track-handoff.md`'s census and `scripts/audit-bank.mts`
 * both treat as authoritative).
 *
 * Only real cells are walked — `validStyleYearPairs()` for a valid
 * (family, year), then `isSubjectSatIn` for a valid (family, year, subject)
 * — exactly the same two gates `src/features/taxonomy/coverage.ts` uses, so
 * this cannot report a gap for a paper nobody sits (e.g. NAPLAN Science): an
 * impossible sitting is skipped entirely, never materialised as a
 * present-and-zero cell. A REAL sitting with no authored content yet (e.g.
 * every ICAS year outside 3/5 today) IS materialised, at count 0 for all
 * three bands — that zero is the actionable answer the content track needs,
 * not something to hide by omission.
 */
export function buildCapacityReport(
  params: CapacityReportParams = DEFAULT_CAPACITY_REPORT_PARAMS,
): CapacityReport {
  const requiredDepth = params.sittings * params.itemsPerCellPerSitting;
  const bank = getExamBank("published");
  const cells: CapacityCell[] = [];

  for (const { examStyle, yearLevel } of validStyleYearPairs()) {
    for (const subject of ISOLABLE_SUBJECT_FILTERS) {
      if (!isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[subject], examStyle, yearLevel)) {
        continue;
      }
      const eligible = filterEligibleQuestions(bank, { yearLevel, examStyle, subject });
      for (const band of DIFFICULTY_BANDS) {
        const count = eligible.filter((question) => question.metadata.difficulty === band).length;
        const gap = Math.max(0, requiredDepth - count);
        cells.push({
          family: examStyle,
          programme: PROGRAMME_BY_FAMILY[examStyle],
          yearLevel,
          subject,
          band,
          count,
          requiredDepth,
          gap,
          ready: gap === 0,
        });
      }
    }
  }

  /* Furthest-from-target first, then thinnest cell first; the rest of the
     key is purely for determinism between two equally-thin cells. */
  cells.sort(
    (a, b) =>
      b.gap - a.gap ||
      a.count - b.count ||
      a.family.localeCompare(b.family) ||
      a.yearLevel - b.yearLevel ||
      a.subject.localeCompare(b.subject) ||
      DIFFICULTY_BANDS.indexOf(a.band) - DIFFICULTY_BANDS.indexOf(b.band),
  );

  const totalCountedItems = cells.reduce((sum, cell) => sum + cell.count, 0);
  const totalGap = cells.reduce((sum, cell) => sum + cell.gap, 0);

  return {
    params: { ...params, requiredDepth },
    cells,
    summary: {
      bankSize: bank.length,
      totalCells: cells.length,
      cellsReady: cells.filter((cell) => cell.ready).length,
      cellsWithGap: cells.filter((cell) => !cell.ready).length,
      totalCountedItems,
      totalGap,
    },
  };
}
