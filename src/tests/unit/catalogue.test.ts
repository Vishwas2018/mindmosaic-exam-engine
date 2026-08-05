import { describe, expect, it } from "vitest";

import { practiceExamBank, publishedExamBank } from "@/content/questions/practice-bank";
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
  published: publishedExamBank,
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

  /*
   * Two kinds of coming_soon entry now, and the difference is deliberate:
   *
   *  - the hand-written roadmap entries (Maths Olympiad, Singapore Maths)
   *    carry no scope, because there is no year/style/subject cell behind
   *    them at all;
   *  - the Years 1-12 expansion cells (T0a) DO carry a scope. That scope
   *    is what lets the server count their gated pool and promote them,
   *    and what the program route renders once they go live.
   *
   * Neither is routable while coming_soon: /practice/[program] resolves
   * status server-side and 404s anything not live.
   */
  it("roadmap coming_soon entries carry no exam scope", () => {
    const roadmap = comingSoonPrograms.filter(
      (program) => !program.id.startsWith("naplan-y") && !program.id.startsWith("icas-y"),
    );
    expect(roadmap.length).toBeGreaterThan(0);
    for (const program of roadmap) {
      expect(program.scope).toBeUndefined();
    }
  });

  it("expansion coming_soon cells carry a scope the server can resolve", () => {
    const expansion = comingSoonPrograms.filter((program) => program.scope !== undefined);
    expect(expansion.length).toBeGreaterThan(0);
    for (const program of expansion) {
      expect(program.scope?.initialBankId).toBe("published");
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

      /*
       * The three Grade 3 ICAS combinations cannot clear the smallest
       * selectable count from gated content: 7, 1 and 4 eligible questions
       * respectively, and nothing published for them by the factory.
       *
       * They used to pass this by pinning the seed-inclusive "practice"
       * bank — which also pre-ticked the configurator's opt-in and made
       * ~1,100 unreviewed questions their default pool, found live on
       * 5 August 2026. The pin was removed; this shortfall is what was
       * underneath it. Recorded here rather than papered over, and asserted
       * in the negative below so closing it fails loudly.
       *
       * Full accounting: src/tests/unit/published-bank-reachability.test.ts.
       */
      const cannotFillSmallest = ["icas-g3-numeracy", "icas-g3-reading", "icas-g3-language"];

      const eligibleForScope = () =>
        filterEligibleQuestions(bank, {
          yearLevel: scope.yearLevel,
          examStyle: scope.examStyle,
          subject: scope.subject,
        });

      if (cannotFillSmallest.includes(program.id)) {
        it(`is short of the smallest selectable count (${SMALLEST_FIXED_COUNT}) — delete its entry when this fails`, () => {
          expect(eligibleForScope().length).toBeLessThan(SMALLEST_FIXED_COUNT);
        });
      } else {
        it(`clears the smallest selectable question count (${SMALLEST_FIXED_COUNT}) from its initial bank`, () => {
          expect(eligibleForScope().length).toBeGreaterThanOrEqual(SMALLEST_FIXED_COUNT);
        });
      }
    },
  );

  it("the unscoped live program needs no per-program bank check (it exposes every filter combination, exactly like today's configurator)", () => {
    for (const program of unscopedLivePrograms) {
      expect(program.scope).toBeUndefined();
    }
  });
});
