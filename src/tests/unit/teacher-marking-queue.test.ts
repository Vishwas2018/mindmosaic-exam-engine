import { describe, expect, it } from "vitest";

import {
  deriveMarkingQueue,
  type AttemptForMarking,
  type EssayMarkRow,
} from "@/features/teacher/marking-queue";

function attempt(
  id: string,
  studentId: string,
  manualReviewQuestions: { questionId: string; availableMarks: number }[],
): AttemptForMarking {
  return { id, studentId, submittedAt: "2026-07-01T00:00:00.000Z", manualReviewQuestions };
}

function mark(overrides: Partial<EssayMarkRow> & { attemptId: string; questionId: string }): EssayMarkRow {
  return {
    markedBy: "teacher-1",
    awardedMarks: 4,
    maxMarks: 5,
    feedback: null,
    markedAt: "2026-07-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("deriveMarkingQueue (marking-status transitions)", () => {
  it("an unmarked manual-review question starts pending", () => {
    const [result] = deriveMarkingQueue(
      [attempt("a1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [],
    );
    expect(result.items).toEqual([
      expect.objectContaining({ questionId: "q1", status: "pending", awardedMarks: null }),
    ]);
    expect(result.fullyMarked).toBe(false);
  });

  it("transitions to marked once an essay_marks row exists for it", () => {
    const [result] = deriveMarkingQueue(
      [attempt("a1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [mark({ attemptId: "a1", questionId: "q1", awardedMarks: 4 })],
    );
    expect(result.items).toEqual([
      expect.objectContaining({ questionId: "q1", status: "marked", awardedMarks: 4 }),
    ]);
    expect(result.fullyMarked).toBe(true);
  });

  it("an attempt with several manual-review questions stays pending until every one is marked", () => {
    const [result] = deriveMarkingQueue(
      [
        attempt("a1", "student-1", [
          { questionId: "q1", availableMarks: 5 },
          { questionId: "q2", availableMarks: 3 },
        ]),
      ],
      [mark({ attemptId: "a1", questionId: "q1", awardedMarks: 5 })],
    );
    expect(result.fullyMarked).toBe(false);
    expect(result.items.find((item) => item.questionId === "q1")?.status).toBe("marked");
    expect(result.items.find((item) => item.questionId === "q2")?.status).toBe("pending");
  });

  it("a re-marked question keeps status marked and reflects the latest awarded value", () => {
    const [result] = deriveMarkingQueue(
      [attempt("a1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [mark({ attemptId: "a1", questionId: "q1", awardedMarks: 2, feedback: "Revised down" })],
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({ status: "marked", awardedMarks: 2, feedback: "Revised down" }),
    );
  });

  it("marks for a different attempt or question never bleed across", () => {
    const [result] = deriveMarkingQueue(
      [attempt("a1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [
        mark({ attemptId: "a1", questionId: "q2", awardedMarks: 1 }),
        mark({ attemptId: "a2", questionId: "q1", awardedMarks: 1 }),
      ],
    );
    expect(result.items[0].status).toBe("pending");
  });

  it("an attempt with no manual-review questions never appears in the queue", () => {
    const results = deriveMarkingQueue([attempt("a1", "student-1", [])], []);
    expect(results[0].items).toEqual([]);
    expect(results[0].fullyMarked).toBe(true);
  });
});
