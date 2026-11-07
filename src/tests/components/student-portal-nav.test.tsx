import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StudentBottomNav } from "@/features/student/components/StudentBottomNav";
import { StudentSidebar } from "@/features/student/components/StudentSidebar";

const sidebar = (active: "home" | "results" = "home") =>
  render(
    <StudentSidebar
      active={active}
      displayName="Sam Lee"
      yearLevel={5}
      mathematicsPathways={[]}
      weekDots={[]}
      currentStreak={0}
      sessionsThisWeek={0}
      weeklyTarget={3}
    />,
  );

describe("student sidebar", () => {
  it("lists the five destinations in order, with Help Centre outside them", () => {
    sidebar();
    const nav = screen.getByRole("navigation", { name: "Student navigation" });
    expect(within(nav).getAllByRole("link").map((l) => l.textContent)).toEqual([
      "My Space",
      "Learning Hub",
      "Practice Studio",
      "Exam Centre",
      "My Results",
    ]);
    expect(within(nav).queryByRole("link", { name: "Help Centre" })).toBeNull();
    expect(screen.getByRole("link", { name: "Help Centre" })).toBeInTheDocument();
  });

  it("marks the active destination", () => {
    sidebar("results");
    expect(screen.getByRole("link", { name: "My Results" })).toHaveAttribute("aria-current", "page");
  });

  it("carries none of the removed placeholders", () => {
    sidebar();
    for (const text of [/840xp/, /Lvl 12/, /⌘K/, /Session 2025/, /NSW NESA/, /Stage 3/, /Search topics/]) {
      expect(screen.queryByText(text)).toBeNull();
    }
    expect(screen.queryByText("NAPLAN", { exact: true })).toBeNull();
  });
});

describe("student bottom nav", () => {
  it("uses short labels with the full destination names as accessible names", () => {
    render(<StudentBottomNav active="learn" />);
    const nav = screen.getByRole("navigation", { name: "Main sections" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual(["My Space", "Learning", "Practice", "Exams", "Results"]);
    expect(links.map((l) => l.getAttribute("aria-label"))).toEqual([
      "My Space", "Learning Hub", "Practice Studio", "Exam Centre", "My Results",
    ]);
    expect(screen.getByRole("link", { name: "Learning Hub" })).toHaveAttribute("aria-current", "page");
  });

  it("is hidden from lg up and every target is at least 44px", () => {
    render(<StudentBottomNav active="home" />);
    expect(screen.getByRole("navigation", { name: "Main sections" }).className).toContain("lg:hidden");
    for (const link of screen.getAllByRole("link")) {
      expect(link.className).toMatch(/min-h-14/);
      expect(link.className).toMatch(/min-w-11/);
      expect(link.className).toContain("focus-visible:ring-2");
    }
  });
});
