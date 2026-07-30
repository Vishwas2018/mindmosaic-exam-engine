import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { practiceQuestionSeeds } from "@/content/questions/generated/generated-questions";
import { factoryPublishedQuestions } from "@/content/questions/generated";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { PROGRAMS, type Program } from "@/features/catalogue/catalogue";
import {
  filterEligibleQuestions,
  selectExamQuestions,
  type ExamSelectionConfig,
} from "@/features/exam-engine/selection";
import { getExamBank } from "@/server/exam-bank";

/**
 * Publication reachability and gating.
 *
 * Nothing else in the suite asserted publication behaviour at all, which is
 * how two successive defects reached a human instead of a test:
 *
 *  1. the five NAPLAN programs sat on `initialBankId: "curated"`, so the 288
 *     factory-published questions were unreachable from every program that
 *     could plausibly serve them — publishing had no user-visible effect;
 *  2. re-pointing them at `"practice"` made them reachable but made the ~1,100
 *     auto-generated seeds, which have never been through the publication
 *     gates, those programs' DEFAULT pool.
 *
 * The two halves of that are in tension, so both directions are asserted here:
 * a "published"-bank program must serve gate-passed factory content, AND must
 * serve none of the ungated seed pool. A regression in either direction fails.
 */

/* Identity by id, not by id prefix: the pools are separate modules and a
   naming convention is not a membership test. */
const seedIds = new Set(practiceQuestionSeeds.map((question) => question.id));
const publishedIds = new Set(factoryPublishedQuestions.map((question) => question.id));
const curatedIds = new Set(questionBank.map((question) => question.id));

/**
 * The programs deliberately left on the seed-inclusive "practice" bank: their
 * curated+published coverage is too thin to fill the smallest selectable exam,
 * so their pre-existing seed exposure is retained as a content decision rather
 * than a publication one. Pinned as an exact set so that moving any OTHER
 * program onto "practice" — re-introducing ungated-content-by-default — fails
 * this test rather than shipping.
 */
const PROGRAMS_ALLOWED_ON_PRACTICE_BANK = [
  "icas-g3-language",
  "icas-g3-numeracy",
  "icas-g3-reading",
  "icas-g5-language",
  "icas-g5-reading",
] as const;

/** The smallest fixed count a learner can pick, so "usable", not merely "non-empty". */
const SMALLEST_FIXED_COUNT = 10;

/**
 * Every fixed count the configurator offers (QUESTION_COUNT_OPTIONS is
 * 10 | 20 | 30 | "full"). "full" needs no bar — it selects whatever is
 * eligible — but the fixed counts do: selectExamQuestions returns
 * `insufficient_questions` and the Start button disables when eligible <
 * requested. So a program only belongs on "published" if its gated pool
 * covers the largest of these; otherwise flipping it would take away exam
 * lengths that work today.
 */
const OFFERED_FIXED_COUNTS = [10, 20, 30] as const;
const LARGEST_FIXED_COUNT = 30;

type ScopedProgram = Program & { scope: NonNullable<Program["scope"]> };

const scopedLivePrograms = PROGRAMS.filter(
  (program): program is ScopedProgram => program.status === "live" && program.scope !== undefined,
);

const publishedBankPrograms = scopedLivePrograms.filter(
  (program) => program.scope.initialBankId === "published",
);

function configFor(
  program: ScopedProgram,
  questionCount: ExamSelectionConfig["questionCount"] = SMALLEST_FIXED_COUNT,
): ExamSelectionConfig {
  return {
    yearLevel: program.scope.yearLevel,
    examStyle: program.scope.examStyle,
    subject: program.scope.subject,
    questionCount,
    timing: "timed",
  };
}

describe("publishedExamBank — the gated pool", () => {
  it("is exactly the curated bank plus the factory-published pool", () => {
    expect(publishedExamBank).toHaveLength(questionBank.length + factoryPublishedQuestions.length);
    const ids = new Set(publishedExamBank.map((question) => question.id));
    expect(ids.size).toBe(publishedExamBank.length);
    for (const question of questionBank) expect(ids.has(question.id)).toBe(true);
    for (const question of factoryPublishedQuestions) expect(ids.has(question.id)).toBe(true);
  });

  it("contains no auto-generated seed question", () => {
    const leaked = publishedExamBank.filter((question) => seedIds.has(question.id));
    expect(leaked.map((question) => question.id)).toEqual([]);
  });

  it("leaves the curated bank unmutated", () => {
    expect(questionBank).toHaveLength(100);
    expect(questionBank.every((question) => !seedIds.has(question.id))).toBe(true);
  });

  it("is what the server gateway returns for the 'published' bank id", () => {
    expect(getExamBank("published")).toBe(publishedExamBank);
  });
});

