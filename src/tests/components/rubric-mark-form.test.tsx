import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RubricMarkForm } from "@/features/writing/components/RubricMarkForm";
import { scholarshipWrittenExpressionRubric as rubric } from "@/features/writing/rubrics/scholarship-written-expression";

const SCORES = { punctuation: 3, creativity: 4, construction: 3, grammar: 5, spelling: 2, relevance: 4 } as const;

async function scoreAll(user: ReturnType<typeof userEvent.setup>) {
  for (const [criterion, score] of Object.entries(SCORES)) {
    await user.click(screen.getByTestId(`score-${criterion}-${score}`));
  }
}

describe("RubricMarkForm", () => {
  it("needs all six scores before it can save, and shows the running total", async () => {
    const user = userEvent.setup();
    render(<RubricMarkForm rubric={rubric} backHref="/parent/writing" save={vi.fn()} />);

    expect(screen.getByTestId("mark-save")).toBeDisabled();
    expect(screen.getByTestId("mark-total")).toHaveTextContent("0 / 30");

    await user.click(screen.getByTestId("score-punctuation-3"));
    expect(screen.getByTestId("mark-save")).toBeDisabled();

    await scoreAll(user);
    expect(screen.getByTestId("mark-total")).toHaveTextContent("21 / 30");
    expect(screen.getByTestId("mark-save")).toBeEnabled();
  });

  it("typing a comment does not crash the form (the value is read before the state update runs)", async () => {
    const user = userEvent.setup();
    render(<RubricMarkForm rubric={rubric} backHref="/parent/writing" save={vi.fn()} />);

    await user.click(screen.getAllByText("Add a comment (optional)")[0]!);
    await user.type(screen.getByLabelText("Comment on Punctuation"), "Speech marks need practice.");

    expect(screen.getByLabelText("Comment on Punctuation")).toHaveValue("Speech marks need practice.");
    expect(screen.getByTestId("mark-total")).toBeInTheDocument();
  });

  it("saves the scores, only the comments that were written, and the optional note, and never sends a total or ceiling", async () => {
    const user = userEvent.setup();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<RubricMarkForm rubric={rubric} backHref="/parent/writing" save={save} />);

    await scoreAll(user);
    await user.click(screen.getAllByText("Add a comment (optional)")[4]!); // spelling
    await user.type(screen.getByLabelText("Comment on Spelling"), "Double letters.");
    await user.click(screen.getByTestId("mark-save"));

    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save).toHaveBeenCalledWith({
      rubricId: "scholarship-written-expression",
      rubricVersion: 1,
      scores: SCORES,
      comments: { spelling: "Double letters." },
      feedback: undefined,
    });
    expect(Object.keys(save.mock.calls[0]![0]).sort()).toEqual(["comments", "feedback", "rubricId", "rubricVersion", "scores"]);
    expect(await screen.findByTestId("mark-saved")).toHaveTextContent("Marks saved: 21 out of 30");
  });

  it("stays on the form with an error when saving fails, keeping what was entered", async () => {
    const user = userEvent.setup();
    render(<RubricMarkForm rubric={rubric} backHref="/parent/writing" save={vi.fn().mockRejectedValue(new Error("nope"))} />);

    await scoreAll(user);
    await user.click(screen.getByTestId("mark-save"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't save");
    expect(screen.getByTestId("mark-total")).toHaveTextContent("21 / 30");
  });
});
