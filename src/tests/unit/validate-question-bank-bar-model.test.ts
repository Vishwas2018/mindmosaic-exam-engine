import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { invalidBarModelFixtures, validBarModelFixtures, warningBarModelFixtures } from "@/content/visual-fixtures/bar-model";
import { safeValidateQuestionBank } from "@/features/exam-engine/validation/validate-question-bank";

const base = questionBank.find((question) => question.type === "number_entry" && question.visuals.length === 0)!;
const fixtureQuestion = (visual: unknown, value: number) => ({ ...base, prompt: "Use the model to find the unknown quantity.", answerKey: { kind: "number", value, tolerance: 0 }, visuals: [visual] });

describe("validate-question-bank: bar_model generation validation", () => {
  it("retains the published bank without adding content", () => {
    expect(safeValidateQuestionBank(questionBank).success).toBe(true);
    expect(questionBank.flatMap((question) => question.visuals).filter((visual) => visual.type === "bar_model")).toEqual([]);
  });

  it.each([...validBarModelFixtures, ...warningBarModelFixtures])("accepts independently solved $name", (fixture) => {
    expect(safeValidateQuestionBank([fixtureQuestion(fixture.visual, Number(fixture.target.numerator) / Number(fixture.target.denominator))]).success).toBe(true);
  });

  it.each(invalidBarModelFixtures)("rejects $name at the bank boundary", (fixture) => {
    expect(safeValidateQuestionBank([fixtureQuestion(fixture.visual, 27)]).success).toBe(false);
  });

  it("rejects a valid visual paired with the wrong key", () => {
    const result = safeValidateQuestionBank([fixtureQuestion(validBarModelFixtures[0].visual, 28)]);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message.includes("disagrees"))).toBe(true);
  });

  it("rejects multiple target visuals even when their values agree", () => {
    const question = fixtureQuestion(validBarModelFixtures[0].visual, 27);
    question.visuals.push({ ...(validBarModelFixtures[0].visual as object), id: "second-model" });
    expect(safeValidateQuestionBank([question]).success).toBe(false);
  });
});