describe("catalogue programs on the 'published' bank", () => {
  /*
   * naplan-g3-language and icas-g5-numeracy joined this set once their gated
   * pools reached 34 and 39 eligible questions — enough for every offered
   * length. Pinned as an exact list so a program silently dropping back to
   * the seed-inclusive bank fails here.
   */
  it("covers every program routed at gate-passed content", () => {
    expect(publishedBankPrograms.map((program) => program.id).sort()).toEqual([
      "icas-g5-numeracy",
      "naplan-g3-language",
      "naplan-g3-numeracy",
      "naplan-g3-reading",
      "naplan-g5-language",
      "naplan-g5-numeracy",
      "naplan-g5-reading",
    ]);
  });

  it("never puts a program on the seed-inclusive 'practice' bank without a recorded reason", () => {
    const onPractice = scopedLivePrograms
      .filter((program) => program.scope.initialBankId === "practice")
      .map((program) => program.id)
      .sort();
    expect(onPractice).toEqual([...PROGRAMS_ALLOWED_ON_PRACTICE_BANK].sort());
  });

  it.each(publishedBankPrograms.map((program) => [program.id, program] as const))(
    "%s serves factory-published content",
    (_id, program) => {
      const eligible = filterEligibleQuestions(getExamBank("published"), configFor(program));
      const published = eligible.filter((question) => publishedIds.has(question.id));
      expect(published.length).toBeGreaterThan(0);
    },
  );

  it.each(publishedBankPrograms.map((program) => [program.id, program] as const))(
    "%s serves zero ungated seed questions",
    (_id, program) => {
      const eligible = filterEligibleQuestions(getExamBank("published"), configFor(program));
      const seeds = eligible.filter((question) => seedIds.has(question.id));
      expect(seeds.map((question) => question.id)).toEqual([]);
    },
  );

  it.each(publishedBankPrograms.map((program) => [program.id, program] as const))(
    "%s can fill the smallest selectable exam from gated content alone",
    (_id, program) => {
      const eligible = filterEligibleQuestions(getExamBank("published"), configFor(program));
      expect(eligible.length).toBeGreaterThanOrEqual(SMALLEST_FIXED_COUNT);
    },
  );

  /*
   * A known, pre-existing shortfall, recorded here rather than hidden by
   * weakening the assertion below. naplan-g3-reading has been on the
   * "published" bank since the original re-pointing, but only 17 questions
   * are eligible for it (10 curated + 7 factory-published) — so its 20- and
   * 30-question options already fail with "insufficient_questions" today.
   * This is a content gap, closed by publishing more Grade 3 NAPLAN-style
   * reading, not by moving the program back to the seed bank.
   */
  const KNOWN_LENGTH_SHORTFALLS = new Set(["naplan-g3-reading"]);

  it.each(
    publishedBankPrograms
      .filter((program) => !KNOWN_LENGTH_SHORTFALLS.has(program.id))
      .map((program) => [program.id, program] as const),
  )("%s fills every offered exam length from gated content alone", (_id, program) => {
    for (const count of OFFERED_FIXED_COUNTS) {
      const selection = selectExamQuestions(
        getExamBank("published"),
        configFor(program, count),
        `length-coverage-${program.id}-${count}`,
      );
      expect(selection.ok, `${program.id} cannot fill ${count} questions`).toBe(true);
      if (!selection.ok) continue;
      expect(selection.questions).toHaveLength(count);
      /* The whole point: no ungated content at any offered length. */
      for (const question of selection.questions) {
        expect(seedIds.has(question.id)).toBe(false);
      }
    }
  });

  /*
   * The exemption list is not a permanent allowance. Each program on it must
   * still genuinely be unable to fill the largest offered length from gated
   * content — once publishing closes that gap this fails, which is the
   * prompt to move the program onto "published".
   */
  it.each([...PROGRAMS_ALLOWED_ON_PRACTICE_BANK])(
    "%s is still on the seed bank only because gated content cannot fill the largest exam",
    (programId) => {
      const program = scopedLivePrograms.find((candidate) => candidate.id === programId);
      expect(program).toBeDefined();
      const eligible = filterEligibleQuestions(
        getExamBank("published"),
        configFor(program as ScopedProgram),
      );
      expect(
        eligible.length,
        `${programId} now has ${eligible.length} gated questions — move it to "published"`,
      ).toBeLessThan(LARGEST_FIXED_COUNT);
    },
  );

  /*
   * Requirement that survives every re-pointing: ungated content must never
   * be a default, but must stay deliberately reachable. The configurator
   * derives the checkbox's initial state from initialBankId
   * (ExamConfigurator.tsx: useState(initialBankId === "practice")) and the
   * toggle stays editable regardless of lockScope, so a program on
   * "published" starts with seeds off and the learner can still opt in.
   */
  it("starts every gated program with the extended-practice toggle off", () => {
    for (const program of publishedBankPrograms) {
      expect(program.scope.initialBankId === "practice").toBe(false);
    }
  });
});

describe("a real session started from a 'published' program", () => {
  /* One Grade 3 and one Grade 5 program, driven through the same selection
     function the exam routes call, over the same bank the server gateway
     hands them — not a hand-built fixture. */
  const cases = ["naplan-g3-numeracy", "naplan-g5-reading"] as const;

  it.each(cases)("%s selects only gate-passed questions, including published ones", (programId) => {
    const program = publishedBankPrograms.find((candidate) => candidate.id === programId);
    expect(program).toBeDefined();

    /* Several seeds: a single seed can miss the published slice by chance and
       would make this assertion accidental rather than structural. */
    let sawPublished = false;
    for (let seed = 0; seed < 10; seed += 1) {
      const selection = selectExamQuestions(
        getExamBank("published"),
        configFor(program as ScopedProgram),
        `published-reachability-${programId}-${seed}`,
      );
      expect(selection.ok).toBe(true);
      if (!selection.ok) return;

      expect(selection.questions).toHaveLength(SMALLEST_FIXED_COUNT);
      for (const question of selection.questions) {
        expect(seedIds.has(question.id)).toBe(false);
        expect(curatedIds.has(question.id) || publishedIds.has(question.id)).toBe(true);
      }
      if (selection.questions.some((question) => publishedIds.has(question.id))) {
        sawPublished = true;
      }
    }
    expect(sawPublished).toBe(true);
  });
});
