import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PROGRAMS } from "@/features/catalogue/catalogue";
import {
  ISOLABLE_SUBJECT_FILTERS,
  REGISTRY_SUBJECT_BY_FILTER,
} from "@/features/exam-engine/selection";
import { isSubjectSatIn } from "@/features/taxonomy/subject-registry";
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

describe("coverage cells", () => {
  it("materialises a cell for every real sitting and none for impossible ones", () => {
    const cells = getCoverageCells();

    /* Derived, not a fixed subjects-per-pair multiple: the grid stopped
       being uniform once Science and Digital Technologies arrived, since
       neither is sat under NAPLAN and Digital Technologies stops at Year
       7. Multiplying by a constant would have to be widened by hand for
       every subject added, and would silently accept a NAPLAN Science
       cell as long as the total happened to match. */
    const expected = validStyleYearPairs().flatMap(({ examStyle, yearLevel }) =>
      ISOLABLE_SUBJECT_FILTERS.filter((subject) =>
        isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[subject], examStyle, yearLevel),
      ),
    );
    expect(cells).toHaveLength(expected.length);

    for (const cell of cells) {
      expect(isValidStyleYear(cell.examStyle, cell.yearLevel)).toBe(true);
    }
    /* NAPLAN Year 4 is not a sitting, so it is absent — not present with a
       zero count. A cell that exists is a cell something can render. */
    expect(getCoverageCell(4, "naplan_style", "numeracy")).toBeUndefined();
    expect(getCoverageCell(1, "icas_style", "numeracy")).toBeUndefined();
  });

  it("materialises no NAPLAN cell for an ICAS-only subject", () => {
    /* NAPLAN assesses neither, at any year it runs. Absent rather than
       present-and-zero: an empty cell reads as "no content yet" when the
       truth is "this paper is not set". */
    for (const yearLevel of [3, 5, 7, 9] as const) {
      expect(getCoverageCell(yearLevel, "naplan_style", "science")).toBeUndefined();
      expect(
        getCoverageCell(yearLevel, "naplan_style", "digital_technologies"),
      ).toBeUndefined();
    }
  });

  it("stops Digital Technologies at Year 7 but carries Science to Year 12", () => {
    for (const yearLevel of [2, 3, 4, 5, 6, 7] as const) {
      expect(getCoverageCell(yearLevel, "icas_style", "digital_technologies")).toBeDefined();
    }
    for (const yearLevel of [8, 9, 10, 11, 12] as const) {
      expect(getCoverageCell(yearLevel, "icas_style", "digital_technologies")).toBeUndefined();
      expect(getCoverageCell(yearLevel, "icas_style", "science")).toBeDefined();
    }
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

  it("declares an expansion cell for every real sitting not already hand-written", () => {
    /* Years 3 and 5 now appear here too. Only the twelve hand-written
       cells (two styles x two years x numeracy/reading/language) are
       skipped, so Science and Digital Technologies get their Year 3 and
       Year 5 cells like any other year — the earlier year-level-only skip
       would have withheld them. */
    const expansionYears = new Set(
      scoped
        .filter((program) => program.status === "coming_soon")
        .map((program) => program.scope!.yearLevel),
    );
    expect([...expansionYears].sort((a, b) => a - b)).toEqual([
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("still skips the twelve hand-written Year 3 and 5 cells", () => {
    for (const style of ["naplan_style", "icas_style"] as const) {
      for (const yearLevel of [3, 5] as const) {
        for (const subject of ["numeracy", "reading", "language"] as const) {
          const matches = scoped.filter(
            (p) =>
              p.scope!.examStyle === style &&
              p.scope!.yearLevel === yearLevel &&
              p.scope!.subject === subject,
          );
          /* Exactly one, and it is the hand-written live one — never a
             hand-written program shadowed by a generated duplicate. */
          expect(matches).toHaveLength(1);
          expect(matches[0]!.status).toBe("live");
        }
      }
    }
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

  it("declares ICAS Science for Years 2-12 and nothing outside it", () => {
    const years = PROGRAMS.filter((p) => p.scope?.subject === "science").map(
      (p) => p.scope!.yearLevel,
    );
    expect([...years].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("declares ICAS Digital Technologies for Years 2-7 only", () => {
    /* ICAS sets no Digital Technologies paper above Year 7. Pinned by
       value rather than by count so a cell drifting to Year 8 fails here
       and not just in the coverage suite. */
    const years = PROGRAMS.filter((p) => p.scope?.subject === "digital_technologies").map(
      (p) => p.scope!.yearLevel,
    );
    expect([...years].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it("declares no NAPLAN program for an ICAS-only subject", () => {
    const offenders = PROGRAMS.filter(
      (program) =>
        program.scope?.examStyle === "naplan_style" &&
        (program.scope.subject === "science" ||
          program.scope.subject === "digital_technologies"),
    );
    expect(offenders).toEqual([]);
  });

  it("gives every Science and Digital Technologies program the gated bank and coming_soon", () => {
    /* Both subjects have no published content yet, so every cell must
       start conservative — a program may only go live once
       resolveProgramStatuses counts the questions server-side. */
    const fresh = PROGRAMS.filter(
      (p) => p.scope?.subject === "science" || p.scope?.subject === "digital_technologies",
    );
    expect(fresh.length).toBeGreaterThan(0);
    for (const program of fresh) {
      expect(program.status).toBe("coming_soon");
      expect(program.scope?.examStyle).toBe("icas_style");
      expect(program.scope?.initialBankId).toBe("published");
    }
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
