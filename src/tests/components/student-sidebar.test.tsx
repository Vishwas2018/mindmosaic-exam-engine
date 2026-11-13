import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentSidebar } from "@/features/student/components/StudentSidebar";

function mount(yearLevel: number | null) {
  return render(
    <StudentSidebar
      active="home"
      displayName="Vihaan"
      yearLevel={yearLevel}
      mathematicsPathways={[]}
      weekDots={[]}
      currentStreak={0}
      sessionsThisWeek={0}
      weeklyTarget={3}
    />,
  );
}

describe("StudentSidebar profile line", () => {
  it("shows no invented level or points: there is no XP model behind them", () => {
    mount(5);
    expect(screen.queryByText(/xp/i)).toBeNull();
    expect(screen.queryByText(/lvl|level 12|scholar/i)).toBeNull();
    expect(screen.getByText("Student · Year 5")).toBeInTheDocument();
  });

  it("falls back to a plain label when the year level is unknown", () => {
    mount(null);
    expect(screen.getByText("Student")).toBeInTheDocument();
  });

  it("gives every navigation link a 44px target", () => {
    mount(5);
    const nav = screen.getByRole("navigation", { name: "Student navigation" });
    for (const link of nav.querySelectorAll("a")) {
      expect(link.className).toContain("min-h-11");
    }
  });
});
