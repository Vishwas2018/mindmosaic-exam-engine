import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuestionRenderer } from "@/features/exam-engine/question-renderers";
import { questionSchema, type Question } from "@/schemas/question.schema";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("unsupported question renderer", () => {
  it("announces an accessible fallback for an unknown type", () => {
    const parsed = questionSchema.parse(validMultipleChoiceQuestion);
    // Simulate an unknown discriminator reaching the renderer boundary.
    const unknown = { ...parsed, type: "legacy_widget" } as unknown as Question;

    render(<QuestionRenderer question={unknown} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Question renderer coming soon",
    );
  });
});
