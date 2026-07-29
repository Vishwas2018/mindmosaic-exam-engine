import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TeacherNotesPanel } from "@/features/teacher/components/TeacherNotesPanel";

describe("TeacherNotesPanel", () => {
  it("shows an empty state, then adds a note authored by the current teacher", async () => {
    const user = userEvent.setup();
    render(
      <TeacherNotesPanel
        studentId="student-1"
        teacherName="Ms Rivera"
        initialNotes={[]}
        initialFlag={{ studentId: "student-1", flagged: false, flaggedAt: null }}
      />,
    );

    expect(screen.getByText("No notes recorded yet.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Add a note"), "Struggling with fractions.");
    await user.click(screen.getByRole("button", { name: "Save note" }));

    expect(await screen.findByText("Struggling with fractions.")).toBeInTheDocument();
    expect(screen.getByText(/Ms Rivera/)).toBeInTheDocument();
    expect(screen.queryByText("No notes recorded yet.")).not.toBeInTheDocument();
  });

  it("toggles the manual intervention flag", async () => {
    const user = userEvent.setup();
    render(
      <TeacherNotesPanel
        studentId="student-2"
        teacherName="Ms Rivera"
        initialNotes={[]}
        initialFlag={{ studentId: "student-2", flagged: false, flaggedAt: null }}
      />,
    );

    expect(screen.getByText("Not currently flagged")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /flag for intervention/i }));
    expect(await screen.findByText(/^Flagged \d/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear flag" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear flag" }));
    expect(await screen.findByText("Not currently flagged")).toBeInTheDocument();
  });
});
