import { describe, expect, it } from "vitest";

import { categorizeAssignment } from "@/features/teacher/assignment-lifecycle";

const NOW = Date.parse("2026-06-15T00:00:00.000Z");
const PAST = "2026-06-01T00:00:00.000Z";
const FUTURE = "2026-07-01T00:00:00.000Z";

describe("categorizeAssignment", () => {
  it("is completed once every student has submitted", () => {
    expect(
      categorizeAssignment(
        { dueAt: PAST, students: [{ status: "submitted" }, { status: "submitted" }] },
        NOW,
      ),
    ).toBe("completed");
  });

  it("is upcoming when due in the future and nobody has started", () => {
    expect(
      categorizeAssignment(
        { dueAt: FUTURE, students: [{ status: "assigned" }, { status: "assigned" }] },
        NOW,
      ),
    ).toBe("upcoming");
  });

  it("is active once due in the future but at least one student has started", () => {
    expect(
      categorizeAssignment(
        { dueAt: FUTURE, students: [{ status: "in_progress" }, { status: "assigned" }] },
        NOW,
      ),
    ).toBe("active");
  });

  it("is active when overdue and not everyone has submitted", () => {
    expect(
      categorizeAssignment(
        { dueAt: PAST, students: [{ status: "assigned" }, { status: "submitted" }] },
        NOW,
      ),
    ).toBe("active");
  });

  it("treats a null due date as active once someone has started", () => {
    expect(
      categorizeAssignment({ dueAt: null, students: [{ status: "in_progress" }] }, NOW),
    ).toBe("active");
  });

  it("treats no recipients as active rather than a false completion", () => {
    expect(categorizeAssignment({ dueAt: PAST, students: [] }, NOW)).toBe("active");
  });
});
