import { describe, expect, it } from "vitest";

import {
  aggregateMastery,
  summarizeAttempt,
  type AttemptRow,
} from "@/features/student/attempt-summary";
import {
  buildChildSummary,
  type ChildProfile,
  type ParentAttemptRow,
} from "@/features/parent-dashboard/summary";
import { summariseStudent, type StudentAttempt } from "@/features/teacher/analytics";

function makeAttemptRow(overrides: Partial<AttemptRow> = {}): AttemptRow {
  return {
    id: "attempt-1",
    submitted_at: "2026-10-14T10:00:00.000Z",
    result: {
      totalQuestions: 10,
      objectiveMarksEarned: 5,
      objectiveMarksAvailable: 10,
      objectivePercentage: 50,
      attemptedQuestions: 10,
      pendingManualMarks: 0,
      breakdowns: {
        bySubject: {
          numeracy: { objectiveMarksEarned: 5, objectiveMarksAvailable: 10, total: 10 },
        },
      },
    },
    session: {
      mode: "standard",
      config: {
        yearLevel: 6,
        examStyle: "scholarship_style",
        subject: "numeracy",
        questionCount: 10,
        timing: "timed",
      },
    },
    ...overrides,
  };
}

describe("Confidence Mode Aggregation Isolation", () => {
  describe("Student attempt summary and mastery", () => {
    it("labels confidence mode attempts distinctly in title and records mode", () => {
      const standard = summarizeAttempt(makeAttemptRow());
      expect(standard.title).toBe("Scholarship-style Numeracy");
      expect(standard.mode).toBe("standard");

      const confidence = summarizeAttempt(
        makeAttemptRow({
          session: {
            mode: "confidence",
            config: {
              yearLevel: 6,
              examStyle: "scholarship_style",
              subject: "verbal_reasoning",
              confidenceMode: true,
            },
          },
        }),
      );
      expect(confidence.title).toBe("Scholarship-style Verbal Reasoning (Confidence Mode)");
      expect(confidence.mode).toBe("confidence");
    });

    it("proves a Confidence Mode attempt does NOT move aggregate mastery while a timed attempt does", () => {
      const timedInitial = makeAttemptRow({
        id: "timed-1",
        result: {
          objectiveMarksEarned: 5,
          objectiveMarksAvailable: 10,
          breakdowns: {
            bySubject: {
              numeracy: { objectiveMarksEarned: 5, objectiveMarksAvailable: 10 },
            },
          },
        },
      });

      // 1. Initial mastery after one timed attempt: 5/10 = 50%
      const initialMastery = aggregateMastery([timedInitial]);
      expect(initialMastery).toEqual([
        expect.objectContaining({
          subject: "numeracy",
          percent: 50,
          marksEarned: 5,
          marksAvailable: 10,
        }),
      ]);

      // 2. Add a 100% (10/10) Confidence Mode attempt:
      const confidenceAttempt = makeAttemptRow({
        id: "confidence-1",
        session: {
          mode: "confidence",
          config: {
            yearLevel: 6,
            examStyle: "scholarship_style",
            subject: "numeracy",
            confidenceMode: true,
          },
        },
        result: {
          objectiveMarksEarned: 10,
          objectiveMarksAvailable: 10,
          breakdowns: {
            bySubject: {
              numeracy: { objectiveMarksEarned: 10, objectiveMarksAvailable: 10 },
            },
          },
        },
      });

      const masteryWithConfidence = aggregateMastery([timedInitial, confidenceAttempt]);
      // Confidence mode is excluded: mastery stays exactly 50% (5/10 marks)!
      expect(masteryWithConfidence).toEqual([
        expect.objectContaining({
          subject: "numeracy",
          percent: 50,
          marksEarned: 5,
          marksAvailable: 10,
        }),
      ]);

      // 3. Conversely, if a standard timed 100% attempt is added, mastery moves to 75% (15/20 marks):
      const standardSecondAttempt = makeAttemptRow({
        id: "timed-2",
        session: {
          mode: "standard",
          config: {
            yearLevel: 6,
            examStyle: "scholarship_style",
            subject: "numeracy",
          },
        },
        result: {
          objectiveMarksEarned: 10,
          objectiveMarksAvailable: 10,
          breakdowns: {
            bySubject: {
              numeracy: { objectiveMarksEarned: 10, objectiveMarksAvailable: 10 },
            },
          },
        },
      });

      const masteryWithStandard = aggregateMastery([timedInitial, standardSecondAttempt]);
      expect(masteryWithStandard).toEqual([
        expect.objectContaining({
          subject: "numeracy",
          percent: 75,
          marksEarned: 15,
          marksAvailable: 20,
        }),
      ]);
    });
  });

  describe("Parent dashboard aggregates", () => {
    const child: ChildProfile = {
      id: "child-1",
      displayName: "Alex",
      yearLevel: 6,
      createdAt: "2026-01-01T00:00:00Z",
    };

    it("excludes confidence mode attempts from averagePercentage and subject mastery but includes them in history", () => {
      const timedAttempt: ParentAttemptRow = {
        id: "attempt-timed",
        submittedAt: "2026-10-14T09:00:00.000Z",
        mode: "standard",
        sessionConfig: {
          yearLevel: 6,
          examStyle: "scholarship_style",
          subject: "numeracy",
          timing: "timed",
        },
        result: {
          totalQuestions: 10,
          attemptedQuestions: 10,
          objectiveMarksEarned: 5,
          objectiveMarksAvailable: 10,
          objectivePercentage: 50,
          timeTakenSeconds: 600,
          manualReviewQuestions: 0,
          breakdowns: {
            bySubject: {
              numeracy: {
                total: 10,
                correct: 5,
                objectiveMarksEarned: 5,
                objectiveMarksAvailable: 10,
              },
            },
          },
        },
      };

      const confidenceAttempt: ParentAttemptRow = {
        id: "attempt-confidence",
        submittedAt: "2026-10-14T11:00:00.000Z",
        mode: "confidence",
        sessionConfig: {
          yearLevel: 6,
          examStyle: "scholarship_style",
          subject: "numeracy",
          timing: "untimed",
          confidenceMode: true,
        },
        result: {
          totalQuestions: 10,
          attemptedQuestions: 10,
          objectiveMarksEarned: 10,
          objectiveMarksAvailable: 10,
          objectivePercentage: 100,
          timeTakenSeconds: 300,
          manualReviewQuestions: 0,
          breakdowns: {
            bySubject: {
              numeracy: {
                total: 10,
                correct: 10,
                objectiveMarksEarned: 10,
                objectiveMarksAvailable: 10,
              },
            },
          },
        },
      };

      const summary = buildChildSummary(child, [confidenceAttempt, timedAttempt]);

      // Evaluated metrics reflect ONLY the unassisted timed attempt (50%, not (50+100)/2 = 75%)
      expect(summary.averagePercentage).toBe(50);
      expect(summary.latestPercentage).toBe(50);
      expect(summary.readinessScore).toBe(50);

      // Subject mastery reflects only the timed attempt
      const numeracy = summary.subjects.find((s) => s.subject === "numeracy");
      expect(numeracy?.percentage).toBe(50);
      expect(numeracy?.marksEarned).toBe(5);
      expect(numeracy?.marksAvailable).toBe(10);

      // Both attempts are visible in recentAttempts history, with confidence mode labelled distinctly
      expect(summary.recentAttempts).toHaveLength(2);
      expect(summary.recentAttempts[0].id).toBe("attempt-confidence");
      expect(summary.recentAttempts[0].label).toContain("(Confidence Mode)");
      expect(summary.recentAttempts[0].mode).toBe("confidence");

      expect(summary.recentAttempts[1].id).toBe("attempt-timed");
      expect(summary.recentAttempts[1].label).not.toContain("(Confidence Mode)");
      expect(summary.recentAttempts[1].mode).toBe("standard");
    });
  });

  describe("Teacher analytics aggregates", () => {
    it("excludes confidence mode attempts from teacher standing and average calculations", () => {
      const studentId = "student-1";
      const timedAttempt: StudentAttempt = {
        studentId,
        submittedAt: "2026-10-14T09:00:00.000Z",
        mode: "standard",
        result: {
          totalQuestions: 10,
          objectivePercentage: 40,
          attemptedQuestions: 10,
          timeTakenSeconds: 500,
          breakdowns: {
            bySubject: {
              numeracy: { objectiveMarksEarned: 4, objectiveMarksAvailable: 10 },
            },
          },
        },
      };

      const confidenceAttempt: StudentAttempt = {
        studentId,
        submittedAt: "2026-10-14T11:00:00.000Z",
        mode: "confidence",
        confidenceMode: true,
        result: {
          totalQuestions: 10,
          objectivePercentage: 100,
          attemptedQuestions: 10,
          timeTakenSeconds: 200,
          breakdowns: {
            bySubject: {
              numeracy: { objectiveMarksEarned: 10, objectiveMarksAvailable: 10 },
            },
          },
        },
      };

      const summary = summariseStudent(studentId, [timedAttempt, confidenceAttempt]);
      // Average percentage is strictly 40% from the unassisted timed sitting
      expect(summary.averagePercentage).toBe(40);
      expect(summary.attemptCount).toBe(2);
    });
  });
});
