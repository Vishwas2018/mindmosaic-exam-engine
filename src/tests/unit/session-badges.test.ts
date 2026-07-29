import { describe, expect, it } from "vitest";

import { computeSessionBadges } from "@/features/exam-engine/scoring/session-badges";
import type { ExamResult } from "@/features/exam-engine/scoring/exam-report";

function baseResult(overrides: Partial<ExamResult>): ExamResult {
  return {
    totalQuestions: 10,
    attemptedQuestions: 10,
    autoMarkedQuestions: 10,
    manualReviewQuestions: 0,
    correctCount: 10,
    incorrectCount: 0,
    unansweredCount: 0,
    objectiveMarksEarned: 10,
    objectiveMarksAvailable: 10,
    objectivePercentage: 100,
    pendingManualMarks: 0,
    timeTakenSeconds: 300,
    submissionReason: "user_submitted",
    startedAt: 0,
    submittedAt: 300_000,
    questionDetails: [],
    breakdowns: {
      byQuestionType: {},
      bySubject: {},
      bySkill: {},
      byDifficulty: {},
      byYearLevel: {},
      byExamStyle: {},
    },
    ...overrides,
  };
}

describe("computeSessionBadges", () => {
  it("awards Perfect score and Every question attempted for a 100% fully-attempted session", () => {
    const badges = computeSessionBadges(baseResult({}));
    expect(badges.map((b) => b.id)).toEqual(["perfect-score", "full-attempt"]);
  });

  it("awards High achiever instead of Perfect score for a 90-99% session", () => {
    const badges = computeSessionBadges(
      baseResult({ objectivePercentage: 92, correctCount: 9, incorrectCount: 1 }),
    );
    expect(badges.map((b) => b.id)).toContain("high-achiever");
    expect(badges.map((b) => b.id)).not.toContain("perfect-score");
  });

  it("awards no score badge below 90%", () => {
    const badges = computeSessionBadges(
      baseResult({ objectivePercentage: 60, correctCount: 6, incorrectCount: 4 }),
    );
    expect(badges.find((b) => b.id === "perfect-score" || b.id === "high-achiever")).toBeUndefined();
  });

  it("skips full-attempt when a question was left unanswered", () => {
    const badges = computeSessionBadges(baseResult({ unansweredCount: 1, attemptedQuestions: 9 }));
    expect(badges.map((b) => b.id)).not.toContain("full-attempt");
  });

  it("awards no score badge when there are no objective marks (e.g. all-writing session)", () => {
    const badges = computeSessionBadges(
      baseResult({ objectiveMarksAvailable: 0, objectivePercentage: 0 }),
    );
    expect(badges.find((b) => b.id === "perfect-score" || b.id === "high-achiever")).toBeUndefined();
  });
});
