import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import type { AttemptSummary } from "@/features/student/engagement/attempts";
import { EngagementView } from "@/features/student/engagement/components/EngagementView";

/*
 * Regression: the streak row held 7 fixed 32px dots plus "Practise today to keep your streak alive." in a non-wrapping
 * flex row, which overflowed a 375px viewport for any child who practised yesterday but not yet today (surfaced in CI
 * only after UTC midnight). jsdom has no layout, so this pins the structural fix: the row wraps, the dots never shrink.
 */
describe("EngagementView streak row", () => {
  it("lets the streak row wrap when the 'practise today' reminder is shown", () => {
    const now = new Date("2026-11-26T10:00:00");
    const yesterday: AttemptSummary = {
      submittedAt: new Date("2026-11-25T10:00:00").toISOString(),
      percentage: 80,
      attemptedQuestions: 10,
    };
    const summary = buildEngagementSummary([yesterday], now);
    render(<EngagementView summary={summary} attempts={[yesterday]} now={now} />);

    const reminder = screen.getByText("Practise today to keep your streak alive.");
    const row = reminder.parentElement as HTMLElement;
    expect(row.className).toContain("flex-wrap");

    const dots = screen.getByRole("list", { name: /this week's practice days/i });
    expect(dots.className).toContain("shrink-0");
  });
});
