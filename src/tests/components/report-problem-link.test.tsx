import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/parent",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock("@/features/auth", () => ({
  AuthNav: () => null,
  useAuth: () => ({ status: "anonymous", role: null }),
}));
vi.mock("@/features/auth/components/AuthNav", () => ({ AuthNav: () => null }));

import { ParentShell } from "@/features/parent-dashboard/components/ParentShell";
import { REPORT_PROBLEM_HREF, ReportProblemLink } from "@/features/support/ReportProblemLink";

describe("Report a problem", () => {
  it("is a mailto to the one real support address with a beta subject and no name asked for", () => {
    expect(REPORT_PROBLEM_HREF.startsWith("mailto:hello@mindmosaic.app?")).toBe(true);
    const params = new URLSearchParams(REPORT_PROBLEM_HREF.split("?")[1]);
    expect(params.get("subject")).toMatch(/beta/i);
    expect(params.get("body")).toMatch(/don't include your child's full name/i);
  });

  it("renders as a keyboard-reachable link", () => {
    render(<ReportProblemLink />);
    expect(screen.getByRole("link", { name: /report a problem/i })).toHaveAttribute("href", REPORT_PROBLEM_HREF);
  });

  it("is present in the parent shell", () => {
    render(
      <ParentShell active="/parent">
        <p>content</p>
      </ParentShell>,
    );
    expect(screen.getByRole("link", { name: /report a problem/i })).toBeInTheDocument();
  });
});
