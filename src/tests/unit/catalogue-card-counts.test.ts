import { describe, expect, it } from "vitest";

import { practiceExamBank, publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import { PROGRAMS, type Program } from "@/features/catalogue/catalogue";
import { estimatedDurationLabel } from "@/features/catalogue/presentation";
import {
  FIXED_EXAM_DURATION_SECONDS,
  buildBankEligibilitySummary,
  eligibilityKey,
  filterEligibleQuestions,
  type ExamBankId,
} from "@/features/exam-engine/selection";
import type { Question } from "@/schemas/question.schema";

const BANKS: Record<ExamBankId, readonly Question[]> = {
  curated: questionBank,
  published: publishedExamBank,
  practice: practiceExamBank,
};

const scopedLive = PROGRAMS.filter(
  (program): program is Program & { scope: NonNullable<Program["scope"]> } =>
    program.status === "live" && program.scope !== undefined,
);

/**
 * The catalogue card advertises "N questions available" and an estimated
 * length. Both are derived on the page from getBankEligibility(); this
 * re-derives them straight from the banks by a different route
 * (filterEligibleQuestions) and asserts the two agree, so a card can never
 * promise a pool or a sitting length the configurator then refuses.
 */
describe("catalogue card counts and durations", () => {
  describe.each(scopedLive.map((program) => [program.slug, program] as const))(
    "%s",
    (_slug, program) => {
      const bank = BANKS[program.scope.initialBankId];
      const summary = buildBankEligibilitySummary(bank)[eligibilityKey(program.scope)];
      const directCount = filterEligibleQuestions(bank, {
        yearLevel: program.scope.yearLevel,
        examStyle: program.scope.examStyle,
        subject: program.scope.subject,
      }).length;

      it("the advertised count is the bank's real eligible count", () => {
        expect(summary?.count).toBe(directCount);
        expect(directCount).toBeGreaterThan(0);
      });

      it("never offers a sitting length its pool cannot fill", () => {
        const label = estimatedDurationLabel(directCount);

        /*
         * A null label is the correct answer for a pool below the smallest
         * fixed length (10): there is no sitting to advertise, so the card
         * advertises none. The three Grade 3 ICAS programs are in that
         * state since they moved off the seed-inclusive bank — they have
         * 7, 1 and 4 eligible gated questions.
         *
         * This test's promise is "never advertise a length the pool cannot
         * fill", and no label keeps that promise. It is the pre-existing
         * content gap, not a new one; see
         * src/tests/unit/published-bank-reachability.test.ts for the full
         * accounting and the assertions that fail loudly when it closes.
         */
        if (label === null) {
          expect(directCount).toBeLessThan(10);
          return;
        }

        /* The largest minute figure the label mentions must correspond to a
           fixed length the pool can actually serve. */
        const minutes = label.match(/\d+/g)?.map(Number) ?? [];
        const highest = Math.max(...minutes);
        const servable = (["10", "20", "30"] as const)
          .filter((option) => directCount >= Number(option))
          .map((option) => FIXED_EXAM_DURATION_SECONDS[option] / 60);
        expect(servable).toContain(highest);
      });
    },
  );

  it("every scoped live program gets a count (none silently omitted from the cards)", () => {
    for (const program of scopedLive) {
      const summary = buildBankEligibilitySummary(BANKS[program.scope.initialBankId])[
        eligibilityKey(program.scope)
      ];
      expect(summary, `${program.slug} has no eligibility summary`).toBeDefined();
    }
  });

  /* The unscoped "Build your own practice" entry pins nothing, so there is no
     single pool to count — its card deliberately shows choices, not a figure. */
  it("the unscoped program is excluded from counting", () => {
    const unscoped = PROGRAMS.filter(
      (program) => program.status === "live" && program.scope === undefined,
    );
    expect(unscoped).toHaveLength(1);
    expect(unscoped[0]?.scope).toBeUndefined();
  });
});
