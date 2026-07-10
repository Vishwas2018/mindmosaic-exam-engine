import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuestionRenderer } from "@/features/exam-engine/question-renderers";
import { questionSchema } from "@/schemas/question.schema";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("unsupported question renderer", () => {
  it("announces an accessible next-phase fallback", () => {
    const essayQuestion = questionSchema.parse({
      ...validMultipleChoiceQuestion,
      id: "test-essay-1",
      type: "essay",
      options: [],
      answerKey: {
        kind: "manual",
        rubric: "Review the response for a clear idea and supporting details.",
      },
    });

    render(<QuestionRenderer question={essayQuestion} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Question renderer coming soon",
    );
  });
});
