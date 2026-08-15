import { describe, expect, it } from "vitest";

import {
  deriveMarkingQueue,
  type ManualMarkRow,
  type SittingForMarking,
} from "@/features/teacher/marking-queue";

function sitting(
  id: string,
  studentId: string,
  manualReviewQuestions: {
    questionId: string;
    availableMarks: number;
    sessionItemId?: string | null;
  }[],
  origin: SittingForMarking["origin"] = "legacy",
): SittingForMarking {
  return {
    id,
    origin,
    studentId,
    submittedAt: "2026-07-01T00:00:00.000Z",
    manualReviewQuestions: manualReviewQuestions.map((question) => ({
      questionId: question.questionId,
      availableMarks: question.availableMarks,
      sessionItemId: question.sessionItemId ?? null,
    })),
  };
}

function mark(
  overrides: Partial<ManualMarkRow> & { sessionId: string; questionId: string },
): ManualMarkRow {
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
      [sitting("s1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [],
    );
    expect(result.items).toEqual([
      expect.objectContaining({ questionId: "q1", status: "pending", awardedMarks: null }),
    ]);
    expect(result.fullyMarked).toBe(false);
  });

  it("transitions to marked once a mark row exists for it", () => {
    const [result] = deriveMarkingQueue(
      [sitting("s1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [mark({ sessionId: "s1", questionId: "q1", awardedMarks: 4 })],
    );
    expect(result.items).toEqual([
      expect.objectContaining({ questionId: "q1", status: "marked", awardedMarks: 4 }),
    ]);
    expect(result.fullyMarked).toBe(true);
  });

  it("a sitting with several manual-review questions stays pending until every one is marked", () => {
    const [result] = deriveMarkingQueue(
      [
        sitting("s1", "student-1", [
          { questionId: "q1", availableMarks: 5 },
          { questionId: "q2", availableMarks: 3 },
        ]),
      ],
      [mark({ sessionId: "s1", questionId: "q1", awardedMarks: 5 })],
    );
    expect(result.fullyMarked).toBe(false);
    expect(result.items.find((item) => item.questionId === "q1")?.status).toBe("marked");
    expect(result.items.find((item) => item.questionId === "q2")?.status).toBe("pending");
  });

  it("a re-marked question keeps status marked and reflects the latest awarded value", () => {
    const [result] = deriveMarkingQueue(
      [sitting("s1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [mark({ sessionId: "s1", questionId: "q1", awardedMarks: 2, feedback: "Revised down" })],
    );
    expect(result.items[0]).toEqual(
      expect.objectContaining({ status: "marked", awardedMarks: 2, feedback: "Revised down" }),
    );
  });

  it("marks for a different sitting or question never bleed across", () => {
    const [result] = deriveMarkingQueue(
      [sitting("s1", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [
        mark({ sessionId: "s1", questionId: "q2", awardedMarks: 1 }),
        mark({ sessionId: "s2", questionId: "q1", awardedMarks: 1 }),
      ],
    );
    expect(result.items[0].status).toBe("pending");
  });

  it("a sitting with no manual-review questions never appears in the queue", () => {
    const results = deriveMarkingQueue([sitting("s1", "student-1", [])], []);
    expect(results[0].items).toEqual([]);
    expect(results[0].fullyMarked).toBe(true);
  });

  it("carries the served-item id a target sitting is marked by, and null for a legacy one", () => {
    /* The queue is one list of two models' work, and the write path each row
       needs is decided from `origin` rather than from which fields happen to be
       populated. Both facts have to survive the derivation for the marking route
       to be able to dispatch. */
    const [target] = deriveMarkingQueue(
      [
        sitting(
          "s1",
          "student-1",
          [{ questionId: "item-a", availableMarks: 5, sessionItemId: "si-1" }],
          "version_pinned",
        ),
      ],
      [],
    );
    expect(target.items[0]).toEqual(
      expect.objectContaining({ origin: "version_pinned", sessionItemId: "si-1" }),
    );

    const [legacy] = deriveMarkingQueue(
      [sitting("s2", "student-1", [{ questionId: "q1", availableMarks: 5 }])],
      [],
    );
    expect(legacy.items[0]).toEqual(
      expect.objectContaining({ origin: "legacy", sessionItemId: null }),
    );
  });
});
