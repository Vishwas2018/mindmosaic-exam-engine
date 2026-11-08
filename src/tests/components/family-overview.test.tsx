import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FamilyOverview } from "@/features/parent-dashboard/components/FamilyOverview";
import type { ChildSummary } from "@/features/parent-dashboard";

const sampleChildren: ChildSummary[] = [
  {
    childId: "child-1",
    displayName: "Aisha",
    yearLevel: 3,
    attemptCount: 4,
    unreadableAttemptCount: 0,
    latestPercentage: 70,
    previousPercentage: 65,
    averagePercentage: 68,
    attemptsThisWeek: 3,
    timeThisWeekSeconds: 3600,
    streakDays: 3,
    weekActivity: [
      { label: "Mon", practised: true, isToday: false },
      { label: "Tue", practised: true, isToday: false },
      { label: "Wed", practised: false, isToday: false },
      { label: "Thu", practised: true, isToday: false },
      { label: "Fri", practised: false, isToday: false },
      { label: "Sat", practised: false, isToday: false },
      { label: "Sun", practised: false, isToday: true },
    ],
    subjects: [
      {
        subject: "numeracy",
        label: "Numeracy",
        percentage: 70,
        marksEarned: 28,
        marksAvailable: 40,
        questionCount: 40,
      },
      {
        subject: "reading",
        label: "Reading",
        percentage: 60,
        marksEarned: 18,
        marksAvailable: 30,
        questionCount: 30,
      },
    ],
    recentAttempts: [
      {
        id: "att-1",
        submittedAt: "2026-11-04T10:00:00Z",
        submittedAtLabel: "Tuesday",
        label: "NAPLAN-style Numeracy",
        percentage: 70,
        marksEarned: 14,
        marksAvailable: 20,
        totalQuestions: 20,
        attemptedQuestions: 20,
        pendingManualReview: false,
      },
    ],
    readinessScore: 70,
    topicsMasteredCount: 1,
    observations: [],
    recommendedActions: [],
  },
  {
    childId: "child-2",
    displayName: "Kiran",
    yearLevel: 5,
    attemptCount: 1, // Below 2 papers floor!
    unreadableAttemptCount: 0,
    latestPercentage: 80,
    previousPercentage: null,
    averagePercentage: 80,
    attemptsThisWeek: 1,
    timeThisWeekSeconds: 1200,
    streakDays: 1,
    weekActivity: [
      { label: "Mon", practised: false, isToday: false },
      { label: "Tue", practised: false, isToday: false },
      { label: "Wed", practised: false, isToday: false },
      { label: "Thu", practised: false, isToday: false },
      { label: "Fri", practised: true, isToday: false },
      { label: "Sat", practised: false, isToday: false },
      { label: "Sun", practised: false, isToday: true },
    ],
    subjects: [
      {
        subject: "numeracy",
        label: "Numeracy",
        percentage: 80,
        marksEarned: 8,
        marksAvailable: 10,
        questionCount: 10,
      },
    ],
    recentAttempts: [
      {
        id: "att-2",
        submittedAt: "2026-11-06T15:00:00Z",
        submittedAtLabel: "Friday",
        label: "ICAS-style Mathematics",
        percentage: 80,
        marksEarned: 8,
        marksAvailable: 10,
        totalQuestions: 10,
        attemptedQuestions: 10,
        pendingManualReview: false,
      },
    ],
    readinessScore: 80,
    topicsMasteredCount: 1,
    observations: [],
    recommendedActions: [],
  },
];

