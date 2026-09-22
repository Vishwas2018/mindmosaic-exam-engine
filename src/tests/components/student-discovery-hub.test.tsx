import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  StudentDiscoveryHero,
  NextForYouSection,
  ExploreProgramsSection,
  MoreChallengesSection,
  LearnBySubjectSection,
  QuickPracticeSection,
  RecentActivitySection,
  deriveStartHereItem,
  deriveNextForYouCards,
} from "@/features/student/components/discovery";
import type { AttemptSummary } from "@/features/student/attempt-summary";

const mockAttempts: readonly AttemptSummary[] = [
  {
    id: "att-1",
    submittedAt: "2026-09-05T10:00:00Z",
    title: "NAPLAN-style Numeracy — Grade 3",
    subjectLabel: "Numeracy",
    timing: "timed",
    totalQuestions: 10,
    scorePercent: 80,
    attemptedQuestions: 10,
    pendingManualReview: false,
  },
  {
    id: "att-2",
    submittedAt: "2026-09-04T10:00:00Z",
    title: "ICAS-style Reading — Grade 3",
    subjectLabel: "Reading",
    timing: "untimed",
    totalQuestions: 10,
    scorePercent: 60,
    attemptedQuestions: 9,
    pendingManualReview: false,
  },
];

describe("Student Discovery Hub Components", () => {
  it("renders StudentDiscoveryHero with personalized greeting and start here action", () => {
    const recommendation = deriveStartHereItem({
      studentName: "Alex",
      yearLevel: 3,
      attempts: mockAttempts,
    });

    render(
      <StudentDiscoveryHero
        firstName="Alex"
        yearLevel={3}
        recommendation={recommendation}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: /Hi, Alex\. What would you like to work on today\?/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(recommendation.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(recommendation.actionLabel, "i") })).toBeInTheDocument();
  });

  it("renders NextForYouSection with adaptive cards", () => {
    const cards = deriveNextForYouCards({
      yearLevel: 3,
      attempts: mockAttempts,
    });

    render(<NextForYouSection cards={cards} />);

    expect(screen.getByRole("heading", { level: 2, name: /Next for you/i })).toBeInTheDocument();
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  it("renders ExploreProgramsSection with live curriculum, NAPLAN and ICAS pathways", () => {
    render(<ExploreProgramsSection />);

    expect(screen.getByRole("heading", { level: 2, name: /Explore MindMosaic/i })).toBeInTheDocument();
    expect(screen.getByText("Curriculum Learning")).toBeInTheDocument();
    expect(screen.getByText("NAPLAN")).toBeInTheDocument();
    expect(screen.getByText("ICAS")).toBeInTheDocument();
  });

  it("renders MoreChallengesSection as honest coming-soon tracks with a preview modal", () => {
    render(<MoreChallengesSection firstName="Alex" />);

    expect(screen.getByRole("heading", { level: 2, name: /More challenges/i })).toBeInTheDocument();
    expect(screen.getByText("AMC (Australian Mathematics Competition)")).toBeInTheDocument();
    expect(screen.getByText("Olympiad")).toBeInTheDocument();
    expect(screen.getByText("Selective Entry")).toBeInTheDocument();
    expect(screen.getByText("Scholarship Prep")).toBeInTheDocument();
    expect(screen.getByText("Singapore Maths")).toBeInTheDocument();

    const trackButton = screen.getByRole("button", { name: /AMC \(Australian Mathematics Competition\)[\s\S]*Preview track/i });
    fireEvent.click(trackButton);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-hidden", "false");
    expect(screen.getByRole("heading", { level: 3, name: "AMC (Australian Mathematics Competition)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Notify me when live/i })).toBeInTheDocument();
  });

  it("renders LearnBySubjectSection with direct Mathematics and English cards", () => {
    render(<LearnBySubjectSection />);

    expect(screen.getByRole("heading", { level: 2, name: /Learn by subject/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Mathematics" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Mathematics/i })).toHaveAttribute("href", "/student/learn/mathematics");
    expect(screen.getByRole("link", { name: /Explore English/i })).toHaveAttribute("href", "/student/learn/english");
  });

  it("renders QuickPracticeSection with 10-minute practice, retry, and challenge", () => {
    render(<QuickPracticeSection />);

    expect(screen.getByRole("heading", { level: 2, name: /Quick practice/i })).toBeInTheDocument();
    expect(screen.getByText("10-minute practice")).toBeInTheDocument();
    expect(screen.getByText("Retry missed questions")).toBeInTheDocument();
    expect(screen.getByText("Challenge me")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start 10m run/i })).toHaveAttribute("href", "/practice/mixed-practice");
    expect(screen.getByRole("link", { name: /Review & retry/i })).toHaveAttribute("href", "/practice");
    expect(screen.getByRole("link", { name: /Take challenge/i })).toHaveAttribute("href", "/practice?timing=timed");
  });

  it("renders RecentActivitySection with genuine attempt scores and results link", () => {
    render(<RecentActivitySection attempts={mockAttempts} />);

    expect(screen.getByRole("heading", { level: 2, name: /Recent activity/i })).toBeInTheDocument();
    expect(screen.getByText("NAPLAN-style Numeracy — Grade 3")).toBeInTheDocument();
    expect(screen.getByText("8 of 10 correct")).toBeInTheDocument();
    expect(screen.getByText("6 of 10 correct")).toBeInTheDocument();
    const allResultsLinks = screen.getAllByRole("link", { name: /View all results/i });
    expect(allResultsLinks.length).toBeGreaterThanOrEqual(1);
    expect(allResultsLinks[0]).toHaveAttribute("href", "/results");
  });

  it("renders RecentActivitySection empty state when student has no attempts", () => {
    render(<RecentActivitySection attempts={[]} />);

    expect(screen.getByText("No completed sessions yet")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start your first session/i })).toHaveAttribute("href", "/practice");
  });
});
