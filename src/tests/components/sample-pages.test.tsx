import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import ExamPage from "@/app/exam/page";
import ResultsPage from "@/app/results/page";
import ShowcasePage from "@/app/showcase/page";
import { useExamStore } from "@/features/exam-engine/state";

describe("sample exam page", () => {
  beforeEach(() => {
    useExamStore.getState().resetExam();
  });

  it("renders the assessment shell and first sample question", () => {
    render(<ExamPage />);
    expect(
      screen.getByRole("heading", { name: "Numeracy confidence check" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Which garden bed grew 8 bean plants?" }),
    ).toBeInTheDocument();
  });
});

describe("results page", () => {
  it("renders the results summary", () => {
    render(<ResultsPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Your results" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Score: 67 percent/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Manual review")).toBeInTheDocument();
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
