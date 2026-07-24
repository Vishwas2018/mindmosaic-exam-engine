import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import { StudentShell, type StudentNavKey } from "@/features/student/components/StudentShell";

// StudentShell renders AuthNav, which calls useRouter() (for the
// sign-out → router.refresh() fix) regardless of auth status — needs the
// same next/navigation stub every other AuthNav-rendering test uses.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

/*
 * The unified shell replaces two incompatible ones: the old StudentShell
 * (home/learn only) and the discarded StudentPortalShell (assignments/
 * engagement only, with its own separate 3-item nav). This proves every
 * screen — including the two that used to have no link to home/learn, and
 * the two that used to have no link to assignments/engagement — now shares
 * one nav that covers all four.
 */

function renderShell(active: StudentNavKey) {
  return render(
    <AuthProvider>
      <StudentShell active={active}>
        <p>student content</p>
      </StudentShell>
    </AuthProvider>,
  );
}

const NAV_LINKS: ReadonlyArray<{ name: string; href: string }> = [
  { name: "Dashboard", href: "/student" },
  { name: "Learn", href: "/student/learn" },
  { name: "Assignments", href: "/student/assignments" },
  { name: "Progress", href: "/student/engagement" },
  { name: "Practice", href: "/#exam-setup" },
  { name: "Results", href: "/results" },
];

describe("StudentShell", () => {
  it("links to every screen the two former shells covered between them", () => {
    renderShell("home");
    const nav = screen.getByRole("navigation", { name: "Student navigation" });
    for (const link of NAV_LINKS) {
      const anchor = screen.getByRole("link", { name: link.name });
      expect(nav).toContainElement(anchor);
      expect(anchor).toHaveAttribute("href", link.href);
    }
  });

  it("marks assignments as the current page (a route the old StudentShell never knew about)", () => {
    renderShell("assignments");
    expect(screen.getByRole("link", { name: "Assignments" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks engagement (Progress) as the current page (a route the old StudentShell never knew about)", () => {
    renderShell("engagement");
    expect(screen.getByRole("link", { name: "Progress" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Learn" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks home as the current page", () => {
    renderShell("home");
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks learn as the current page", () => {
    renderShell("learn");
    expect(screen.getByRole("link", { name: "Learn" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("never marks the external Practice/Results links as current", () => {
    for (const active of ["home", "learn", "assignments", "engagement"] as const) {
      const { unmount } = renderShell(active);
      expect(screen.getByRole("link", { name: "Practice" })).not.toHaveAttribute(
        "aria-current",
      );
      expect(screen.getByRole("link", { name: "Results" })).not.toHaveAttribute(
        "aria-current",
      );
      unmount();
    }
  });

  it("renders the passed-in children inside the main landmark", () => {
    renderShell("home");
    expect(
      screen.getByRole("main").querySelector("p"),
    ).toHaveTextContent("student content");
  });
});
