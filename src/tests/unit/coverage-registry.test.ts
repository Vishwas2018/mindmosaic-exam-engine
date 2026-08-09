import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PROGRAMS } from "@/features/catalogue/catalogue";
import {
  GATED_COVERAGE_THRESHOLD,
  getCoverageCell,
  getCoverageCells,
  resolveProgramStatuses,
  yearLevelsWithGatedCoverage,
} from "@/features/taxonomy/coverage";
import { isValidStyleYear, validStyleYearPairs } from "@/features/taxonomy/year-registry";

/**
 * Coverage: which (year, style, subject) cells we can actually serve.
 *
 * The point of keeping this apart from the year registry is that they
 * answer different questions and move on different schedules — the
 * registry says which sittings EXIST, this says which we have content for
 * today. These cases pin the boundary between them.
 */

const SUBJECTS_PER_CELL = 3;

describe("coverage cells", () => {
  it("materialises a cell for every real sitting and none for impossible ones", () => {
    const cells = getCoverageCells();
    expect(cells).toHaveLength(validStyleYearPairs().length * SUBJECTS_PER_CELL);

    for (const cell of cells) {
      expect(isValidStyleYear(cell.examStyle, cell.yearLevel)).toBe(true);
    }
    /* NAPLAN Year 4 is not a sitting, so it is absent — not present with a
       zero count. A cell that exists is a cell something can render. */
    expect(getCoverageCell(4, "naplan_style", "numeracy")).toBeUndefined();
    expect(getCoverageCell(1, "icas_style", "numeracy")).toBeUndefined();
  });

  it("marks a cell ready only at or above the threshold", () => {
    for (const cell of getCoverageCells()) {
      expect(cell.ready).toBe(cell.gatedCount >= GATED_COVERAGE_THRESHOLD);
    }
  });

  /*
   * The threshold is the largest fixed sitting length the configurator
   * offers. Tying them together is what stops the catalogue advertising a
   * program that cannot fill its own longest exam.
   */
  it("uses the largest offered sitting length as the bar", () => {
    expect(GATED_COVERAGE_THRESHOLD).toBe(30);
  });

  it("reports only Years 3 and 5 as covered today", () => {
    /* Widening the schema to Years 1-12 must not make any other year look
       available: content decides that, not types. */
    expect([...yearLevelsWithGatedCoverage()]).toEqual([3, 5]);
  });
});

describe("catalogue expansion cells", () => {
  const scoped = PROGRAMS.filter((program) => program.scope !== undefined);

  it("declares an expansion cell for every real sitting outside Years 3 and 5", () => {
    const expansionYears = new Set(
      scoped
        .filter((program) => program.status === "coming_soon")
        .map((program) => program.scope!.yearLevel),
    );
    expect([...expansionYears].sort((a, b) => a - b)).toEqual([2, 4, 6, 7, 8, 9, 10, 11, 12]);
  });

  /**
   * Years 4 and 6 are named explicitly rather than left to the year-set
   * assertion above. They are the two years the taxonomy was widened for,
   * and these six ids are what the sign-up grid and the practice
   * configurator will surface once content lands — worth failing by name
   * if a refactor of EXPANSION_PROGRAMS ever drops them.
   */
  it.each([
    "icas-y4-numeracy",
    "icas-y4-reading",
    "icas-y4-language",
    "icas-y6-numeracy",
    "icas-y6-reading",
    "icas-y6-language",
  ])("declares '%s' as a gated, scoped, coming_soon cell", (id) => {
    const program = PROGRAMS.find((entry) => entry.id === id);
    expect(program).toBeDefined();
    expect(program?.slug).toBe(id);
    expect(program?.status).toBe("coming_soon");
    expect(program?.scope?.examStyle).toBe("icas_style");
    expect(program?.scope?.initialBankId).toBe("published");
  });

  it("declares no NAPLAN-style Year 4 or Year 6 program — those sittings do not exist", () => {
    const impossible = PROGRAMS.filter(
      (program) =>
        program.scope?.examStyle === "naplan_style" &&
        [4, 6].includes(program.scope.yearLevel),
    );
    expect(impossible).toEqual([]);
  });

  it("never declares an impossible sitting", () => {
    for (const program of scoped) {
      expect(isValidStyleYear(program.scope!.examStyle, program.scope!.yearLevel)).toBe(true);
    }
  });

  it("keeps every expansion cell on the gated bank", () => {
    for (const program of scoped) {
      expect(program.scope!.initialBankId).not.toBe("practice");
    }
  });

  /*
   * The catalogue is imported by client components and cannot count
   * questions, so every expansion cell ships as coming_soon and the server
   * promotes it. The failure mode is "ready content shown as coming soon",
   * never "empty program shown as ready".
   */
  it("ships expansion cells as coming_soon before the server resolves them", () => {
    const yearSeven = PROGRAMS.find((p) => p.scope?.yearLevel === 7);
    expect(yearSeven?.status).toBe("coming_soon");
  });
});

describe("resolveProgramStatuses", () => {
  it("leaves an empty expansion cell as coming_soon", () => {
    const yearSeven = PROGRAMS.filter((p) => p.scope?.yearLevel === 7);
    expect(yearSeven.length).toBeGreaterThan(0);
    for (const program of resolveProgramStatuses(yearSeven)) {
      expect(program.status).toBe("coming_soon");
    }
  });

  it("promotes a cell once its gated pool clears the threshold", () => {
    /* Years 3/5 already have hand-written live programs, so the promotion
       path is exercised against a synthetic coming_soon cell pointed at a
       combination that genuinely has content. */
    const covered = getCoverageCells().find((cell) => cell.ready);
    expect(covered).toBeDefined();

    const [resolved] = resolveProgramStatuses([
      {
        status: "coming_soon" as const,
        scope: {
          yearLevel: covered!.yearLevel,
          examStyle: covered!.examStyle,
          subject: covered!.subject as "numeracy" | "reading" | "language",
        },
      },
    ]);
    expect(resolved.status).toBe("live");
  });

  it("never demotes a live program", () => {
    /* naplan-g3-reading has 17 eligible questions — below the threshold —
       and stays live. Deciding when a NEW program appears is a different
       decision from withdrawing one a learner is already using. */
    const live = PROGRAMS.filter((program) => program.status === "live");
    for (const program of resolveProgramStatuses(live)) {
      expect(program.status).toBe("live");
    }
  });

  it("leaves unscoped programs alone", () => {
    const unscoped = PROGRAMS.filter((program) => program.scope === undefined);
    expect(unscoped.length).toBeGreaterThan(0);
    const resolved = resolveProgramStatuses(unscoped);
    expect(resolved.map((p) => p.status)).toEqual(unscoped.map((p) => p.status));
  });
});
