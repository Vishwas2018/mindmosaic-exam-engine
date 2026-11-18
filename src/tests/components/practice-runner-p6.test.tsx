import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { PracticeSession } from "@/features/exam-engine/practice-mode";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

const multipleChoice = questionBank.filter((q) => q.type === "multiple_choice");
const [Q1, Q2] = multipleChoice;
const candidateQuestions = toCandidateQuestions([Q1, Q2]);

function correctRadioLabel(question: Question): string {
  const key = question.answerKey;
  if (key.kind !== "single_option") throw new Error("fixture must be single_option");
  const option = question.options.find((o) => o.id === key.optionId);
  if (!option) throw new Error("correct option missing from fixture");
  return option.text;
}

describe("Practice Runner — P6 Set Introduction, Server Checking & Modals", () => {
  it("renders Set Introduction with question count, estimated time, and honest C14 notice", async () => {
    const user = userEvent.setup();
    render(
      <PracticeSession
        questions={candidateQuestions}
        title="Measurement & Geometry"
        exitHref="/student/practice"
        exitLabel="Back to Practice Studio"
        showIntro={true}
      />,
    );

    // Title and metadata
    expect(screen.getByRole("heading", { name: "Measurement & Geometry" })).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // question count
    expect(screen.getByText(/~5m/)).toBeInTheDocument(); // estimated time

    // C14 Plain Statement about unsaved sets
    const note = screen.getByRole("note");
    expect(note).toHaveTextContent(
      "A practice set is not saved as it goes. If this tab closes or you navigate away, the set restarts from question 1.",
    );
    expect(note).not.toHaveTextContent("saved as you go");

    // "Begin practice" transitions from Intro to Question 1
    const beginBtn = screen.getByRole("button", { name: /begin practice/i });
    await user.click(beginBtn);

    expect(screen.getByTestId("practice-nav-1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit answer" })).toBeInTheDocument();
  });

  it("performs server-authoritative check and renders explanation on success (C10, C15)", async () => {
    const user = userEvent.setup();
    const checkSpy = vi.fn().mockResolvedValue({
      status: "correct",
      correct: true,
      explanation: "This is the server-provided worked explanation.",
      correctAnswer: correctRadioLabel(Q1),
      yourAnswer: correctRadioLabel(Q1),
    });

    render(
      <PracticeSession
        questions={candidateQuestions}
        title="Measurement & Geometry"
        exitHref="/student/practice"
        showIntro={false}
        onCheckAnswer={checkSpy}
      />,
    );

    await user.click(screen.getByRole("radio", { name: correctRadioLabel(Q1) }));
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    expect(checkSpy).toHaveBeenCalledWith(
      candidateQuestions[0].id,
      "bananas",
    );

    await waitFor(() => {
      expect(screen.getByTestId("feedback-panel")).toHaveAttribute("data-status", "correct");
      expect(screen.getByText("This is the server-provided worked explanation.")).toBeInTheDocument();
    });
  });

  it("handles server check failure gracefully without losing selected answer (C15 failure rule)", async () => {
    const user = userEvent.setup();
    const failingCheck = vi.fn().mockRejectedValue(new Error("Network disconnect"));

    render(
      <PracticeSession
        questions={candidateQuestions}
        title="Measurement & Geometry"
        exitHref="/student/practice"
        showIntro={false}
        onCheckAnswer={failingCheck}
      />,
    );

    const radio = screen.getByRole("radio", { name: correctRadioLabel(Q1) });
    await user.click(radio);
    await user.click(screen.getByRole("button", { name: "Submit answer" }));

    // Answer remains selected
    expect(radio).toBeChecked();
    // Feedback panel is not rendered, error message shown
    expect(screen.queryByTestId("feedback-panel")).not.toBeInTheDocument();
    expect(
      screen.getByText("Couldn't check your answer right now. Check your connection."),
    ).toBeInTheDocument();
  });

  it("warns when attempting to leave mid-set with answered questions (C14)", async () => {
    const user = userEvent.setup();

    render(
      <PracticeSession
        questions={candidateQuestions}
        title="Measurement & Geometry"
        exitHref="/student/practice"
        exitLabel="Back to Practice Studio"
        showIntro={false}
      />,
    );

    // Answer Q1 so hasAnyAnswer is true
    await user.click(screen.getByRole("radio", { name: correctRadioLabel(Q1) }));

    // Click exit link
    const exitLink = screen.getByTestId("exit-practice");
    await user.click(exitLink);

    // Leave warning modal opens
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Leave practice set?");
    expect(dialog).toHaveTextContent(
      "A practice set is not saved as it goes. If you leave now, your answers will not be saved and you will restart from question 1 next time.",
    );

    // Cancel dismisses modal
    await user.click(screen.getByRole("button", { name: "Keep practising" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("warns about unanswered questions on finish and lists their numbers (RunnerFinish)", async () => {
    const user = userEvent.setup();

    render(
      <PracticeSession
        questions={candidateQuestions}
        title="Measurement & Geometry"
        exitHref="/student/practice"
        showIntro={false}
      />,
    );

    // Click "Finish set" in the header without answering question 1 or question 2
    const finishBtn = screen.getByRole("button", { name: "Finish set" });
    await user.click(finishBtn);

    // Modal opens listing unanswered question numbers
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Finish set with unanswered questions?");
    expect(dialog).toHaveTextContent("Question 1, Question 2");

    // Review questions button closes modal
    await user.click(screen.getByRole("button", { name: "Review questions" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Clicking Finish set and confirming proceeds to summary
    await user.click(screen.getByRole("button", { name: "Finish set" }));
    const modalFinishBtn = screen.getAllByRole("button", { name: "Finish set" })[1];
    await user.click(modalFinishBtn);

    expect(screen.getByRole("heading", { name: "Nice work" })).toBeInTheDocument();
  });

  it("disables Finish set and displays honest notice when offline", async () => {
    // Simulate offline state
    const originalOnLine = navigator.onLine;
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    render(
      <PracticeSession
        questions={candidateQuestions}
        title="Measurement & Geometry"
        exitHref="/student/practice"
        showIntro={false}
      />,
    );

    // Offline banner is visible with exact wording
    expect(
      screen.getByText("You appear to be offline. Reconnect to finish your practice set."),
    ).toBeInTheDocument();

    // Finish set button is disabled
    const finishBtn = screen.getByRole("button", { name: "Finish set" });
    expect(finishBtn).toBeDisabled();

    // Restore online state
    Object.defineProperty(navigator, "onLine", { value: originalOnLine, configurable: true });
  });
});
