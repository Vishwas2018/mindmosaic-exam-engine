import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/question-bank";
import { scoreExam, scoreQuestion } from "@/features/exam-engine/scoring";

describe("exam scoring", () => {
  it("scores an objective response without React state", () => {
    expect(scoreQuestion(questionBank[0], "east")).toMatchObject({
      status: "correct",
      awardedMarks: 1,
      availableMarks: 1,
    });
  });

  it("aggregates the three-question sample attempt", () => {
    const result = scoreExam(questionBank, {
      "g3-naplan-bean-beds": "east",
      "g3-icas-library-trolley": 19,
      "g5-naplan-juice-cups": "four",
    });

    expect(result).toMatchObject({
      awardedMarks: 2,
      availableMarks: 3,
      percentage: 67,
      correctCount: 2,
      incorrectCount: 1,
    });
  });
});
