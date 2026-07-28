import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { TeacherAnalyticsView } from "@/features/teacher/components/TeacherAnalyticsView";
import type { ClassOverview } from "@/features/teacher/analytics";
import type { StudentListRow } from "@/features/teacher/students-filter";

const classOverview: ClassOverview = {
  studentCount: 2,
  activeThisWeekCount: 1,
  averagePercentage: 68,
  atRiskCount: 1,
  subjectMastery: [{ subject: "numeracy", percentage: 68 }],
  summaries: [],
};

const studentRows: StudentListRow[] = [
  {
    studentId: "s1",
    displayName: "Ava Chen",
    yearLevel: 5,
    classId: "class-a",
    className: "5A",
    summary: {
      studentId: "s1",
      attemptCount: 4,
      lastActiveAt: "2026-01-01T00:00:00.000Z",
      averagePercentage: 80,
      questionsAttempted: 30,
      timeSpentSeconds: 900,
      strongestSubject: "numeracy",
      weakestSubject: "reading",
      standing: "on_track",
    },
  },
];

describe("TeacherAnalyticsView", () => {
  it("defaults to student reports and switches between the three tabs", async () => {
    const user = userEvent.setup();
    render(
      <TeacherAnalyticsView
        classOverview={classOverview}
        studentRows={studentRows}
        topics={[{ subject: "numeracy", percentage: 68, studentCount: 2 }]}
      />,
    );

    expect(screen.getByText("Ava Chen")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Class overview" }));
    expect(screen.getByText("Subject mastery")).toBeInTheDocument();
    expect(screen.getAllByText("68%").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Topic analysis" }));
    expect(screen.getByText("2 students")).toBeInTheDocument();
  });

  it("disables the export action as a placeholder", () => {
    render(
      <TeacherAnalyticsView classOverview={classOverview} studentRows={[]} topics={[]} />,
    );
    expect(screen.getByRole("button", { name: /export report/i })).toBeDisabled();
  });
});
