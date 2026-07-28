import { describe, expect, it } from "vitest";

import {
  DEFAULT_STUDENT_LIST_FILTERS,
  filterStudentRows,
  paginateRows,
  type StudentListRow,
} from "@/features/teacher/students-filter";

function row(overrides: Partial<StudentListRow> & { studentId: string }): StudentListRow {
  return {
    displayName: "Student",
    yearLevel: 5,
    classId: "class-a",
    className: "5A",
    summary: {
      studentId: overrides.studentId,
      attemptCount: 1,
      lastActiveAt: null,
      averagePercentage: null,
      questionsAttempted: 0,
      timeSpentSeconds: 0,
      strongestSubject: null,
      weakestSubject: null,
      standing: "at_risk",
    },
    ...overrides,
  };
}

describe("filterStudentRows", () => {
  const rows = [
    row({ studentId: "s1", displayName: "Ava Chen", yearLevel: 5, classId: "class-a" }),
    row({
      studentId: "s2",
      displayName: "Ben Diaz",
      yearLevel: 3,
      classId: "class-b",
      summary: {
        studentId: "s2",
        attemptCount: 5,
        lastActiveAt: null,
        averagePercentage: 90,
        questionsAttempted: 40,
        timeSpentSeconds: 500,
        strongestSubject: "numeracy",
        weakestSubject: null,
        standing: "on_track",
      },
    }),
  ];

  it("matches search case-insensitively against the display name", () => {
    const result = filterStudentRows(rows, { ...DEFAULT_STUDENT_LIST_FILTERS, search: "ava" });
    expect(result.map((r) => r.studentId)).toEqual(["s1"]);
  });

  it("filters by year level, class and performance band", () => {
    expect(
      filterStudentRows(rows, { ...DEFAULT_STUDENT_LIST_FILTERS, yearLevel: 3 }).map(
        (r) => r.studentId,
      ),
    ).toEqual(["s2"]);
    expect(
      filterStudentRows(rows, { ...DEFAULT_STUDENT_LIST_FILTERS, classId: "class-a" }).map(
        (r) => r.studentId,
      ),
    ).toEqual(["s1"]);
    expect(
      filterStudentRows(rows, { ...DEFAULT_STUDENT_LIST_FILTERS, band: "on_track" }).map(
        (r) => r.studentId,
      ),
    ).toEqual(["s2"]);
  });
});

describe("paginateRows", () => {
  const items = Array.from({ length: 25 }, (_, index) => index);

  it("slices to the requested page size and clamps out-of-range pages", () => {
    const first = paginateRows(items, 1, 10);
    expect(first.rows).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(first.totalPages).toBe(3);

    const clamped = paginateRows(items, 99, 10);
    expect(clamped.page).toBe(3);
    expect(clamped.rows).toEqual([20, 21, 22, 23, 24]);
  });

  it("always returns at least one page for an empty list", () => {
    const result = paginateRows([], 1, 10);
    expect(result.totalPages).toBe(1);
    expect(result.rows).toEqual([]);
  });
});
