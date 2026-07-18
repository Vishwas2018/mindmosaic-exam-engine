import { describe, expect, it } from "vitest";

import {
  assignmentCompletionPercentage,
  standingFor,
  summariseClass,
  summariseStudent,
  type StudentAttempt,
} from "@/features/teacher/analytics";

function attempt(
  studentId: string,
  submittedAt: string,
  overrides: {
    percentage?: number;
    bySubject?: Record<string, { earned: number; available: number }>;
    attempted?: number;
    timeTaken?: number;
  } = {},
): StudentAttempt {
  const bySubject = Object.fromEntries(
    Object.entries(overrides.bySubject ?? { numeracy: { earned: 7, available: 10 } }).map(
      ([subject, row]) => [
        subject,
        {
          objectiveMarksEarned: row.earned,
          objectiveMarksAvailable: row.available,
        },
      ],
    ),
  );
  return {
    studentId,
    submittedAt,
    result: {
      totalQuestions: 10,
      attemptedQuestions: overrides.attempted ?? 9,
      objectivePercentage: overrides.percentage ?? 70,
      timeTakenSeconds: overrides.timeTaken ?? 600,
      breakdowns: { bySubject },
    },
  };
}

describe("standingFor", () => {
  it("marks students with no attempts as at risk", () => {
    expect(standingFor(null, 0)).toBe("at_risk");
    expect(standingFor(90, 0)).toBe("at_risk");
  });

  it("bands by average percentage", () => {
    expect(standingFor(65, 3)).toBe("on_track");
    expect(standingFor(64, 3)).toBe("needs_attention");
    expect(standingFor(50, 3)).toBe("needs_attention");
    expect(standingFor(49, 3)).toBe("at_risk");
  });
});

describe("summariseStudent", () => {
  it("returns an empty summary for a student with no attempts", () => {
    const summary = summariseStudent("s1", []);
    expect(summary.attemptCount).toBe(0);
    expect(summary.lastActiveAt).toBeNull();
    expect(summary.averagePercentage).toBeNull();
    expect(summary.strongestSubject).toBeNull();
    expect(summary.standing).toBe("at_risk");
  });

  it("only counts the named student's attempts", () => {
    const attempts = [
      attempt("s1", "2026-07-10T10:00:00Z", { percentage: 80 }),
      attempt("s2", "2026-07-11T10:00:00Z", { percentage: 20 }),
    ];
    const summary = summariseStudent("s1", attempts);
    expect(summary.attemptCount).toBe(1);
    expect(summary.averagePercentage).toBe(80);
  });

  it("averages percentages and picks latest activity", () => {
    const attempts = [
      attempt("s1", "2026-07-01T10:00:00Z", { percentage: 60 }),
      attempt("s1", "2026-07-12T10:00:00Z", { percentage: 81 }),
    ];
    const summary = summariseStudent("s1", attempts);
    expect(summary.averagePercentage).toBe(71); // round(70.5)
    expect(summary.lastActiveAt).toBe("2026-07-12T10:00:00Z");
  });

  it("derives strongest and weakest subject from aggregated marks", () => {
    const attempts = [
      attempt("s1", "2026-07-01T10:00:00Z", {
        bySubject: {
          numeracy: { earned: 9, available: 10 },
          reading: { earned: 3, available: 10 },
          language: { earned: 6, available: 10 },
        },
      }),
    ];
    const summary = summariseStudent("s1", attempts);
    expect(summary.strongestSubject).toBe("numeracy");
    expect(summary.weakestSubject).toBe("reading");
  });

  it("has no weakest subject when only one subject was attempted", () => {
    const summary = summariseStudent("s1", [
      attempt("s1", "2026-07-01T10:00:00Z", {
        bySubject: { numeracy: { earned: 5, available: 10 } },
      }),
    ]);
    expect(summary.strongestSubject).toBe("numeracy");
    expect(summary.weakestSubject).toBeNull();
  });

  it("skips malformed result rows instead of crashing", () => {
    const attempts: StudentAttempt[] = [
      { studentId: "s1", submittedAt: "2026-07-01T10:00:00Z", result: { junk: true } },
      attempt("s1", "2026-07-02T10:00:00Z", { percentage: 55 }),
    ];
    const summary = summariseStudent("s1", attempts);
    expect(summary.attemptCount).toBe(2);
    expect(summary.averagePercentage).toBe(55);
  });
});

describe("summariseClass", () => {
  const now = Date.parse("2026-07-18T00:00:00Z");

  it("counts weekly activity against the injected clock", () => {
    const attempts = [
      attempt("s1", "2026-07-16T10:00:00Z"),
      attempt("s2", "2026-06-01T10:00:00Z"),
    ];
    const overview = summariseClass(["s1", "s2", "s3"], attempts, now);
    expect(overview.studentCount).toBe(3);
    expect(overview.activeThisWeekCount).toBe(1);
  });

  it("averages only students who have scores and counts at-risk", () => {
    const attempts = [
      attempt("s1", "2026-07-16T10:00:00Z", { percentage: 90 }),
      attempt("s2", "2026-07-16T10:00:00Z", { percentage: 30 }),
    ];
    const overview = summariseClass(["s1", "s2", "s3"], attempts, now);
    expect(overview.averagePercentage).toBe(60);
    expect(overview.atRiskCount).toBe(2); // s2 low score, s3 no attempts
  });

  it("aggregates subject mastery across the whole class", () => {
    const attempts = [
      attempt("s1", "2026-07-16T10:00:00Z", {
        bySubject: { numeracy: { earned: 8, available: 10 } },
      }),
      attempt("s2", "2026-07-16T10:00:00Z", {
        bySubject: { numeracy: { earned: 2, available: 10 } },
      }),
    ];
    const overview = summariseClass(["s1", "s2"], attempts, now);
    expect(overview.subjectMastery).toEqual([{ subject: "numeracy", percentage: 50 }]);
  });

  it("returns null average for an empty class", () => {
    const overview = summariseClass([], [], now);
    expect(overview.averagePercentage).toBeNull();
    expect(overview.subjectMastery).toEqual([]);
  });
});

describe("assignmentCompletionPercentage", () => {
  it("is 0 for no rows", () => {
    expect(assignmentCompletionPercentage([])).toBe(0);
  });

  it("counts only submitted rows", () => {
    expect(
      assignmentCompletionPercentage(["submitted", "in_progress", "assigned", "submitted"]),
    ).toBe(50);
  });
});
