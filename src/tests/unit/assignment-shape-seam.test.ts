import { describe, expect, it } from "vitest";

import { assignmentConfigSchema as teacherAssignmentConfigSchema } from "@/features/teacher/assignment-contract";
import { assignmentConfigSchema as studentAssignmentConfigSchema } from "@/features/student/assignments/types";

/**
 * The teacher-write and student-read halves of the assignments feature were
 * built by two independent threads against a shared informal contract
 * (assignments.config mirrors exam_sessions.config — see
 * docs/DATA_MODEL_AND_ROLES.md). The student side's schema was written
 * deliberately tolerant ("whatever row shape the teacher-side thread
 * settles on renders as gracefully as possible until the two are
 * reconciled" — see its own comment) specifically because the two sides
 * hadn't been integrated yet.
 *
 * This proves the reconciliation actually landed: config produced by the
 * real teacher-side schema round-trips through the real student-side
 * schema with every field intact, not just via the tolerant-parsing
 * fallback (assignmentConfigSchema.safeParse failing and the page falling
 * back to `{}`, per fetch-student-assignments.ts).
 */
describe("assignment config shape: teacher-write -> student-read", () => {
  it("a config built by the teacher-side schema parses successfully on the student side with every field intact", () => {
    const teacherInput = {
      yearLevel: 5,
      examStyle: "icas_style",
      subject: "reading",
      questionCount: 20,
      timing: "timed",
      bankId: "practice",
      title: "Week 6 comprehension check",
    };

    const written = teacherAssignmentConfigSchema.parse(teacherInput);
    // This is exactly what the teacher route inserts into assignments.config
    // (src/app/api/teacher/assignments/route.ts) — a plain JSON value, as it
    // would be read back from Postgres jsonb.
    const storedAsJson = JSON.parse(JSON.stringify(written)) as unknown;

    const read = studentAssignmentConfigSchema.safeParse(storedAsJson);

    expect(read.success).toBe(true);
    if (!read.success) return;
    expect(read.data.title).toBe("Week 6 comprehension check");
    expect(read.data.yearLevel).toBe(5);
    expect(read.data.examStyle).toBe("icas_style");
    expect(read.data.subject).toBe("reading");
    expect(read.data.questionCount).toBe(20);
    expect(read.data.timing).toBe("timed");
  });

  it("survives every subject/style/questionCount combination the teacher UI can produce", () => {
    const subjects = ["numeracy", "reading", "language", "mixed"] as const;
    const styles = ["naplan_style", "icas_style", "mixed"] as const;
    const counts = [10, 20, 30, "full"] as const;

    for (const subject of subjects) {
      for (const examStyle of styles) {
        for (const questionCount of counts) {
          const written = teacherAssignmentConfigSchema.parse({
            yearLevel: "mixed",
            examStyle,
            subject,
            questionCount,
            timing: "untimed",
            title: "Combo check",
          });
          const read = studentAssignmentConfigSchema.safeParse(
            JSON.parse(JSON.stringify(written)),
          );
          expect(read.success).toBe(true);
        }
      }
    }
  });
});
