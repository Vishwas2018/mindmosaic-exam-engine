import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PROGRAMS, type Program } from "@/features/catalogue/catalogue";
import { filterEligibleQuestions, type ExamSelectionConfig } from "@/features/exam-engine/selection";
import { getExamBank } from "@/server/exam-bank";

/**
 * The extended practice bank is opt-IN. Every surface, every default.
 *
 * In the seed-removal follow-up, all 1,103 unreviewed auto-generated seeds
 * were deleted from the repository. This suite asserts the seed bank no longer
 * exists / is not importable, that no catalogue program pins a seed bank,
 * and that all served banks (including "practice" alias) strictly equal the
 * governed published bank with zero ungated seed content.
 */

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

describe("the extended bank is never a default and seed bank is removed", () => {
  it("the ungated seed bank file no longer exists on disk", () => {
    const seedFile = resolve(process.cwd(), "src/content/questions/generated/generated-questions.ts");
    expect(existsSync(seedFile)).toBe(false);
  });

  it("no catalogue program pins the seed-inclusive bank", () => {
    const onPractice = scopedLivePrograms
      .filter((program) => program.scope.initialBankId === "practice")
      .map((program) => program.id);
    expect(onPractice).toEqual([]);
  });

  /*
   * For every program a learner can open, the bank the configurator resolves
   * in its INITIAL state must contain zero unreviewed seed questions.
   */
  it.each(scopedLivePrograms.map((program) => [program.id, program] as const))(
    "%s serves only governed content with zero ungated seeds with the configurator's default config",
    (_id, program) => {
      const bank = getExamBank(defaultBankIdFor(program));
      const eligible = filterEligibleQuestions(bank, configFor(program));
      const seedFormatItems = eligible.filter((q) => q.id.startsWith("gen-"));
      expect(seedFormatItems.map((q) => q.id)).toEqual([]);
    },
  );

  it("the unscoped configurator default is also seed-free", () => {
    const bank = getExamBank(defaultBankIdFor(null));
    expect(bank.filter((q) => q.id.startsWith("gen-"))).toEqual([]);
  });

  it("the practice bank alias returns only published questions and zero seeds", () => {
    const gated = getExamBank("published");
    const practice = getExamBank("practice");
    expect(practice).toBe(gated);
    expect(practice.filter((q) => q.id.startsWith("gen-"))).toEqual([]);
  });
});
