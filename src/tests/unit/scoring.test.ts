import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/question-bank";
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
    expect(scoreQuestion(questionBank[0], "east")).toMatchObject({
      status: "correct",
      awardedMarks: 1,
    });
  });

  it("aggregates a mixed attempt", () => {
    const result = scoreExam(questionBank, {
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
  it("always returns a manual-review outcome", () => {
    expect(scoreEssay(q, "Any written response")).toEqual({
      status: "manual_review",
      correct: null,
      earnedMarks: null,
      availableMarks: q.metadata.marks,
      manualReviewRequired: true,
    });
  });
  it("does not auto-mark even a blank response", () => {
    expect(scoreEssay(q, null).status).toBe("manual_review");
  });
});
