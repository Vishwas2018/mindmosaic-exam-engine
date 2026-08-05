import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StreakWeeklyGoalWidget } from "@/features/student/components/StreakWeeklyGoalWidget";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import type { AttemptSummary } from "@/features/student/engagement/attempts";

const NOW = new Date("2026-07-28T09:00:00.000Z");

function attempt(daysAgo: number, percentage = 80): AttemptSummary {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  return { submittedAt: date.toISOString(), percentage, attemptedQuestions: 10 };
}

describe("StreakWeeklyGoalWidget", () => {
  /*
   * Was "renders nothing for a student with no sessions". Hiding the widget
   * meant a brand-new student never learned there was a weekly goal to aim
   * at — on a dashboard an empty panel is worse than a zeroed one, so it now
   * shows the target framed forwards instead of disappearing.
   */
  it("shows the weekly goal as a target for a student with no sessions", () => {
    const summary = buildEngagementSummary([], NOW);
    render(<StreakWeeklyGoalWidget summary={summary} attempts={[]} now={NOW} />);
    expect(
      screen.getByText(/0 of 5 sessions this week — finish one to start your streak/),
    ).toBeInTheDocument();
  });

  it("shows the current streak and this week's session count against the shared weekly target", () => {
    const attempts = [attempt(0), attempt(1), attempt(2)];
    const summary = buildEngagementSummary(attempts, NOW);
    render(<StreakWeeklyGoalWidget summary={summary} attempts={attempts} now={NOW} />);

    expect(screen.getByText(String(summary.currentStreak))).toBeInTheDocument();
    expect(screen.getByText("day streak")).toBeInTheDocument();
    expect(screen.getByText("2 of 5 sessions this week")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View progress/ })).toHaveAttribute(
      "href",
      "/student/engagement",
    );
  });
});
