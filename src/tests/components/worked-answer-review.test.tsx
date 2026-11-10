import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { WorkedAnswerReview } from "@/features/parent-dashboard";
import { PREVIEW_ANSWER_REVIEW_READING } from "@/features/parent-dashboard/fixtures";

const mockChild = {
  id: "child-aisha",
  displayName: "Aisha",
};

describe("WorkedAnswerReview Component", () => {
  it("renders page title and subtitle", () => {
    render(
      <WorkedAnswerReview
        paperTitle="NAPLAN-style Reading"
        child={mockChild}
        resultId="res-reading-301"
        questions={PREVIEW_ANSWER_REVIEW_READING}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Going through the answers" })).toBeInTheDocument();
    expect(
      screen.getByText(/Every question, what Aisha put, and what was expected/i),
    ).toBeInTheDocument();
  });

  it("renders filter buttons with accurate counts", () => {
    render(
      <WorkedAnswerReview
        paperTitle="NAPLAN-style Reading"
        child={mockChild}
        resultId="res-reading-301"
        questions={PREVIEW_ANSWER_REVIEW_READING}
      />,
    );

    expect(screen.getByRole("button", { name: /All 15/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Not correct 3/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Not answered 1/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /With a person 2/i })).toBeInTheDocument();
  });

  it("filters questions when filter button is clicked", () => {
    render(
      <WorkedAnswerReview
        paperTitle="NAPLAN-style Reading"
        child={mockChild}
        resultId="res-reading-301"
        questions={PREVIEW_ANSWER_REVIEW_READING}
      />,
    );

    // Click "Not correct 3"
    fireEvent.click(screen.getByRole("button", { name: /Not correct 3/i }));

    expect(
      screen.getByText("Which word in the last sentence means the same as “enormous”?"),
    ).toBeInTheDocument();
    // Question 3 is correct, so it should no longer be displayed
    expect(
      screen.queryByText("What is the main thing the second paragraph tells you about the lighthouse?"),
    ).not.toBeInTheDocument();
  });

  it("shows distinct statuses for Correct, Not correct, Not answered, and With a person", () => {
    render(
      <WorkedAnswerReview
        paperTitle="NAPLAN-style Reading"
        child={mockChild}
        resultId="res-reading-301"
        questions={PREVIEW_ANSWER_REVIEW_READING}
      />,
    );

    // Q3 is Correct
    expect(screen.getByText("Question 3")).toBeInTheDocument();
    expect(screen.getAllByText("Correct").length).toBeGreaterThan(0);

    // Q7 is Not correct
    expect(screen.getByText("Question 7")).toBeInTheDocument();
    expect(screen.getAllByText("Not correct").length).toBeGreaterThan(0);

    // Q11 is Not answered
    expect(screen.getByText("Question 11")).toBeInTheDocument();
    expect(screen.getByText("Not answered")).toBeInTheDocument();
    expect(screen.getByText("Nothing — this one was left blank")).toBeInTheDocument();

    // Q14 is With a person
    expect(screen.getByText("Question 14")).toBeInTheDocument();
    expect(screen.getAllByText("With a person").length).toBeGreaterThan(0);
    // Never drawn as zero! Drawn as "Not yet marked"
    expect(screen.getAllByText("Not yet marked").length).toBeGreaterThan(0);
  });

  it("renders worked explanations ('Why:') on questions", () => {
    render(
      <WorkedAnswerReview
        paperTitle="NAPLAN-style Reading"
        child={mockChild}
        resultId="res-reading-301"
        questions={PREVIEW_ANSWER_REVIEW_READING}
      />,
    );

    expect(
      screen.getByText(/Both words describe the cliff, but “vast” is about size and “rocky” is about what it is made of/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Not answered rather than answered wrongly. Worth asking whether she ran out of time/i),
    ).toBeInTheDocument();
  });

  it("renders pedagogical honesty notice footer", () => {
    render(
      <WorkedAnswerReview
        paperTitle="NAPLAN-style Reading"
        child={mockChild}
        resultId="res-reading-301"
        questions={PREVIEW_ANSWER_REVIEW_READING}
      />,
    );

    expect(
      screen.getByText(/Not answered and answered wrongly are never shown the same way, and nothing awaiting a person is ever drawn as zero/i),
    ).toBeInTheDocument();
  });
});
