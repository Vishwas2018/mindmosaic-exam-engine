import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { practiceQuestionSeeds } from "@/content/questions/generated/generated-questions";
import { PROGRAMS, type Program } from "@/features/catalogue/catalogue";
import { filterEligibleQuestions, type ExamSelectionConfig } from "@/features/exam-engine/selection";
import { getExamBank } from "@/server/exam-bank";

/**
 * The extended practice bank is opt-IN. Every surface, every default.
 *
 * Found by live functional verification (5 August 2026): a signed-in Grade 5
 * student opening /practice/[program] saw "Include the extended practice bank
 * (1000+ extra auto-generated questions)" already ticked. Those ~1,100 seeds
 * have never been through the publication chain, and the publication policy
 * makes them reachable only by explicit opt-in.
 *
 * There were two independent causes, so there are two groups of cases:
 *
 *  1. ExamConfigurator initialised its checkbox from `initialBankId`, which
 *     five catalogue programs pinned to "practice".
 *  2. /practice/session pooled `[...curated, ...practice]` unconditionally —
 *     no checkbox, no flag, no way to avoid it — behind every skill drill and
 *     the "Diagnostic check" launcher on /student/learn.
 *
 * ---------------------------------------------------------------------------
 * A NOTE ON `status`, because it is the obvious thing to assert and it does
 * not work: every question in every bank carries `status: "published"`,
 * including all 1,103 auto-generated seeds. `origin` is no better —
 * QUESTION_ORIGINS has exactly one member. Neither field distinguishes gated
 * from ungated content, so a test asserting "no question whose status isn't
 * published" passes trivially against the seed pool and proves nothing.
 *
 * The only real discriminator is bank membership, which is what these assert.
 * ---------------------------------------------------------------------------
 */

const seedIds = new Set(practiceQuestionSeeds.map((question) => question.id));

type ScopedProgram = Program & { scope: NonNullable<Program["scope"]> };

const scopedLivePrograms = PROGRAMS.filter(
  (program): program is ScopedProgram => program.status === "live" && program.scope !== undefined,
);

/** What ExamConfigurator resolves with the checkbox in its initial state. */
function defaultBankIdFor(program: ScopedProgram | null) {
  const initialBankId = program?.scope.initialBankId;
  /* Mirrors ExamConfigurator: includePractice starts false, so the bank is
     baseBankId — "published" for any pinned program, "curated" unscoped. */
  return initialBankId === undefined ? ("curated" as const) : ("published" as const);
}

function configFor(program: ScopedProgram): ExamSelectionConfig {
  return {
    yearLevel: program.scope.yearLevel,
    examStyle: program.scope.examStyle,
    subject: program.scope.subject,
    questionCount: 10,
    timing: "timed",
  };
}

describe("the extended bank is never a default", () => {
  it("no catalogue program pins the seed-inclusive bank", () => {
    const onPractice = scopedLivePrograms
      .filter((program) => program.scope.initialBankId === "practice")
      .map((program) => program.id);
    expect(onPractice).toEqual([]);
  });

  /*
   * The load-bearing one. For every program a learner can open, the bank the
   * configurator resolves in its INITIAL state must contain no seed.
   */
  it.each(scopedLivePrograms.map((program) => [program.id, program] as const))(
    "%s serves no ungated seed with the configurator's default config",
    (_id, program) => {
      const bank = getExamBank(defaultBankIdFor(program));
      const eligible = filterEligibleQuestions(bank, configFor(program));
      const leaked = eligible.filter((question) => seedIds.has(question.id));
      expect(leaked.map((question) => question.id)).toEqual([]);
    },
  );

  it("the unscoped configurator default is also seed-free", () => {
    const bank = getExamBank(defaultBankIdFor(null));
    expect(bank.filter((question) => seedIds.has(question.id))).toEqual([]);
  });

  /* Opting in has to actually widen the pool, or the toggle is theatre. */
  it("opting in genuinely adds the seed pool", () => {
    const gated = getExamBank("published");
    const extended = getExamBank("practice");
    expect(extended.length).toBeGreaterThan(gated.length);
    expect(extended.filter((question) => seedIds.has(question.id)).length).toBe(seedIds.size);
  });
});