describe("FamilyOverview", () => {
  it("renders heading Family Overview per Decision P2", () => {
    render(<FamilyOverview summaries={sampleChildren} />);
    expect(screen.getByRole("heading", { level: 1, name: "Family Overview" })).toBeInTheDocument();
  });

  it("renders child switcher with All children and individual child pills", () => {
    render(<FamilyOverview summaries={sampleChildren} />);
    expect(screen.getByRole("button", { name: /all children/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /aisha/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /kiran/i })).toBeInTheDocument();
  });

  it("filters displayed children when a child pill is selected", () => {
    render(<FamilyOverview summaries={sampleChildren} />);
    expect(screen.getByRole("heading", { level: 2, name: "Aisha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Kiran" })).toBeInTheDocument();

    // Click Aisha
    fireEvent.click(screen.getByRole("button", { name: /aisha/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Aisha" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "Kiran" })).not.toBeInTheDocument();

    // Click All children
    fireEvent.click(screen.getByRole("button", { name: /all children/i }));
    expect(screen.getByRole("heading", { level: 2, name: "Aisha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Kiran" })).toBeInTheDocument();
  });

  it("renders latest finished paper and per-subject marks without percentage signs", () => {
    render(<FamilyOverview summaries={[sampleChildren[0]]} />);

    expect(screen.getByText("Latest finished paper")).toBeInTheDocument();
    expect(screen.getByText("NAPLAN-style Numeracy")).toBeInTheDocument();
    expect(screen.getByText(/14 of 20 marks/i)).toBeInTheDocument();

    // MarksMeter subject marks
    expect(screen.getByText("28 of 40 marks")).toBeInTheDocument();
    expect(screen.getByText("18 of 30 marks")).toBeInTheDocument();

    // Honesty rule: No performance band label rendered
    expect(screen.queryByText("Strong")).not.toBeInTheDocument();
    expect(screen.queryByText("Needs practice")).not.toBeInTheDocument();
    expect(screen.queryByText("Building")).not.toBeInTheDocument();
  });

  it("enforces evidence floor on evaluative claims", () => {
    render(<FamilyOverview summaries={[sampleChildren[1]]} />); // Kiran has only 1 finished paper

    // Below floor (1 paper < 2 floor): evaluative claim is suppressed
    expect(screen.getAllByText("To practise").length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(
        "Not enough yet to say anything about a single strand. It needs 2 finished papers and 8 marks.",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("renders first visit state (b6) when no papers have been finished", () => {
    const unstartedChildren: ChildSummary[] = [
      {
        ...sampleChildren[0],
        attemptCount: 0,
        recentAttempts: [],
        subjects: [],
      },
    ];

    render(<FamilyOverview summaries={unstartedChildren} />);
    expect(screen.getByText(/ready to start/i)).toBeInTheDocument();
    expect(screen.getByText("Nothing finished yet")).toBeInTheDocument();
    expect(screen.getByText("Three things worth knowing")).toBeInTheDocument();
    expect(screen.getByText(/Children sign in with a code and a PIN/i)).toBeInTheDocument();
  });

  it("renders honest partial failure callout when unreadableAttemptCount > 0", () => {
    const partiallyFailingChildren: ChildSummary[] = [
      {
        ...sampleChildren[0],
        unreadableAttemptCount: 2,
      },
    ];

    render(<FamilyOverview summaries={partiallyFailingChildren} />);
    expect(
      screen.getByRole("heading", { name: "Some of this week's activity couldn't be read" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/2 attempts could not be verified from stored records/i),
    ).toBeInTheDocument();
  });

  it("renders loading state when forcedState=loading", () => {
    render(<FamilyOverview summaries={sampleChildren} forcedState="loading" />);
    expect(screen.getByRole("status")).toHaveTextContent("Checking this week's practice...");
  });

  it("renders error state when forcedState=error", () => {
    render(<FamilyOverview summaries={sampleChildren} forcedState="error" />);
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load your family summary.");
  });

  it("renders offline banner when forcedState=offline", () => {
    render(<FamilyOverview summaries={sampleChildren} forcedState="offline" />);
    expect(screen.getByText("You are offline.")).toBeInTheDocument();
  });

  it("renders side rail explaining 'What these figures are'", () => {
    render(<FamilyOverview summaries={sampleChildren} />);
    expect(screen.getByText("What these figures are")).toBeInTheDocument();
    expect(
      screen.getByText(/Everything above is worked out from finished timed papers/i),
    ).toBeInTheDocument();
  });
});
