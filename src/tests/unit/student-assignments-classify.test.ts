import { describe, expect, it } from "vitest";

import {
  assignmentTitle,
  describeAssignmentConfig,
  dueLabel,
  dueState,
  groupAssignments,
} from "@/features/student/assignments/classify";
import type { StudentAssignment } from "@/features/student/assignments/types";

/* Fixed local clock: Wednesday 10 April 2026, 09:00. */
const NOW = new Date(2026, 3, 10, 9, 0, 0);

function iso(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour, 0, 0).toISOString();
}

function makeAssignment(
  overrides: Partial<StudentAssignment> = {},
): StudentAssignment {
  return {
    assignmentId: crypto.randomUUID(),
    status: "assigned",
    config: {},
    className: null,
    dueAt: null,
    createdAt: iso(2026, 4, 1),
    submittedAt: null,
    score: null,
    ...overrides,
  };
}

describe("dueState", () => {
  it("is no_due_date when due_at is null", () => {
    expect(dueState(null, NOW)).toBe("no_due_date");
  });

  it("is overdue once the deadline has passed", () => {
    expect(dueState(iso(2026, 4, 7), NOW)).toBe("overdue");
  });

  it("is due_soon within 48 hours", () => {
    expect(dueState(iso(2026, 4, 11), NOW)).toBe("due_soon");
  });

  it("is upcoming beyond 48 hours", () => {
    expect(dueState(iso(2026, 4, 20), NOW)).toBe("upcoming");
  });
});

describe("dueLabel", () => {
  it("returns null with no due date", () => {
    expect(dueLabel(null, NOW)).toBeNull();
  });

  it("counts calendar days overdue", () => {
    expect(dueLabel(iso(2026, 4, 7), NOW)).toMatch(/3 days overdue$/);
  });

  it("uses singular for one day overdue", () => {
    expect(dueLabel(iso(2026, 4, 9), NOW)).toMatch(/1 day overdue$/);
  });

  it("says tomorrow for a next-day deadline", () => {
    expect(dueLabel(iso(2026, 4, 11), NOW)).toMatch(/tomorrow$/);
  });

  it("says due today for a later-today deadline", () => {
    expect(dueLabel(iso(2026, 4, 10, 17), NOW)).toMatch(/^Due today/);
  });

  it("counts days left for future deadlines", () => {
    expect(dueLabel(iso(2026, 4, 14), NOW)).toMatch(/4 days left$/);
  });
});

describe("describeAssignmentConfig / assignmentTitle", () => {
  it("describes a full exam-selection config", () => {
    const text = describeAssignmentConfig({
      yearLevel: 5,
      examStyle: "naplan_style",
      subject: "numeracy",
      questionCount: 20,
      timing: "timed",
    });
    expect(text).toBe(
      "Grade 5 · NAPLAN-style practice · Numeracy · 20 questions · Timed",
    );
  });

  it("describes partial configs without leaving separators dangling", () => {
    expect(describeAssignmentConfig({ subject: "reading" })).toBe("Reading");
    expect(describeAssignmentConfig({})).toBe("");
  });

  it("shows the full-set count", () => {
    expect(describeAssignmentConfig({ questionCount: "full" })).toBe("Full set");
  });

  it("prefers an explicit title", () => {
    const a = makeAssignment({
      config: { title: "Week 14 revision", subject: "numeracy" },
    });
    expect(assignmentTitle(a)).toBe("Week 14 revision");
  });

  it("derives a title from style and subject when none is stored", () => {
    const a = makeAssignment({
      config: { examStyle: "icas_style", subject: "reading" },
    });
    expect(assignmentTitle(a)).toBe("ICAS-style practice — Reading");
  });

  it("falls back to a generic title for an empty config", () => {
    expect(assignmentTitle(makeAssignment())).toBe("Practice assignment");
  });
});

describe("groupAssignments", () => {
  it("groups by status and counts overdue open work", () => {
    const grouped = groupAssignments(
      [
        makeAssignment({ status: "assigned", dueAt: iso(2026, 4, 7) }),
        makeAssignment({ status: "assigned", dueAt: iso(2026, 4, 20) }),
        makeAssignment({ status: "in_progress", dueAt: iso(2026, 4, 8) }),
        makeAssignment({
          status: "submitted",
          submittedAt: iso(2026, 4, 6),
        }),
      ],
      NOW,
    );
    expect(grouped.toDo).toHaveLength(2);
    expect(grouped.inProgress).toHaveLength(1);
    expect(grouped.completed).toHaveLength(1);
    expect(grouped.overdueCount).toBe(2);
  });

  it("sorts open work by due date with undated items last", () => {
    const early = makeAssignment({ dueAt: iso(2026, 4, 11) });
    const late = makeAssignment({ dueAt: iso(2026, 4, 20) });
    const undated = makeAssignment({ dueAt: null });
    const grouped = groupAssignments([undated, late, early], NOW);
    expect(grouped.toDo.map((a) => a.assignmentId)).toEqual([
      early.assignmentId,
      late.assignmentId,
      undated.assignmentId,
    ]);
  });

  it("sorts completed work most recent first", () => {
    const older = makeAssignment({
      status: "submitted",
      submittedAt: iso(2026, 4, 1),
    });
    const newer = makeAssignment({
      status: "submitted",
      submittedAt: iso(2026, 4, 6),
    });
    const grouped = groupAssignments([older, newer], NOW);
    expect(grouped.completed.map((a) => a.assignmentId)).toEqual([
      newer.assignmentId,
      older.assignmentId,
    ]);
  });
});
