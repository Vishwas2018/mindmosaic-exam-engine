import { describe, expect, it } from "vitest";

import { practiceExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import {
  PROGRAMS,
  getProgramBySlug,
  type Program,
} from "@/features/catalogue/catalogue";
import {
  QUESTION_COUNT_OPTIONS,
  filterEligibleQuestions,
  type ExamBankId,
} from "@/features/exam-engine/selection";
import type { Question } from "@/schemas/question.schema";

/**
 * The smallest fixed question count a learner can actually pick
 * (QUESTION_COUNT_OPTIONS is [10, 20, 30, "full"]). A program whose pinned
 * dimensions can't even fill this smallest set isn't a usable live program
 * — it would present as broken the moment someone landed on its default
 * selection, which is a stronger bar than merely "not exactly zero".
 */
const SMALLEST_FIXED_COUNT = Math.min(
  ...QUESTION_COUNT_OPTIONS.filter(
    (option): option is Exclude<typeof option, "full"> => option !== "full",
  ),
);

const BANKS: Record<ExamBankId, readonly Question[]> = {
  curated: questionBank,
  practice: practiceExamBank,
};

const scopedLivePrograms = PROGRAMS.filter(
  (program): program is Program & { scope: NonNullable<Program["scope"]> } =>
    program.status === "live" && program.scope !== undefined,
);

const unscopedLivePrograms = PROGRAMS.filter(
  (program) => program.status === "live" && program.scope === undefined,
);

const comingSoonPrograms = PROGRAMS.filter((program) => program.status === "coming_soon");

describe("catalogue config", () => {
  it("has no duplicate ids or slugs", () => {
    const ids = PROGRAMS.map((program) => program.id);
    const slugs = PROGRAMS.map((program) => program.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every slug is a URL-safe, lower-case, hyphenated segment", () => {
    for (const program of PROGRAMS) {
      expect(program.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("getProgramBySlug finds every declared program and nothing else", () => {
    for (const program of PROGRAMS) {
      expect(getProgramBySlug(program.slug)).toBe(program);
    }
    expect(getProgramBySlug("does-not-exist")).toBeUndefined();
  });

  it("coming_soon programs carry no exam scope (nothing for a route to render)", () => {
    expect(comingSoonPrograms.length).toBeGreaterThan(0);
    for (const program of comingSoonPrograms) {
      expect(program.scope).toBeUndefined();
    }
  });

  it("has exactly one unscoped live program (the generic escape hatch)", () => {
    expect(unscopedLivePrograms).toHaveLength(1);
    expect(unscopedLivePrograms[0]?.slug).toBe("mixed-practice");
  });

  it("has at least one scoped live program per (grade, style) pairing", () => {
    const pairings = new Set(
      scopedLivePrograms.map((program) => `${program.scope.yearLevel}:${program.scope.examStyle}`),
    );
    expect(pairings).toEqual(
      new Set(["3:naplan_style", "5:naplan_style", "3:icas_style", "5:icas_style"]),
    );
  });

  describe.each(scopedLivePrograms.map((program) => [program.slug, program] as const))(
    "%s",
    (_slug, program) => {
      const { scope } = program;
      const bank = BANKS[scope.initialBankId];

      it(`is satisfiable against its initial bank ("${scope.initialBankId}") — not zero questions`, () => {
        const eligible = filterEligibleQuestions(bank, {
          yearLevel: scope.yearLevel,
          examStyle: scope.examStyle,
          subject: scope.subject,
        });
        expect(eligible.length).toBeGreaterThan(0);
      });

      it(`clears the smallest selectable question count (${SMALLEST_FIXED_COUNT}) from its initial bank`, () => {
        const eligible = filterEligibleQuestions(bank, {
          yearLevel: scope.yearLevel,
          examStyle: scope.examStyle,
          subject: scope.subject,
        });
        expect(eligible.length).toBeGreaterThanOrEqual(SMALLEST_FIXED_COUNT);
      });
    },
  );

  it("the unscoped live program needs no per-program bank check (it exposes every filter combination, exactly like today's configurator)", () => {
    for (const program of unscopedLivePrograms) {
      expect(program.scope).toBeUndefined();
    }
  });
});
