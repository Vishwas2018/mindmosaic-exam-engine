import { describe, expect, it } from "vitest";

import { examSelectionConfigSchema } from "@/features/exam-engine/scoring/server-scoring-contract";
import {
  assignmentConfigSchema,
  createAssignmentRequestSchema,
} from "@/features/teacher/assignment-contract";

const validConfig = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 20,
  timing: "timed",
  bankId: "practice",
  title: "Fractions focus week",
};

describe("assignmentConfigSchema", () => {
  it("accepts a full config and defaults bankId to curated", () => {
    const parsed = assignmentConfigSchema.parse({ ...validConfig, bankId: undefined });
    expect(parsed.bankId).toBe("curated");
    expect(parsed.title).toBe("Fractions focus week");
  });

  it("rejects a blank title", () => {
    expect(
      assignmentConfigSchema.safeParse({ ...validConfig, title: "   " }).success,
    ).toBe(false);
  });

  it("stays readable by the exam-session selection schema", () => {
    /* The student-side thread feeds assignments.config into the existing
       session endpoint; the selection schema must parse it as-is, with the
       presentation-only title stripped rather than rejected. */
    const stored = assignmentConfigSchema.parse(validConfig);
    const parsed = examSelectionConfigSchema.safeParse(stored);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        yearLevel: 5,
        examStyle: "naplan_style",
        subject: "numeracy",
        questionCount: 20,
        timing: "timed",
      });
    }
  });
});

describe("createAssignmentRequestSchema", () => {
  const base = {
    classId: "5f2b7c9e-8a49-4d6f-9f1b-2f3c4d5e6a7b",
    config: validConfig,
    dueAt: "2026-07-25T09:00:00+10:00",
    studentIds: ["3e0a1b2c-4d5e-6f70-8192-a3b4c5d6e7f8"],
  };

  it("accepts a valid request", () => {
    expect(createAssignmentRequestSchema.safeParse(base).success).toBe(true);
  });

  it("defaults dueAt to null when omitted", () => {
    const parsed = createAssignmentRequestSchema.parse({ ...base, dueAt: undefined });
    expect(parsed.dueAt).toBeNull();
  });

  it("rejects an empty student selection", () => {
    expect(
      createAssignmentRequestSchema.safeParse({ ...base, studentIds: [] }).success,
    ).toBe(false);
  });

  it("rejects non-uuid ids", () => {
    expect(
      createAssignmentRequestSchema.safeParse({ ...base, classId: "7A" }).success,
    ).toBe(false);
  });
});
