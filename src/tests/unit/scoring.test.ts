import { describe, expect, it } from "vitest";

import { sampleQuestions } from "@/content/questions/sample-questions";
import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import {
  scoreDragDrop,
  scoreDropdown,
  scoreEssay,
  scoreExam,
  scoreFillBlank,
  scoreHotspot,
  scoreMatching,
  scoreMultipleSelect,
  scoreNumberEntry,
  scoreOrdering,
  scoreQuestion,
  scoreReadingComprehension,
  scoreShortAnswer,
} from "@/features/exam-engine/scoring";
import { questionSchema, type Question } from "@/schemas/question.schema";

function find(id: string): Question {
  const question = showcaseQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing fixture ${id}`);
  return question;
}

describe("legacy sample scoring", () => {
  it("scores an objective response", () => {
    expect(scoreQuestion(sampleQuestions[0], "east")).toMatchObject({
      status: "correct",
      awardedMarks: 1,
    });
  });

  it("aggregates a mixed attempt", () => {
    const result = scoreExam(sampleQuestions, {
      "g3-naplan-bean-beds": "east",
      "g3-icas-library-trolley": 19,
      "g5-naplan-juice-cups": "four",
    });
    expect(result).toMatchObject({
      awardedMarks: 2,
      percentage: 67,
      correctCount: 2,
      incorrectCount: 1,
    });
  });
});

describe("multiple choice", () => {
  const q = find("showcase-multiple-choice");
  it("marks the right option correct", () => {
    expect(scoreQuestion(q, "n48").status).toBe("correct");
  });
  it("marks a wrong option incorrect", () => {
    expect(scoreQuestion(q, "n42").status).toBe("incorrect");
  });
  it("treats no answer as unanswered", () => {
    expect(scoreQuestion(q, null).status).toBe("unanswered");
  });
});

describe("multiple select exact-set", () => {
  const q = find("showcase-multiple-select");
  it("accepts the exact set in any order", () => {
    expect(scoreMultipleSelect(q, ["n34", "n12", "n20"]).correct).toBe(true);
  });
  it("rejects an extra selection", () => {
    expect(scoreMultipleSelect(q, ["n12", "n20", "n34", "n15"]).correct).toBe(false);
  });
  it("rejects a missing selection", () => {
    expect(scoreMultipleSelect(q, ["n12", "n20"]).correct).toBe(false);
  });
  it("is unanswered when empty", () => {
    expect(scoreMultipleSelect(q, []).status).toBe("unanswered");
  });
});

describe("number entry tolerance", () => {
  const exact = find("showcase-number-entry");
  it("accepts the exact value", () => {
    expect(scoreNumberEntry(exact, 42).correct).toBe(true);
  });
  it("rejects a value outside a zero tolerance", () => {
    expect(scoreNumberEntry(exact, 43).correct).toBe(false);
  });
  it("respects a configured tolerance", () => {
    const tolerant = questionSchema.parse({
      ...exact,
      id: "tolerant-number",
      answerKey: { kind: "number", value: 10, tolerance: 0.5 },
    });
    expect(scoreNumberEntry(tolerant, 10.4).correct).toBe(true);
    expect(scoreNumberEntry(tolerant, 10.6).correct).toBe(false);
  });
});

describe("fill blank normalisation", () => {
  const q = find("showcase-fill-blank");
  it("accepts matching answers", () => {
    expect(scoreFillBlank(q, { triangle: "3", hexagon: "six" }).correct).toBe(true);
  });
  it("ignores case and surrounding whitespace", () => {
    expect(scoreFillBlank(q, { triangle: " 3 ", hexagon: "SIX" }).correct).toBe(true);
  });
  it("fails when a blank is wrong", () => {
    expect(scoreFillBlank(q, { triangle: "4", hexagon: "6" }).correct).toBe(false);
  });
  it("fails when a blank is empty", () => {
    expect(scoreFillBlank(q, { triangle: "3" }).correct).toBe(false);
  });
});

describe("dropdown", () => {
  const q = find("showcase-dropdown");
  it("is correct when every field is right", () => {
    expect(scoreDropdown(q, { "sentence-a": "mult", "sentence-b": "div" }).correct).toBe(true);
  });
  it("is incorrect when a field is wrong", () => {
    expect(scoreDropdown(q, { "sentence-a": "add", "sentence-b": "div" }).correct).toBe(false);
  });
});

describe("true false", () => {
  const q = find("showcase-true-false");
  it("matches the boolean answer", () => {
    expect(scoreQuestion(q, true).status).toBe("correct");
    expect(scoreQuestion(q, false).status).toBe("incorrect");
  });
});

describe("matching", () => {
  const q = find("showcase-matching");
  it("is correct with every pair right", () => {
    expect(scoreMatching(q, { frog: "amphibian", snake: "reptile", eagle: "bird" }).correct).toBe(true);
  });
  it("is incorrect with a wrong pair", () => {
    expect(scoreMatching(q, { frog: "reptile", snake: "reptile", eagle: "bird" }).correct).toBe(false);
  });
});

describe("ordering", () => {
  const q = find("showcase-ordering");
  it("requires the exact sequence", () => {
    expect(scoreOrdering(q, ["n7", "n19", "n42", "n88"]).correct).toBe(true);
    expect(scoreOrdering(q, ["n7", "n42", "n19", "n88"]).correct).toBe(false);
  });
});

describe("short answer", () => {
  const q = find("showcase-short-answer");
  it("accepts a normalised answer", () => {
    expect(scoreShortAnswer(q, "Perimeter").correct).toBe(true);
    expect(scoreShortAnswer(q, "  perimeter ").correct).toBe(true);
  });
  it("rejects a different answer", () => {
    expect(scoreShortAnswer(q, "area").correct).toBe(false);
  });
});

describe("reading comprehension delegation", () => {
  it("delegates option-based reading to choice scoring", () => {
    expect(scoreReadingComprehension(find("showcase-reading-mcq"), "grow").correct).toBe(true);
  });
  it("delegates text-based reading to short-answer scoring", () => {
    expect(scoreReadingComprehension(find("showcase-reading-short"), "bean").correct).toBe(true);
  });
});

describe("label diagram", () => {
  const q = find("showcase-label-diagram");
  it("is correct when every label is placed correctly", () => {
    expect(scoreQuestion(q, { leaf: "top", stem: "middle", roots: "bottom" }).status).toBe("correct");
  });
  it("is incorrect with a misplacement", () => {
    expect(scoreQuestion(q, { leaf: "bottom", stem: "middle", roots: "top" }).status).toBe("incorrect");
  });
});

describe("hotspot", () => {
  const q = find("showcase-hotspot");
  it("matches the configured region", () => {
    expect(scoreHotspot(q, ["large"]).correct).toBe(true);
  });
  it("rejects the wrong region", () => {
    expect(scoreHotspot(q, ["small"]).correct).toBe(false);
  });
  it("rejects an extra region", () => {
    expect(scoreHotspot(q, ["large", "small"]).correct).toBe(false);
  });
});

describe("drag drop", () => {
  const q = find("showcase-drag-drop");
  it("is correct with every item placed correctly", () => {
    expect(scoreDragDrop(q, { n4: "even", n7: "odd", n10: "even" }).correct).toBe(true);
  });
  it("is incorrect with a wrong placement", () => {
    expect(scoreDragDrop(q, { n4: "odd", n7: "odd", n10: "even" }).correct).toBe(false);
  });
});

describe("essay manual review", () => {
  const q = find("showcase-essay");
  it("returns a manual-review outcome for a non-blank response", () => {
    expect(scoreEssay(q, "Any written response")).toEqual({
      status: "manual_review",
      correct: null,
      earnedMarks: null,
      availableMarks: q.metadata.marks,
      requiresManualMarking: true,
      manualReviewRequired: true,
    });
  });
  it("never auto-marks a non-blank response as correct or incorrect", () => {
    expect(scoreEssay(q, "Any written response").correct).toBeNull();
  });

  it.each([
    ["a missing response", undefined],
    ["a null response", null],
    ["an empty string", ""],
    ["a whitespace-only string", "   "],
  ])("treats %s as unanswered, not pending review", (_label, answer) => {
    const scored = scoreEssay(q, answer as never);
    expect(scored.status).toBe("unanswered");
    expect(scored.manualReviewRequired).toBe(false);
    expect(scored.correct).toBe(false);
    expect(scored.earnedMarks).toBe(0);
    /* Still identifiable as a manually marked question type even blank. */
    expect(scored.requiresManualMarking).toBe(true);
  });

  it("becomes unanswered again if a written response is cleared", () => {
    const written = scoreEssay(q, "Some text");
    expect(written.status).toBe("manual_review");
    const cleared = scoreEssay(q, "");
    expect(cleared.status).toBe("unanswered");
    expect(cleared.manualReviewRequired).toBe(false);
  });
});

describe("AMC weighted scoring (max 135, no penalty)", () => {
  function makeAmcPaper(): Question[] {
    const questions: Question[] = [];
    // 10 x 3-mark MC (Q1-10)
    for (let i = 1; i <= 10; i++) {
      questions.push({
        id: `amc-q${i}`,
        type: "multiple_choice",
        yearLevel: 3,
        examStyle: "amc_style",
        status: "published",
        origin: "original_seed",
        prompt: `Question ${i}`,
        options: [
          { id: "A", text: "1" },
          { id: "B", text: "2" },
          { id: "C", text: "3" },
          { id: "D", text: "4" },
          { id: "E", text: "5" },
        ],
        visuals: [],
        answerKey: { kind: "single_option", optionId: "A" },
        explanation: `Explanation ${i}`,
        metadata: {
          subject: "amc_mathematics",
          strand: "Number & Arithmetic",
          topic: "Arithmetic",
          difficulty: "easy",
          estimatedTimeSeconds: 60,
          marks: 3,
        },
      } as unknown as Question);
    }
    // 10 x 4-mark MC (Q11-20)
    for (let i = 11; i <= 20; i++) {
      questions.push({
        id: `amc-q${i}`,
        type: "multiple_choice",
        yearLevel: 3,
        examStyle: "amc_style",
        status: "published",
        origin: "original_seed",
        prompt: `Question ${i}`,
        options: [
          { id: "A", text: "1" },
          { id: "B", text: "2" },
          { id: "C", text: "3" },
          { id: "D", text: "4" },
          { id: "E", text: "5" },
        ],
        visuals: [],
        answerKey: { kind: "single_option", optionId: "B" },
        explanation: `Explanation ${i}`,
        metadata: {
          subject: "amc_mathematics",
          strand: "Patterns & Algebra",
          topic: "Patterns",
          difficulty: "medium",
          estimatedTimeSeconds: 90,
          marks: 4,
        },
      } as unknown as Question);
    }
    // 5 x 5-mark MC (Q21-25)
    for (let i = 21; i <= 25; i++) {
      questions.push({
        id: `amc-q${i}`,
        type: "multiple_choice",
        yearLevel: 3,
        examStyle: "amc_style",
        status: "published",
        origin: "original_seed",
        prompt: `Question ${i}`,
        options: [
          { id: "A", text: "1" },
          { id: "B", text: "2" },
          { id: "C", text: "3" },
          { id: "D", text: "4" },
          { id: "E", text: "5" },
        ],
        visuals: [],
        answerKey: { kind: "single_option", optionId: "C" },
        explanation: `Explanation ${i}`,
        metadata: {
          subject: "amc_mathematics",
          strand: "Geometry & Measurement",
          topic: "Geometry",
          difficulty: "challenging",
          estimatedTimeSeconds: 120,
          marks: 5,
        },
      } as unknown as Question);
    }
    // 5 x 6..10-mark Number Entry (Q26-30)
    const tailMarks = [6, 7, 8, 9, 10];
    for (let i = 26; i <= 30; i++) {
      const marks = tailMarks[i - 26]!;
      questions.push({
        id: `amc-q${i}`,
        type: "number_entry",
        yearLevel: 3,
        examStyle: "amc_style",
        status: "published",
        origin: "original_seed",
        prompt: `Question ${i}`,
        options: [],
        visuals: [],
        answerKey: { kind: "number", value: 42, tolerance: 0 },
        explanation: `Explanation ${i}`,
        metadata: {
          subject: "amc_mathematics",
          strand: "Logic & Problem-Solving",
          topic: "Problem Solving",
          difficulty: "challenging",
          estimatedTimeSeconds: 180,
          marks,
        },
      } as unknown as Question);
    }
    return questions;
  }

  it("calculates maximum total marks of 135 for a full 30-item AMC paper", () => {
    const paper = makeAmcPaper();
    expect(paper).toHaveLength(30);
    const totalMarks = paper.reduce((sum, q) => sum + (q.metadata.marks ?? 1), 0);
    expect(totalMarks).toBe(135);
  });

  it("scores 135/135 (100%) when all answers are correct", () => {
    const paper = makeAmcPaper();
    const responses: Record<string, string | number> = {};
    for (let i = 1; i <= 10; i++) responses[`amc-q${i}`] = "A";
    for (let i = 11; i <= 20; i++) responses[`amc-q${i}`] = "B";
    for (let i = 21; i <= 25; i++) responses[`amc-q${i}`] = "C";
    for (let i = 26; i <= 30; i++) responses[`amc-q${i}`] = 42;

    const result = scoreExam(paper, responses);
    expect(result.availableMarks).toBe(135);
    expect(result.awardedMarks).toBe(135);
    expect(result.percentage).toBe(100);
    expect(result.correctCount).toBe(30);
    expect(result.incorrectCount).toBe(0);
    expect(result.unansweredCount).toBe(0);
  });

  it("scores with no penalty for wrong answers (0 marks per wrong item)", () => {
    const paper = makeAmcPaper();
    const responses: Record<string, string | number> = {
      // 2 x 3-mark correct = 6 marks
      "amc-q1": "A",
      "amc-q2": "A",
      // 1 x 3-mark wrong = 0 marks (no penalty)
      "amc-q3": "E",
      // 1 x 4-mark correct = 4 marks
      "amc-q11": "B",
      // 1 x 4-mark wrong = 0 marks
      "amc-q12": "E",
      // 1 x 10-mark correct = 10 marks
      "amc-q30": 42,
      // 1 x 9-mark wrong = 0 marks
      "amc-q29": 999,
    };

    const result = scoreExam(paper, responses);
    expect(result.availableMarks).toBe(135);
    // Awarded = 3+3 + 4 + 10 = 20
    expect(result.awardedMarks).toBe(20);
    expect(result.correctCount).toBe(4);
    expect(result.incorrectCount).toBe(3);
    expect(result.unansweredCount).toBe(23);
    expect(result.percentage).toBe(Math.round((20 / 135) * 100)); // 15%
  });
});
