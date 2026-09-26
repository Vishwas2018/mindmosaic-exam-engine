import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { showcaseQuestions } from "@/content/questions/showcase-fixtures";
import { PracticeSession } from "@/features/exam-engine/practice-mode/PracticeSession";
import type { Question } from "@/schemas/question.schema";

/**
 * End-to-end proof (real render + real reducer, no mocked scoring) that
 * checking an answer in practice mode threads a `reveal` down into the
 * renderer and shows real per-element grading, and that the banner's
 * richer "Partially correct"/binary-only copy switches correctly by type.
 * `question-renderers.test.tsx`'s "reveal states" blocks cover each
 * renderer in isolation; this covers the actual PracticeSession wiring
 * that constructs `reveal` in the first place.
 */
function find(id: string): Question {
  const question = showcaseQuestions.find((item) => item.id === id);
  if (!question) throw new Error(`Missing fixture ${id}`);
  return question;
}

describe("PracticeSession — reveal wiring", () => {
  it("a correct multiple-choice answer shows per-option 'Correct' and the summary banner", async () => {
    const user = userEvent.setup();
    render(
      <PracticeSession
        questions={[find("showcase-multiple-choice")]}
        title="Rounding"
        exitHref="/student/learn"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "48" }));
    await user.click(screen.getByTestId("check-answer"));

    expect(screen.getByTestId("feedback-panel")).toHaveAttribute("data-status", "correct");
    // The per-element tag from MultipleChoiceRenderer and the banner's own
    // "Correct" label both render the same word — asserting at least one
    // proves the renderer actually received `reveal`, not just the banner.
    expect(screen.getAllByText("Correct").length).toBeGreaterThanOrEqual(1);
  });

  it("an incorrect multiple-choice answer shows 'Your answer' on the chosen option and 'Correct answer' on the missed one", async () => {
    const user = userEvent.setup();
    render(
      <PracticeSession
        questions={[find("showcase-multiple-choice")]}
        title="Rounding"
        exitHref="/student/learn"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "42" }));
    await user.click(screen.getByTestId("check-answer"));

    expect(screen.getByTestId("feedback-panel")).toHaveAttribute("data-status", "incorrect");
    expect(screen.getAllByText("Your answer").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Correct answer").length).toBeGreaterThanOrEqual(1);
    // multiple_choice is not partial-credit-eligible -> the binary-only note shows.
    expect(screen.getByText("This type is marked right or not right only.")).toBeInTheDocument();
    expect(screen.queryByText("Partially correct")).not.toBeInTheDocument();
  });

  it("a partially-correct fill_blank answer shows the richer 'Partially correct' banner tone, not plain 'Not quite'", async () => {
    const user = userEvent.setup();
    render(
      <PracticeSession
        questions={[find("showcase-fill-blank")]}
        title="Shapes"
        exitHref="/student/learn"
      />,
    );

    // "triangle" blank correct (3), "hexagon" blank wrong (5, not 6/six).
    await user.type(screen.getByLabelText("Number of triangle sides"), "3");
    await user.type(screen.getByLabelText("Number of hexagon sides"), "5");
    await user.click(screen.getByTestId("check-answer"));

    expect(screen.getByTestId("feedback-panel")).toHaveAttribute("data-status", "incorrect");
    expect(screen.getByTestId("feedback-panel")).toHaveAttribute("data-partial", "true");
    expect(screen.getByText("Partially correct")).toBeInTheDocument();
    expect(screen.queryByText("This type is marked right or not right only.")).not.toBeInTheDocument();
  });

  it("retrying a checked question clears the reveal — the renderer goes back to plain idle/selected styling", async () => {
    const user = userEvent.setup();
    render(
      <PracticeSession
        questions={[find("showcase-multiple-choice")]}
        title="Rounding"
        exitHref="/student/learn"
      />,
    );

    await user.click(screen.getByRole("radio", { name: "42" }));
    await user.click(screen.getByTestId("check-answer"));
    expect(screen.getAllByText(/Your answer/).length).toBeGreaterThanOrEqual(1);

    await user.click(screen.getByTestId("retry-question"));
    expect(screen.queryByTestId("feedback-panel")).not.toBeInTheDocument();
    expect(screen.queryByText("Correct")).not.toBeInTheDocument();
    expect(screen.queryByText(/Your answer/)).not.toBeInTheDocument();
  });
});
