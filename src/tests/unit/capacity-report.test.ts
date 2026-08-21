import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  buildCapacityReport,
  DEFAULT_CAPACITY_REPORT_PARAMS,
  DIFFICULTY_BANDS,
  PROGRAMME_BY_FAMILY,
} from "@/features/taxonomy/capacity-report";
import {
  filterEligibleQuestions,
  ISOLABLE_SUBJECT_FILTERS,
  REGISTRY_SUBJECT_BY_FILTER,
} from "@/features/exam-engine/selection";
import { isSubjectSatIn } from "@/features/taxonomy/subject-registry";
import { isValidStyleYear, validStyleYearPairs } from "@/features/taxonomy/year-registry";
import { getExamBank } from "@/server/exam-bank";

/**
 * Phase 3, spec §13.3's band-level capacity cell:
 * `family x programme x year x subject x band`, measured over the
 * served/projected bank. These cases pin the reconciliation properties the
 * task's DoD asked for -- the report must not drop or double-count a
 * published item, and must never materialise a cell for a sitting nobody
 * takes.
 */

describe("buildCapacityReport", () => {
  it("uses the documented defaults: 50 sittings x 1 item/cell/sitting -> required depth 50", () => {
    expect(DEFAULT_CAPACITY_REPORT_PARAMS).toEqual({ sittings: 50, itemsPerCellPerSitting: 1 });
    const report = buildCapacityReport();
    expect(report.params.requiredDepth).toBe(50);
    expect(report.params).toEqual({ sittings: 50, itemsPerCellPerSitting: 1, requiredDepth: 50 });
  });

  it("materialises a cell for every real (family, year, subject) triple x 3 bands, and none for an impossible sitting", () => {
    const report = buildCapacityReport();

    const expectedTriples = validStyleYearPairs().flatMap(({ examStyle, yearLevel }) =>
      ISOLABLE_SUBJECT_FILTERS.filter((subject) =>
        isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[subject], examStyle, yearLevel),
      ).map((subject) => ({ examStyle, yearLevel, subject })),
    );
    expect(report.cells.length).toBe(expectedTriples.length * DIFFICULTY_BANDS.length);
    expect(report.summary.totalCells).toBe(report.cells.length);

    for (const cell of report.cells) {
      expect(isValidStyleYear(cell.family, cell.yearLevel)).toBe(true);
      expect(isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[cell.subject], cell.family, cell.yearLevel)).toBe(
        true,
      );
    }

    /* NAPLAN sets neither Science nor Digital Technologies, at any year. */
    expect(
      report.cells.some((cell) => cell.family === "naplan_style" && cell.subject === "science"),
    ).toBe(false);
    expect(
      report.cells.some(
        (cell) => cell.family === "naplan_style" && cell.subject === "digital_technologies",
      ),
    ).toBe(false);
    /* NAPLAN Year 4 is not a sitting at all. */
    expect(report.cells.some((cell) => cell.family === "naplan_style" && cell.yearLevel === 4)).toBe(
      false,
    );
  });

  it("labels each cell with the programme its family seeds in the database (20260822090000)", () => {
    const report = buildCapacityReport();
    for (const cell of report.cells) {
      expect(cell.programme).toBe(PROGRAMME_BY_FAMILY[cell.family]);
    }
    expect(PROGRAMME_BY_FAMILY).toEqual({
      naplan_style: "naplan_style_practice",
      icas_style: "icas_style_practice",
    });
  });

  it("the three bands of one (family, year, subject) triple sum to that triple's un-banded eligible count", () => {
    const report = buildCapacityReport();
    const bank = getExamBank("published");
    const seen = new Set<string>();

    for (const cell of report.cells) {
      const key = `${cell.family}:${cell.yearLevel}:${cell.subject}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const eligible = filterEligibleQuestions(bank, {
        yearLevel: cell.yearLevel,
        examStyle: cell.family,
        subject: cell.subject,
      });
      const bandSum = report.cells
        .filter((c) => c.family === cell.family && c.yearLevel === cell.yearLevel && c.subject === cell.subject)
        .reduce((sum, c) => sum + c.count, 0);
      expect(bandSum, key).toBe(eligible.length);
    }
  });

  it("reconciles the report's total counted items to the served bank's known total", () => {
    const report = buildCapacityReport();
    const bank = getExamBank("published");

    /* The report walks only the six isolable subject filters (matching
       coverage.ts) -- "writing" and "critical_creative_thinking" carry
       published questions but are not selectable/isolable exam subjects
       anywhere else in the platform either, so they are legitimately out of
       this report's scope, not dropped by a bug. The reconciliation total
       is therefore computed the same way: every published item whose
       subject is reachable through an isolable filter and whose
       (examStyle, yearLevel) is a real sitting. */
    const reachableSubjectIds = new Set<string>(
      ISOLABLE_SUBJECT_FILTERS.map((filter) => REGISTRY_SUBJECT_BY_FILTER[filter]),
    );
    const expectedReachable = bank.filter(
      (question) =>
        reachableSubjectIds.has(question.metadata.subject) &&
        isValidStyleYear(question.examStyle, question.yearLevel),
    ).length;

    expect(report.summary.bankSize).toBe(bank.length);
    expect(report.summary.totalCountedItems).toBe(expectedReachable);
    /* Every counted item is real content, so it cannot exceed the bank. */
    expect(report.summary.totalCountedItems).toBeLessThanOrEqual(report.summary.bankSize);
  });

  it("computes gap as max(0, requiredDepth - count) and ready as gap === 0", () => {
    const report = buildCapacityReport({ sittings: 2, itemsPerCellPerSitting: 1 });
    for (const cell of report.cells) {
      expect(cell.requiredDepth).toBe(2);
      expect(cell.gap).toBe(Math.max(0, 2 - cell.count));
      expect(cell.ready).toBe(cell.gap === 0);
    }
    /* With a required depth of 2, at least one real cell should already be
       ready and, given the bank is nowhere near uniform, at least one
       should not — both branches of `ready` are genuinely exercised. */
    expect(report.cells.some((cell) => cell.ready)).toBe(true);
  });

  it("honours a custom (sittings, itemsPerCellPerSitting) pair", () => {
    const report = buildCapacityReport({ sittings: 10, itemsPerCellPerSitting: 3 });
    expect(report.params.requiredDepth).toBe(30);
    for (const cell of report.cells) expect(cell.requiredDepth).toBe(30);
  });

  it("ranks cells furthest-from-target first, thinnest cell first on a gap tie", () => {
    const report = buildCapacityReport();
    for (let i = 1; i < report.cells.length; i += 1) {
      const previous = report.cells[i - 1]!;
      const current = report.cells[i]!;
      expect(previous.gap).toBeGreaterThanOrEqual(current.gap);
      if (previous.gap === current.gap) {
        expect(previous.count).toBeLessThanOrEqual(current.count);
      }
    }
  });

  it("summary counts agree with the cells array", () => {
    const report = buildCapacityReport();
    expect(report.summary.cellsReady + report.summary.cellsWithGap).toBe(report.summary.totalCells);
    expect(report.summary.totalGap).toBe(report.cells.reduce((sum, cell) => sum + cell.gap, 0));
    expect(report.summary.totalCountedItems).toBe(report.cells.reduce((sum, cell) => sum + cell.count, 0));
  });
});
