import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { buildExamResult } from "@/features/exam-engine/scoring";
import { canonicalResponse } from "@/tests/fixtures/canonical-response";
import type { Question } from "@/schemas/question.schema";

function pick(id: string): Question {
  const question = questionBank.find((entry) => entry.id === id);
  if (!question) throw new Error(`Missing question ${id}`);
  return question;
}

const context = {
  startedAt: 1_000_000,
  submittedAt: 1_000_000 + 754_000,
  submissionReason: "user_submitted" as const,
};

describe("buildExamResult", () => {
  const essay = questionBank.find((question) => question.type === "essay")!;
  const objectiveA = pick("g3-nap-num-data-001");
  const objectiveB = pick("g3-nap-num-data-002");
  const objectiveC = pick("g3-nap-num-money-001");
  const questions = [objectiveA, objectiveB, objectiveC, essay];

  it("aggregates correct, incorrect, unanswered and manual review", () => {
    const result = buildExamResult(
      questions,
      {
        [objectiveA.id]: canonicalResponse(objectiveA),
        [objectiveB.id]: 9999,
        [essay.id]: "My writing answer.",
      },
      context,
    );

    expect(result.totalQuestions).toBe(4);
    expect(result.attemptedQuestions).toBe(3);
    expect(result.correctCount).toBe(1);
    expect(result.incorrectCount).toBe(1);
    expect(result.unansweredCount).toBe(1);
    expect(result.manualReviewQuestions).toBe(1);
    expect(result.autoMarkedQuestions).toBe(3);
    expect(result.timeTakenSeconds).toBe(754);
    expect(result.submissionReason).toBe("user_submitted");
  });

  it("excludes manual-review marks from the objective percentage", () => {
    const result = buildExamResult(
      questions,
      {
        [objectiveA.id]: canonicalResponse(objectiveA),
        [objectiveB.id]: canonicalResponse(objectiveB),
        [objectiveC.id]: canonicalResponse(objectiveC),
        [essay.id]: "My writing answer.",
      },
      context,
    );

    const objectiveAvailable =
      objectiveA.metadata.marks + objectiveB.metadata.marks + objectiveC.metadata.marks;
    expect(result.objectiveMarksAvailable).toBe(objectiveAvailable);
    expect(result.objectiveMarksEarned).toBe(objectiveAvailable);
    expect(result.objectivePercentage).toBe(100);
    expect(result.pendingManualMarks).toBe(essay.metadata.marks);
  });

  it("returns zero percent when no objective marks exist", () => {
    const result = buildExamResult([essay], { [essay.id]: "Writing." }, context);
    expect(result.objectiveMarksAvailable).toBe(0);
    expect(result.objectivePercentage).toBe(0);
  });

  it("treats empty responses as unanswered", () => {
    const result = buildExamResult(
      [objectiveA, objectiveB],
      { [objectiveA.id]: "", [objectiveB.id]: null },
      context,
    );
    expect(result.attemptedQuestions).toBe(0);
    expect(result.unansweredCount).toBe(2);
    expect(result.objectivePercentage).toBe(0);
  });

  it("breaks results down by type, subject, skill and difficulty", () => {
    const result = buildExamResult(
      questions,
      {
        [objectiveA.id]: canonicalResponse(objectiveA),
        /* Attempted, so this row exercises pending-review aggregation;
           blank-essay breakdown semantics are covered separately below. */
        [essay.id]: "My writing answer.",
      },
      context,
    );

    const typeRow = result.breakdowns.byQuestionType[objectiveA.type];
    expect(typeRow.total).toBeGreaterThan(0);
    expect(typeRow.correct).toBe(1);

    const subjectRow = result.breakdowns.bySubject.numeracy;
    expect(subjectRow.total).toBe(3);
    expect(subjectRow.objectiveMarksAvailable).toBe(3);

    const essaySubjectRow = result.breakdowns.bySubject.writing;
    expect(essaySubjectRow.manualReview).toBe(1);
    expect(essaySubjectRow.objectiveMarksAvailable).toBe(0);

    const skillRow =
      result.breakdowns.bySkill[
        objectiveA.metadata.skill ?? objectiveA.metadata.topic
      ];
    expect(skillRow.correct).toBe(1);

    const difficultyRow = result.breakdowns.byDifficulty[objectiveA.metadata.difficulty];
    expect(difficultyRow.total).toBeGreaterThan(0);

    expect(result.breakdowns.byYearLevel["year-3"].total).toBeGreaterThan(0);
    expect(Object.keys(result.breakdowns.byExamStyle).length).toBeGreaterThan(0);
  });

  it("clamps negative durations to zero", () => {
    const result = buildExamResult([objectiveA], {}, {
      ...context,
      submittedAt: context.startedAt - 5_000,
    });
    expect(result.timeTakenSeconds).toBe(0);
  });

  describe("blank essay semantics", () => {
    it.each([
      ["a missing response", undefined],
      ["an empty string", ""],
      ["a whitespace-only string", "   "],
    ])("counts %s as unanswered, not pending review", (_label, answer) => {
      const result = buildExamResult(
        [essay],
        answer === undefined ? {} : { [essay.id]: answer },
        context,
      );
      const detail = result.questionDetails[0];
      expect(detail.status).toBe("unanswered");
      expect(detail.attempted).toBe(false);
      expect(detail.pendingManualReview).toBe(false);
      expect(detail.requiresManualMarking).toBe(true);
      expect(result.unansweredCount).toBe(1);
      expect(result.manualReviewQuestions).toBe(0);
      expect(result.pendingManualMarks).toBe(0);
    });

    it("counts a non-blank essay as attempted and pending review", () => {
      const result = buildExamResult([essay], { [essay.id]: "My essay." }, context);
      const detail = result.questionDetails[0];
      expect(detail.status).toBe("manual_review");
      expect(detail.attempted).toBe(true);
      expect(detail.pendingManualReview).toBe(true);
      expect(result.manualReviewQuestions).toBe(1);
      expect(result.pendingManualMarks).toBe(essay.metadata.marks);
    });

    it("returns to unanswered semantics when a written essay is cleared", () => {
      const written = buildExamResult([essay], { [essay.id]: "Some text" }, context);
      expect(written.questionDetails[0].status).toBe("manual_review");
      const cleared = buildExamResult([essay], { [essay.id]: "" }, context);
      expect(cleared.questionDetails[0].status).toBe("unanswered");
      expect(cleared.manualReviewQuestions).toBe(0);
    });

    it("keeps the objective denominator unchanged by essay attempt state", () => {
      const blank = buildExamResult(
        [objectiveA, essay],
        { [objectiveA.id]: canonicalResponse(objectiveA) },
        context,
      );
      const attempted = buildExamResult(
        [objectiveA, essay],
        { [objectiveA.id]: canonicalResponse(objectiveA), [essay.id]: "Some text" },
        context,
      );
      expect(blank.objectiveMarksAvailable).toBe(objectiveA.metadata.marks);
      expect(attempted.objectiveMarksAvailable).toBe(objectiveA.metadata.marks);
      expect(blank.objectivePercentage).toBe(100);
      expect(attempted.objectivePercentage).toBe(100);
    });

    it("excludes only blank essays from breakdown pending-manual counts while keeping totals", () => {
      const result = buildExamResult(
        [essay],
        {},
        context,
      );
      const row = result.breakdowns.byQuestionType.essay;
      expect(row.total).toBe(1);
      expect(row.unanswered).toBe(1);
      expect(row.manualReview).toBe(0);
      expect(row.objectiveMarksAvailable).toBe(0);
      expect(row.objectiveMarksEarned).toBe(0);
    });

    it("handles multiple essays with mixed attempted and unattempted states", () => {
      /* The production bank ships a single essay fixture; exercise mixed
         states with two independent instances of it under different ids
         so the aggregate math is verified across more than one row. */
      const essayTwo: Question = { ...essay, id: `${essay.id}-second` };
      const result = buildExamResult(
        [essay, essayTwo],
        { [essay.id]: "Written.", [essayTwo.id]: "" },
        context,
      );
      expect(result.attemptedQuestions).toBe(1);
      expect(result.unansweredCount).toBe(1);
      expect(result.manualReviewQuestions).toBe(1);
      expect(result.pendingManualMarks).toBe(essay.metadata.marks);
    });
  });
});
