import { describe, expect, it } from "vitest";

import { questionSchema } from "@/schemas/question.schema";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("questionSchema", () => {
  it("accepts a valid multiple-choice question", () => {
    const result = questionSchema.safeParse(validMultipleChoiceQuestion);

    expect(result.success).toBe(true);
  });

  it("rejects an unsupported question type", () => {
    const result = questionSchema.safeParse({
      ...validMultipleChoiceQuestion,
      type: "unsupported_question_type",
    });

    expect(result.success).toBe(false);
  });
});
