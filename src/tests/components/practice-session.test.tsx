import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { PracticeSession } from "@/features/exam-engine/practice-mode";
import type { Question } from "@/schemas/question.schema";

const multipleChoice = questionBank.filter((q) => q.type === "multiple_choice");
const [Q1, Q2] = multipleChoice;

function correctRadioLabel(question: Question): string {
  const key = question.answerKey;
  if (key.kind !== "single_option") throw new Error("fixture must be single_option");
  const option = question.options.find((o) => o.id === key.optionId);
  if (!option) throw new Error("correct option missing from fixture");
  return option.text;
}

function wrongRadioLabel(question: Question): string {
  const key = question.answerKey;
  if (key.kind !== "single_option") throw new Error("fixture must be single_option");
  const option = question.options.find((o) => o.id !== key.optionId);
  if (!option) throw new Error("fixture needs two options");
  return option.text;
}

describe("PracticeSession", () => {
  it("disables Check answer until an option is selected, then shows correct feedback", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={[Q1, Q2]} title="Fractions" exitHref="/student/learn" />);

    expect(screen.getByRole("button", { name: "Check answer" })).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: correctRadioLabel(Q1) }));
    expect(screen.getByRole("button", { name: "Check answer" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Check answer" }));
    const feedback = screen.getByTestId("feedback-panel");
    expect(feedback).toHaveAttribute("data-status", "correct");
    expect(within(feedback).getByText("Correct")).toBeInTheDocument();
  });

  it("shows the correct answer when the student picks the wrong option", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={[Q1]} title="Fractions" exitHref="/student/learn" />);

    await user.click(screen.getByRole("radio", { name: wrongRadioLabel(Q1) }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));

    const feedback = screen.getByTestId("feedback-panel");
    expect(feedback).toHaveAttribute("data-status", "incorrect");
    expect(within(feedback).getByText("Not quite")).toBeInTheDocument();
    expect(within(feedback).getByText(/Correct answer:/)).toBeInTheDocument();
  });

  it("moves to the next question after checking, and reaches the summary after the last one", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={[Q1, Q2]} title="Fractions" exitHref="/student/learn" />);

    await user.click(screen.getByRole("radio", { name: correctRadioLabel(Q1) }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.click(screen.getByRole("button", { name: "Next question" }));

    expect(screen.getAllByText("Question 2 of 2").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("radio", { name: correctRadioLabel(Q2) }));
    await user.click(screen.getByRole("button", { name: "Check answer" }));
    await user.click(screen.getByRole("button", { name: "View results" }));

    expect(screen.getByRole("heading", { name: "Nice work" })).toBeInTheDocument();
    expect(screen.getByTestId("summary-accuracy")).toHaveTextContent("100%");
  });

  it("skip advances to the next question without showing feedback", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={[Q1, Q2]} title="Fractions" exitHref="/student/learn" />);

    await user.click(screen.getByRole("button", { name: "Skip" }));
    expect(screen.getAllByText("Question 2 of 2").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("feedback-panel")).not.toBeInTheDocument();
  });

  it("end session jumps straight to the summary", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={[Q1, Q2]} title="Fractions" exitHref="/student/learn" />);

    await user.click(screen.getByRole("button", { name: "End session" }));
    expect(screen.getByRole("heading", { name: "Nice work" })).toBeInTheDocument();
  });

  it("restarts the session from the summary screen", async () => {
    const user = userEvent.setup();
    render(<PracticeSession questions={[Q1]} title="Fractions" exitHref="/student/learn" />);

    await user.click(screen.getByRole("button", { name: "End session" }));
    await user.click(screen.getByRole("button", { name: "Practice again" }));

    expect(screen.getAllByText("Question 1 of 1").length).toBeGreaterThan(0);
  });

  it("shows an empty state instead of rendering a question when no questions match", () => {
    render(<PracticeSession questions={[]} title="Fractions" exitHref="/student/learn" />);
    expect(screen.getByText("No questions match this practice set")).toBeInTheDocument();
  });
});
