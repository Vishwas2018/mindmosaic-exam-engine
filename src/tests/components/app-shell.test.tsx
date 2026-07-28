import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppShell, GlobalNav, ProfileMenu, type ShellNavItem } from "@/features/shell";

const NAV_ITEMS: ShellNavItem[] = [
  { key: "home", label: "Dashboard", href: "/student" },
  { key: "learn", label: "Learn", href: "/student/learn" },
];

describe("GlobalNav", () => {
  it("labels the nav landmark by role and marks the active item current", () => {
    render(<GlobalNav role="student" items={NAV_ITEMS} activeKey="learn" />);
    const nav = screen.getByRole("navigation", { name: "Student navigation" });
    expect(within(nav).getByRole("link", { name: "Learn" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(nav).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});

describe("ProfileMenu", () => {
  it("opens the account menu and calls onLogout", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(<ProfileMenu user={{ name: "Ada Lovelace", email: "ada@example.com" }} onLogout={onLogout} />);

    const toggle = screen.getByRole("button", { name: "Account menu for Ada Lovelace" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

describe("AppShell", () => {
  it("renders a role-scoped nav, main landmark with children, and header slots", () => {
    render(
      <AppShell
        role="parent"
        navItems={NAV_ITEMS}
        activeKey="home"
        user={{ name: "Ada" }}
        onLogout={vi.fn()}
        notificationSlot={<span>notif-slot</span>}
        childSwitcherSlot={<span>child-switcher</span>}
      >
        <p>dashboard content</p>
      </AppShell>,
    );

    expect(screen.getByRole("navigation", { name: "Parent navigation" })).toBeInTheDocument();
    expect(screen.getByRole("main", { name: "Parent content" })).toHaveTextContent(
      "dashboard content",
    );
    expect(screen.getByText("notif-slot")).toBeInTheDocument();
    expect(screen.getByText("child-switcher")).toBeInTheDocument();
  });

  it("toggles a mobile navigation disclosure independent of the desktop nav", async () => {
    const user = userEvent.setup();
    render(
      <AppShell role="teacher" navItems={NAV_ITEMS} user={{ name: "T" }} onLogout={vi.fn()}>
        <p>content</p>
      </AppShell>,
    );

    expect(screen.getAllByRole("navigation", { name: "Teacher navigation" })).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Open navigation menu" }));
    expect(screen.getAllByRole("navigation", { name: "Teacher navigation" })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Close navigation menu" }));
    expect(screen.getAllByRole("navigation", { name: "Teacher navigation" })).toHaveLength(1);
  });

  it("never wires up logout itself — it only forwards the caller's onLogout", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(
      <AppShell role="admin" navItems={NAV_ITEMS} user={{ name: "Admin" }} onLogout={onLogout}>
        <p>content</p>
      </AppShell>,
    );
    await user.click(screen.getByRole("button", { name: "Account menu for Admin" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
