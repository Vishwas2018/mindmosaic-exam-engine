import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  ChildProgressDashboard,
} from "@/features/parent-dashboard";
import {
  PREVIEW_RESULTS_AISHA,
  PREVIEW_RESULTS_KABIR,
  PREVIEW_SUBJECTS_AISHA,
  PREVIEW_STRANDS_AISHA,
  PREVIEW_RECOMMENDATION_AISHA,
} from "@/features/parent-dashboard/fixtures";

const mockChild = {
  id: "child-aisha",
  displayName: "Aisha",
  yearLevel: 3,
};

const mockSiblings = [
  { id: "child-aisha", name: "Aisha" },
  { id: "child-kabir", name: "Kabir" },
  { id: "child-maya", name: "Maya" },
];

describe("ChildProgressDashboard Component", () => {
  it("renders heading and subtitle with correct paper count and year level", () => {
    render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        suggestion={PREVIEW_RECOMMENDATION_AISHA}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Aisha’s progress" })).toBeInTheDocument();
    expect(
      screen.getByText(/Year 3 · 4 finished papers · worked out from timed papers only/i),
    ).toBeInTheDocument();
  });

  it("strictly omits performance bands and percentage progress across entire render output", () => {
    const { container } = render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        suggestion={PREVIEW_RECOMMENDATION_AISHA}
      />,
    );

    const fullText = container.textContent || "";
    // Evaluative bands must never appear
    expect(fullText).not.toMatch(/\b(Exceeding|Strong|Building|Needs practice)\b/i);
    // Evaluative percentage progress must never appear
    expect(fullText).not.toMatch(/\d+%\s*mastery/i);
    expect(fullText).not.toMatch(/\d+%\s*progress/i);
  });

  it("renders top stat cards with exact marks earned out of marks available", () => {
    render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        suggestion={PREVIEW_RECOMMENDATION_AISHA}
      />,
    );

    expect(screen.getByRole("heading", { level: 3, name: "Finished papers" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Marks earned" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Awaiting marking" })).toBeInTheDocument();

    expect(screen.getByText("69 of 100")).toBeInTheDocument();
    expect(screen.getByText(/Across 4 papers, auto-marked only/i)).toBeInTheDocument();
  });

  it("enforces evidence floor on strands below threshold with explicit Not enough yet message", () => {
    render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        suggestion={PREVIEW_RECOMMENDATION_AISHA}
      />,
    );

    expect(screen.getByText("Working mathematically")).toBeInTheDocument();
    expect(screen.getByText("Not enough yet")).toBeInTheDocument();
    expect(
      screen.getByText(/1 paper · 4 marks so far. A strand needs 2 papers and 8 marks before we say anything/i),
    ).toBeInTheDocument();
  });

  it("renders distinct recommendation card separated from child results", () => {
    render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        suggestion={PREVIEW_RECOMMENDATION_AISHA}
      />,
    );

    expect(screen.getByText("What we would suggest")).toBeInTheDocument();
    expect(screen.getByText("Our suggestion, not Aisha’s result")).toBeInTheDocument();
    expect(
      screen.getByText(/Measurement and space has the lowest marks of the strands with enough behind them/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kept visually apart from the figures above on purpose: everything above is what Aisha did, this is what we think/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /See Measurement practice/i })).toBeInTheDocument();
  });

  it("renders finished papers list with dates and links to results", () => {
    render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        suggestion={PREVIEW_RECOMMENDATION_AISHA}
      />,
    );

    expect(screen.getByText("NAPLAN-style Reading")).toBeInTheDocument();
    expect(screen.getByText("29 Oct 2026")).toBeInTheDocument();
    expect(screen.getByText("2 awaiting a person")).toBeInTheDocument();
    expect(screen.getByText("11 of 15")).toBeInTheDocument();
  });

  it("renders below-floor state when child has only 1 finished paper (State 1)", () => {
    render(
      <ChildProgressDashboard
        child={{ id: "child-kabir", displayName: "Kabir", yearLevel: 5 }}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_KABIR}
        subjects={[]}
        strands={[]}
        forcedState="below_floor"
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "One paper so far" })).toBeInTheDocument();
    expect(
      screen.getByText(/Kabir has finished 1 paper. We need 2 papers and 8 marks before showing subject figures/i),
    ).toBeInTheDocument();
  });

  it("renders empty state when child has no finished papers (State 2)", () => {
    render(
      <ChildProgressDashboard
        child={{ id: "child-maya", displayName: "Maya", yearLevel: 1 }}
        siblings={mockSiblings}
        papers={[]}
        subjects={[]}
        strands={[]}
        forcedState="nothing"
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "No finished papers yet" })).toBeInTheDocument();
    expect(
      screen.getByText(/Practice sets are not recorded, so they do not appear here. A timed paper from the Exam Centre is what starts this off/i),
    ).toBeInTheDocument();
  });

  it("renders partial failure banner when unreadableCount > 0 (State 3)", () => {
    render(
      <ChildProgressDashboard
        child={mockChild}
        siblings={mockSiblings}
        papers={PREVIEW_RESULTS_AISHA}
        subjects={PREVIEW_SUBJECTS_AISHA}
        strands={PREVIEW_STRANDS_AISHA}
        unreadableCount={1}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/We couldn’t load 1 of Aisha’s 5 papers/i)).toBeInTheDocument();
    expect(screen.getByText(/The figures are from 4 papers, not 5/i)).toBeInTheDocument();
  });
});
