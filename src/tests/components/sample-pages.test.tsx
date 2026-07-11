import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ExamPage from "@/app/exam/page";
import ResultsPage from "@/app/results/page";
import ShowcasePage from "@/app/showcase/page";
import { questionBank } from "@/content/questions/question-bank";
import { useExamStore } from "@/features/exam-engine/state";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const config = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
} as const;

describe("exam page", () => {
  beforeEach(() => {
    useExamStore.getState().resetExam();
  });

  it("asks the student to set up an exam when none is in progress", () => {
    render(<ExamPage />);
    expect(
      screen.getByRole("heading", { name: "No exam in progress" }),
    ).toBeInTheDocument();
  });

  it("renders the exam shell once a session has started", () => {
    useExamStore.getState().startExam(questionBank, config, { seed: "page-test" });
    render(<ExamPage />);
    expect(
      screen.getByRole("heading", { name: "Question 1 of 10" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("exam-timer-untimed")).toBeInTheDocument();
    expect(screen.getByTestId("open-submit-dialog")).toBeInTheDocument();
    expect(screen.getByTestId("nav-question-10")).toBeInTheDocument();
  });
});

describe("results page", () => {
  beforeEach(() => {
    useExamStore.getState().resetExam();
  });

  it("shows an empty state before any exam has been submitted", () => {
    render(<ResultsPage />);
    expect(
      screen.getByRole("heading", { name: "No results to show yet" }),
    ).toBeInTheDocument();
  });

  it("renders the full summary for a submitted exam", () => {
    const store = useExamStore.getState();
    store.startExam(questionBank, config, { seed: "page-test" });
    const firstQuestion = useExamStore.getState().questions[0];
    useExamStore.getState().setResponse(firstQuestion.id, "not-a-real-answer");
    useExamStore.getState().submitExam("user_submitted");

    render(<ResultsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Your results" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("objective-percentage")).toBeInTheDocument();
    expect(screen.getByTestId("result-total")).toHaveTextContent("10");
    expect(screen.getByTestId("submission-reason")).toHaveTextContent(
      "Submitted by you",
    );
    expect(screen.getByTestId("review-question-1")).toBeInTheDocument();
  });
});

describe("renderer showcase page", () => {
  it("shows the question and visual renderer sections", () => {
    render(<ShowcasePage />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Question renderers" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Visual renderers" }),
    ).toBeInTheDocument();
  });

  it("gives every embedded chart a unique accessible id", () => {
    const { container } = render(<ShowcasePage />);
    const referencedIds = Array.from(
      container.querySelectorAll("svg[aria-labelledby]"),
    ).flatMap((svg) => svg.getAttribute("aria-labelledby")?.split(" ") ?? []);

    expect(referencedIds.length).toBeGreaterThan(0);
    expect(new Set(referencedIds).size).toBe(referencedIds.length);
  });
});
