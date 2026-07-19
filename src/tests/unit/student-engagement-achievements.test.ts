import { describe, expect, it } from "vitest";

import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { toAttemptSummary } from "@/features/student/engagement/attempts";
import type { AttemptSummary } from "@/features/student/engagement/attempts";

/* Fixed local clock: Friday 10 April 2026, 09:00. */
const NOW = new Date(2026, 3, 10, 9, 0, 0);

function attempt(
  year: number,
  month: number,
  day: number,
  percentage: number | null = 80,
): AttemptSummary {
  return {
    submittedAt: new Date(year, month - 1, day, 15, 0, 0).toISOString(),
    percentage,
  };
}

function byId(summary: ReturnType<typeof buildEngagementSummary>, id: string) {
  const found = summary.achievements.find((a) => a.id === id);
  if (!found) throw new Error(`missing achievement ${id}`);
  return found;
}

describe("toAttemptSummary", () => {
  it("extracts the objective percentage from a stored result", () => {
    expect(
      toAttemptSummary({
        submitted_at: "2026-04-01T05:00:00Z",
        result: { objectivePercentage: 85, otherField: true },
      }).percentage,
    ).toBe(85);
  });

  it("fails soft to a null score on malformed results", () => {
    expect(
      toAttemptSummary({ submitted_at: "2026-04-01T05:00:00Z", result: "junk" })
        .percentage,
    ).toBeNull();
  });
});

describe("buildEngagementSummary", () => {
  it("is fully locked and zeroed with no attempts", () => {
    const summary = buildEngagementSummary([], NOW);
    expect(summary.totalSessions).toBe(0);
    expect(summary.averagePercentage).toBeNull();
    expect(summary.currentStreak).toBe(0);
    expect(summary.achievements.every((a) => !a.earned)).toBe(true);
    expect(summary.timeline).toHaveLength(0);
  });

  it("earns First Steps on the first session, dated to that day", () => {
    const summary = buildEngagementSummary([attempt(2026, 4, 3)], NOW);
    const first = byId(summary, "first-session");
    expect(first.earned).toBe(true);
    expect(first.earnedOn).toBe("2026-04-03");
  });

  it("reports session-count progress on locked milestones", () => {
    const summary = buildEngagementSummary(
      [attempt(2026, 4, 1), attempt(2026, 4, 2)],
      NOW,
    );
    expect(byId(summary, "ten-sessions").progress).toEqual({
      value: 2,
      target: 10,
    });
  });

  it("earns streak badges retroactively with the completion date", () => {
    const summary = buildEngagementSummary(
      [attempt(2026, 4, 6), attempt(2026, 4, 7), attempt(2026, 4, 8)],
      NOW,
    );
    const streak = byId(summary, "three-day-streak");
    expect(streak.earned).toBe(true);
    expect(streak.earnedOn).toBe("2026-04-08");
    expect(byId(summary, "seven-day-streak").earned).toBe(false);
  });

  it("computes averages, best score, and perfect count from scored attempts", () => {
    const summary = buildEngagementSummary(
      [
        attempt(2026, 4, 1, 100),
        attempt(2026, 4, 2, 60),
        attempt(2026, 4, 3, null),
      ],
      NOW,
    );
    expect(summary.totalSessions).toBe(3);
    expect(summary.averagePercentage).toBe(80);
    expect(summary.bestPercentage).toBe(100);
    expect(summary.perfectCount).toBe(1);
    expect(byId(summary, "first-perfect").earnedOn).toBe("2026-04-01");
    expect(byId(summary, "top-marks").earned).toBe(true);
  });

  it("keeps unscoreable attempts counting towards streaks", () => {
    const summary = buildEngagementSummary(
      [attempt(2026, 4, 9, null), attempt(2026, 4, 10, null)],
      NOW,
    );
    expect(summary.currentStreak).toBe(2);
    expect(summary.averagePercentage).toBeNull();
  });

  it("builds a newest-first timeline of earned milestones", () => {
    const summary = buildEngagementSummary(
      [attempt(2026, 4, 1, 100), attempt(2026, 4, 2, 70)],
      NOW,
    );
    expect(summary.timeline.length).toBeGreaterThan(0);
    const days = summary.timeline.map((event) => event.dayKey);
    expect([...days].sort((a, b) => b.localeCompare(a))).toEqual(days);
  });
});
