import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { PaperResultView } from "@/features/parent-dashboard";
import { PREVIEW_RESULTS_AISHA } from "@/features/parent-dashboard/fixtures";

const mockChild = {
  id: "child-aisha",
  displayName: "Aisha",
  yearLevel: 3,
};

describe("PaperResultView Component", () => {
  const paper = PREVIEW_RESULTS_AISHA.find((r) => r.id === "res-reading-301")!;

  it("renders paper title, date, year level, and timed mode", () => {
    render(<PaperResultView result={paper} child={mockChild} />);

    expect(screen.getByRole("heading", { level: 1, name: "NAPLAN-style Reading" })).toBeInTheDocument();
    expect(screen.getByText(/Finished 29 Oct 2026 · Year 3 · timed/i)).toBeInTheDocument();
  });

  it("renders written answers notice when questions are pending human review", () => {
    render(<PaperResultView result={paper} child={mockChild} />);

    expect(
      screen.getByText(/2 written answers are still with a person/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The marks below are the ones that could be marked automatically. They will go up, never down, when the written answers are marked/i),
    ).toBeInTheDocument();
  });

  it("strictly separates marked marks from pending marks and never adds them into an interim score", () => {
    render(<PaperResultView result={paper} child={mockChild} />);

    expect(screen.getByText("Marked so far")).toBeInTheDocument();
    expect(screen.getByText("11 of 15 marks")).toBeInTheDocument();

    expect(screen.getByText("Still to be marked")).toBeInTheDocument();
    expect(screen.getByText("2 questions · 4 marks")).toBeInTheDocument();

    expect(
      screen.getByText(/Marked and pending are shown as separate figures and never added together into one score/i),
    ).toBeInTheDocument();
  });

  it("renders questions answered and time taken metrics", () => {
    render(<PaperResultView result={paper} child={mockChild} />);

    expect(screen.getByText("Questions answered")).toBeInTheDocument();
    expect(screen.getByText("14 of 15")).toBeInTheDocument();

    expect(screen.getByText("Time taken")).toBeInTheDocument();
    expect(screen.getByText("24 minutes of 30")).toBeInTheDocument();
  });

  it("renders strand breakdown and explains that single papers cannot make evaluative claims", () => {
    render(<PaperResultView result={paper} child={mockChild} />);

    expect(screen.getByRole("heading", { level: 2, name: "Where the marks came from" })).toBeInTheDocument();
    expect(screen.getByText("Finding information")).toBeInTheDocument();
    expect(screen.getByText("6 of 7 marks")).toBeInTheDocument();
    expect(screen.getByText("Reading for meaning")).toBeInTheDocument();
    expect(screen.getByText("5 of 8 marks")).toBeInTheDocument();

    expect(
      screen.getByText(/Not enough yet to say anything about either strand on this paper alone. It needs 2 finished papers and 8 marks/i),
    ).toBeInTheDocument();
  });

  it("renders primary button linking to answer review", () => {
    render(<PaperResultView result={paper} child={mockChild} />);

    const link = screen.getByRole("link", { name: /Go through the answers/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/parent/results/res-reading-301/review");
  });
});
