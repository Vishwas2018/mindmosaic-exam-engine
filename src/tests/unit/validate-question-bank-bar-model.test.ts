import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { validBarModelFixtures } from "@/content/visual-fixtures/bar-model";
import { safeValidateQuestionBank } from "@/features/exam-engine/validation/validate-question-bank";

describe("validate-question-bank: bar_model is render-only in Phase 1", () => {
  const base = questionBank.find((question) => question.visuals.length === 0)!;

  it("accepts the bank as published (no bar_model items)", () => {
    expect(safeValidateQuestionBank([base]).success).toBe(true);
  });

  it("rejects any item carrying a bar_model visual", () => {
    const visual = validBarModelFixtures[0].visual;
    const result = safeValidateQuestionBank([{ ...base, visuals: [visual] }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => /bar_model/.test(issue.message))).toBe(true);
    }
  });
});
