import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LearningInsights } from "@/features/parent-dashboard/components/LearningInsights";
import type { ChildSummary } from "@/features/parent-dashboard/summary";

function makeChild(overrides: Partial<ChildSummary> = {}): ChildSummary {
  return {
    childId: "child-1",
    displayName: "Arjun",
    yearLevel: 5,
    attemptCount: 3,
    unreadableAttemptCount: 0,
    latestPercentage: 90,
    previousPercentage: 70,
    averagePercentage: 80,
    attemptsThisWeek: 2,
    timeThisWeekSeconds: 600,
    streakDays: 3,
    weekActivity: [],
    subjects: [],
    recentAttempts: [],
    readinessScore: 85,
    topicsMasteredCount: 2,
    observations: ["Arjun is strongest in Numeracy (90%)."],
    recommendedActions: [
      { id: "focus-reading", title: "Practise reading", description: "Currently at 60%." },
    ],
    ...overrides,
  };
}

describe("LearningInsights", () => {
  it("shows an upgrade prompt instead of insights when the parent has no active access", () => {
    render(<LearningInsights child={makeChild()} hasAccess={false} />);
    expect(screen.getByText(/unlock learning insights/i)).toBeInTheDocument();
    expect(screen.queryByText(/is strongest in numeracy/i)).not.toBeInTheDocument();
  });

  it("renders observations, recommended actions, and stat badges when access is active", () => {
    render(<LearningInsights child={makeChild()} hasAccess />);
    expect(screen.getByText(/is strongest in numeracy/i)).toBeInTheDocument();
    expect(screen.getByText("Practise reading")).toBeInTheDocument();
    expect(screen.getByText("2 topics mastered")).toBeInTheDocument();
    expect(screen.getByText("Readiness score: 85%")).toBeInTheDocument();
  });

  it("shows a fallback message when there are no observations yet", () => {
    render(<LearningInsights child={makeChild({ observations: [] })} hasAccess />);
    expect(screen.getByText(/not enough scored attempts yet/i)).toBeInTheDocument();
  });
});
