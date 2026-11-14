import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ParentDashboard } from "@/features/parent-dashboard/components/ParentDashboard";
import { buildChildSummary } from "@/features/parent-dashboard/summary";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const NOW = new Date("2026-10-30T00:00:00.000Z");
const profile = (id: string, displayName: string) => ({ id, displayName, yearLevel: 5, createdAt: "2026-01-01T00:00:00.000Z" });
const subscription = { status: "ready", subscription: null } as never;

function summaries(archivedId?: string) {
  return [profile("c1", "Arjun"), profile("c2", "Priya")].map((p) => ({
    ...buildChildSummary(p, [], NOW),
    archived: p.id === archivedId,
  }));
}

describe("ParentDashboard with an archived child", () => {
  it("opens on the active child and labels the archived one in the switcher", () => {
    render(<ParentDashboard summaries={summaries("c1")} subscription={subscription} hasAccess />);

    expect(screen.getByRole("heading", { name: /how priya is doing/i })).toBeInTheDocument();
    const tabs = screen.getByRole("tablist", { name: /choose a child/i });
    expect(within(tabs).getByText("Archived")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a session for priya/i })).toBeInTheDocument();
  });

  it("selecting the archived child keeps their results visible, explains the paused login and removes 'Start a session'", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    render(<ParentDashboard summaries={summaries("c1")} subscription={subscription} hasAccess />);

    await user.click(screen.getByRole("tab", { name: /arjun/i }));

    expect(screen.getByRole("heading", { name: /how arjun is doing/i })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/arjun's login is archived/i);
    expect(screen.getByRole("link", { name: /restore from manage children/i })).toHaveAttribute("href", "/parent/children");
    expect(screen.queryByRole("link", { name: /start a session for arjun/i })).not.toBeInTheDocument();
  });

  it("shows no archived labelling when nobody is archived", () => {
    render(<ParentDashboard summaries={summaries()} subscription={subscription} hasAccess />);
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /start a session for arjun/i })).toBeInTheDocument();
  });
});
