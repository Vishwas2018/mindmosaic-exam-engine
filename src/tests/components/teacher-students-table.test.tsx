import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StudentsTable } from "@/features/teacher/components/StudentsTable";
import type { TeacherClass } from "@/features/teacher/data";
import type { StudentListRow } from "@/features/teacher/students-filter";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const CLASS_A: TeacherClass = { id: "class-a", name: "5A", yearLevel: 5 };
const CLASS_B: TeacherClass = { id: "class-b", name: "5B", yearLevel: 5 };

function row(overrides: Partial<StudentListRow> & { studentId: string }): StudentListRow {
  return {
    displayName: "Student",
    yearLevel: 5,
    classId: CLASS_A.id,
    className: CLASS_A.name,
    summary: {
      studentId: overrides.studentId,
      attemptCount: 3,
      lastActiveAt: "2026-01-01T00:00:00.000Z",
      averagePercentage: 72,
      questionsAttempted: 20,
      timeSpentSeconds: 600,
      strongestSubject: "numeracy",
      weakestSubject: "reading",
      standing: "on_track",
    },
    ...overrides,
  };
}

describe("StudentsTable", () => {
  it("filters by search text", async () => {
    const user = userEvent.setup();
    const rows = [
      row({ studentId: "s1", displayName: "Ava Chen" }),
      row({ studentId: "s2", displayName: "Ben Diaz" }),
    ];
    render(<StudentsTable rows={rows} classes={[CLASS_A]} />);

    expect(screen.getByText("Ava Chen")).toBeInTheDocument();
    expect(screen.getByText("Ben Diaz")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Search"), "ava");
    expect(screen.getByText("Ava Chen")).toBeInTheDocument();
    expect(screen.queryByText("Ben Diaz")).not.toBeInTheDocument();
  });

  it("disables bulk assignment until selected students share one class, then navigates", async () => {
    const user = userEvent.setup();
    const rows = [
      row({ studentId: "s1", displayName: "Ava Chen", classId: CLASS_A.id, className: CLASS_A.name }),
      row({ studentId: "s2", displayName: "Ben Diaz", classId: CLASS_B.id, className: CLASS_B.name }),
    ];
    render(<StudentsTable rows={rows} classes={[CLASS_A, CLASS_B]} />);

    const bulkButton = screen.getByRole("button", { name: /create assignment for selected/i });
    expect(bulkButton).toBeDisabled();

    await user.click(screen.getByLabelText("Select Ava Chen"));
    expect(bulkButton).toBeEnabled();

    await user.click(screen.getByLabelText("Select Ben Diaz"));
    expect(bulkButton).toBeDisabled();
    expect(
      screen.getByText(/select students from a single class/i),
    ).toBeInTheDocument();

    await user.click(screen.getByLabelText("Select Ben Diaz"));
    expect(bulkButton).toBeEnabled();
    await user.click(bulkButton);
    expect(push).toHaveBeenCalledWith(
      `/teacher/assignments/new?class=${CLASS_A.id}&students=s1`,
    );
  });

  it("paginates beyond the page size", async () => {
    const user = userEvent.setup();
    const rows = Array.from({ length: 12 }, (_, index) =>
      row({ studentId: `s${index}`, displayName: `Student ${index}` }),
    );
    render(<StudentsTable rows={rows} classes={[CLASS_A]} />);

    expect(screen.getByText("Student 0")).toBeInTheDocument();
    expect(screen.queryByText("Student 11")).not.toBeInTheDocument();
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Student 11")).toBeInTheDocument();
    expect(screen.queryByText("Student 0")).not.toBeInTheDocument();
  });

  it("shows an empty state when no rows match the filters", async () => {
    const user = userEvent.setup();
    const rows = [row({ studentId: "s1", displayName: "Ava Chen" })];
    render(<StudentsTable rows={rows} classes={[CLASS_A]} />);

    await user.type(screen.getByLabelText("Search"), "nobody");
    expect(screen.getByText("No students match these filters")).toBeInTheDocument();
  });
});
