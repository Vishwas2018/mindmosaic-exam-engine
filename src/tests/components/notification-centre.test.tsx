import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { NotificationCentre, useNotifications, type AppNotification } from "@/features/notifications";

const SAMPLE: AppNotification[] = [
  {
    id: "n1",
    type: "assignment",
    title: "New assignment: Fractions",
    description: "Due Friday",
    href: "/student/assignments/1",
    createdAt: "2026-07-20T10:00:00.000Z",
    read: false,
  },
  {
    id: "n2",
    type: "subscription",
    title: "Plan renewed",
    href: "/parent/billing",
    createdAt: "2026-07-19T10:00:00.000Z",
    read: true,
  },
];

function Demo({ initial = SAMPLE }: { initial?: AppNotification[] }) {
  const { notifications, groupedByType, unreadCount, markOneRead, markAllRead } =
    useNotifications(initial);
  return (
    <NotificationCentre
      notifications={notifications}
      groupedByType={groupedByType}
      unreadCount={unreadCount}
      onMarkOneRead={markOneRead}
      onMarkAllRead={markAllRead}
    />
  );
}

describe("NotificationCentre + useNotifications", () => {
  it("shows the unread count on the toggle button and in the live region", () => {
    render(<Demo />);
    expect(
      screen.getByRole("button", { name: "Notifications, 1 unread" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1 unread notifications")).toBeInTheDocument();
  });

  it("opens the panel grouped by notification type, with each item linked via href", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    const toggle = screen.getByRole("button", { name: "Notifications, 1 unread" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByText("Assignments")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /New assignment: Fractions/ });
    expect(link).toHaveAttribute("href", "/student/assignments/1");
  });

  it("marks a single notification read and updates the unread count", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));
    await user.click(screen.getByRole("button", { name: /Mark "New assignment: Fractions" as read/ }));

    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByText("No unread notifications")).toBeInTheDocument();
  });

  it("marks all notifications read via the panel action", async () => {
    const user = userEvent.setup();
    render(<Demo />);
    await user.click(screen.getByRole("button", { name: "Notifications, 1 unread" }));

    const markAll = screen.getByRole("button", { name: "Mark all read" });
    expect(markAll).not.toBeDisabled();
    await user.click(markAll);

    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
  });

  it("renders an empty state when there are no notifications", async () => {
    const user = userEvent.setup();
    render(<Demo initial={[]} />);
    await user.click(screen.getByRole("button", { name: "Notifications" }));
    expect(screen.getByText("You're all caught up.")).toBeInTheDocument();
  });
});
