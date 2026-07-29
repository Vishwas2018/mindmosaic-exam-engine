import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AssignmentsBoard } from "@/features/teacher/components/AssignmentsBoard";
import type { AssignmentWithProgress } from "@/features/teacher/data";

const BASE_CONFIG = {
  yearLevel: 5 as const,
  examStyle: "naplan_style" as const,
  subject: "numeracy" as const,
  questionCount: 10 as const,
  timing: "untimed" as const,
};

const FAR_FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const ASSIGNMENTS: AssignmentWithProgress[] = [
  {
    id: "assignment-completed",
    classId: "class-a",
    config: { ...BASE_CONFIG, title: "Completed set" },
    dueAt: PAST,
    createdAt: PAST,
    students: [{ studentId: "s1", status: "submitted", attemptId: "a1" }],
  },
  {
    id: "assignment-upcoming",
    classId: "class-a",
    config: { ...BASE_CONFIG, title: "Upcoming set" },
    dueAt: FAR_FUTURE,
    createdAt: PAST,
    students: [{ studentId: "s1", status: "assigned", attemptId: null }],
  },
  {
    id: "assignment-active",
    classId: "class-a",
    config: { ...BASE_CONFIG, title: "Active set" },
    dueAt: PAST,
    createdAt: PAST,
    students: [{ studentId: "s1", status: "in_progress", attemptId: null }],
  },
];

const nameFor = new Map([["s1", "Ava Chen"]]);

describe("AssignmentsBoard", () => {
  it("groups assignments into Active/Upcoming/Completed tabs", async () => {
    const user = userEvent.setup();
    render(<AssignmentsBoard assignments={ASSIGNMENTS} nameFor={nameFor} />);

    expect(screen.getByText("Active set")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Active (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Upcoming (1)" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Completed (1)" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Upcoming (1)" }));
    expect(screen.getByText("Upcoming set")).toBeInTheDocument();
    expect(screen.queryByText("Active set")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Completed (1)" }));
    expect(screen.getByText("Completed set")).toBeInTheDocument();
  });

  it("archives an assignment after confirmation, removing it from its tab", async () => {
    const user = userEvent.setup();
    render(<AssignmentsBoard assignments={ASSIGNMENTS} nameFor={nameFor} />);

    await user.click(screen.getByRole("button", { name: /archive/i }));
    expect(screen.getByRole("heading", { name: "Archive this assignment?" })).toBeVisible();

    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Archive" }));

    expect(await screen.findByRole("tab", { name: "Active (0)" })).toBeInTheDocument();
    expect(screen.queryByText("Active set")).not.toBeInTheDocument();
  });
});
