import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuestionRenderer } from "@/features/exam-engine/question-renderers";
import { toCandidateQuestion, type CandidateQuestion } from "@/features/exam-engine/types";
import { questionSchema } from "@/schemas/question.schema";
import { validMultipleChoiceQuestion } from "@/tests/fixtures/questions";

describe("unsupported question renderer", () => {
  it("announces an accessible fallback for an unknown type", () => {
    const parsed = questionSchema.parse(validMultipleChoiceQuestion);
    // Simulate an unknown discriminator reaching the renderer boundary.
    const unknown = {
      ...toCandidateQuestion(parsed),
      type: "legacy_widget",
    } as unknown as CandidateQuestion;

    render(<QuestionRenderer question={unknown} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Question renderer coming soon",
    );
  });
});
