import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StreakWeeklyGoalWidget } from "@/features/student/components/StreakWeeklyGoalWidget";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import type { AttemptSummary } from "@/features/student/engagement/attempts";

const NOW = new Date("2026-07-28T09:00:00.000Z");

function attempt(daysAgo: number, percentage = 80): AttemptSummary {
  const date = new Date(NOW);
  date.setDate(date.getDate() - daysAgo);
  return { submittedAt: date.toISOString(), percentage };
}

describe("StreakWeeklyGoalWidget", () => {
  it("renders nothing for a student with no sessions", () => {
    const summary = buildEngagementSummary([], NOW);
    const { container } = render(
      <StreakWeeklyGoalWidget summary={summary} attempts={[]} now={NOW} />,
    );
    expect(container).toBeEmptyDOMElement();
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
