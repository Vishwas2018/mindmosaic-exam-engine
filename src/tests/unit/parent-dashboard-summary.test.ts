import { describe, expect, it } from "vitest";

import {
  buildChildSummary,
  performanceBand,
  type ChildProfile,
  type ParentAttemptRow,
} from "@/features/parent-dashboard/summary";

const CHILD: ChildProfile = {
  id: "child-1",
  displayName: "Arjun",
  yearLevel: 5,
};

/** Fixed "now": Friday 2026-07-17 12:00 local time. */
const NOW = new Date(2026, 6, 17, 12, 0, 0);

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - days, hour);
  return d.toISOString();
}

function makeResult(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    totalQuestions: 10,
    attemptedQuestions: 10,
    manualReviewQuestions: 0,
    objectivePercentage: 80,
    objectiveMarksEarned: 8,
    objectiveMarksAvailable: 10,
    timeTakenSeconds: 600,
    breakdowns: {
      bySubject: {
        numeracy: {
          total: 10,
          correct: 8,
          objectiveMarksEarned: 8,
          objectiveMarksAvailable: 10,
        },
      },
    },
    ...overrides,
  };
}

const VALID_CONFIG = {
  yearLevel: 5,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
};

function makeAttempt(
  id: string,
  submittedAt: string,
  result: unknown = makeResult(),
  sessionConfig: unknown = VALID_CONFIG,
): ParentAttemptRow {
  return { id, submittedAt, result, sessionConfig };
}

describe("buildChildSummary", () => {
  it("returns an empty summary for a child with no attempts", () => {
    const summary = buildChildSummary(CHILD, [], NOW);
    expect(summary.attemptCount).toBe(0);
    expect(summary.latestPercentage).toBeNull();
    expect(summary.previousPercentage).toBeNull();
    expect(summary.averagePercentage).toBeNull();
    expect(summary.streakDays).toBe(0);
    expect(summary.subjects).toEqual([]);
    expect(summary.recentAttempts).toEqual([]);
    expect(summary.weekActivity).toHaveLength(7);
    expect(summary.weekActivity.every((day) => !day.practised)).toBe(true);
  });

  it("uses the newest attempt for latest score regardless of input order", () => {
    const summary = buildChildSummary(
      CHILD,
      [
        makeAttempt("older", isoDaysAgo(3), makeResult({ objectivePercentage: 60 })),
        makeAttempt("newest", isoDaysAgo(0), makeResult({ objectivePercentage: 90 })),
        makeAttempt("middle", isoDaysAgo(1), makeResult({ objectivePercentage: 70 })),
      ],
      NOW,
    );
    expect(summary.latestPercentage).toBe(90);
    expect(summary.previousPercentage).toBe(70);
    expect(summary.averagePercentage).toBe(Math.round((90 + 70 + 60) / 3));
    expect(summary.recentAttempts.map((attempt) => attempt.id)).toEqual([
      "newest",
      "middle",
      "older",
    ]);
  });

  it("excludes attempts with unreadable results and counts them", () => {
    const summary = buildChildSummary(
      CHILD,
      [
        makeAttempt("good", isoDaysAgo(0), makeResult({ objectivePercentage: 75 })),
        makeAttempt("corrupt", isoDaysAgo(1), { nonsense: true }),
        makeAttempt("bad-date", "not-a-date"),
      ],
      NOW,
    );
    expect(summary.attemptCount).toBe(1);
    expect(summary.unreadableAttemptCount).toBe(2);
    expect(summary.latestPercentage).toBe(75);
  });

  it("caps recent attempts at five, newest first", () => {
    const attempts = Array.from({ length: 8 }, (_, index) =>
      makeAttempt(`attempt-${index}`, isoDaysAgo(index)),
    );
    const summary = buildChildSummary(CHILD, attempts, NOW);
    expect(summary.attemptCount).toBe(8);
    expect(summary.recentAttempts).toHaveLength(5);
    expect(summary.recentAttempts[0].id).toBe("attempt-0");
    expect(summary.recentAttempts[4].id).toBe("attempt-4");
  });

  it("describes an attempt from its session config and falls back when missing", () => {
    const summary = buildChildSummary(
      CHILD,
      [
        makeAttempt("with-config", isoDaysAgo(0)),
        makeAttempt("without-config", isoDaysAgo(1), makeResult(), null),
      ],
      NOW,
    );
    expect(summary.recentAttempts[0].label).toContain("Grade 5");
    expect(summary.recentAttempts[0].label).toContain("NAPLAN");
    expect(summary.recentAttempts[1].label).toBe("Practice exam");
  });

  it("aggregates subject marks across attempts", () => {
    const summary = buildChildSummary(
      CHILD,
      [
        makeAttempt(
          "a",
          isoDaysAgo(0),
          makeResult({
            breakdowns: {
              bySubject: {
                numeracy: {
                  total: 10,
                  correct: 9,
                  objectiveMarksEarned: 9,
                  objectiveMarksAvailable: 10,
                },
              },
            },
          }),
        ),
        makeAttempt(
          "b",
          isoDaysAgo(1),
          makeResult({
            breakdowns: {
              bySubject: {
                numeracy: {
                  total: 10,
                  correct: 5,
                  objectiveMarksEarned: 5,
                  objectiveMarksAvailable: 10,
                },
                reading: {
                  total: 5,
                  correct: 4,
                  objectiveMarksEarned: 4,
                  objectiveMarksAvailable: 5,
                },
              },
            },
          }),
        ),
      ],
      NOW,
    );
    const numeracy = summary.subjects.find((subject) => subject.subject === "numeracy");
    expect(numeracy).toMatchObject({
      label: "Numeracy",
      marksEarned: 14,
      marksAvailable: 20,
      percentage: 70,
      questionCount: 20,
    });
    const reading = summary.subjects.find((subject) => subject.subject === "reading");
    expect(reading?.percentage).toBe(80);
    // Strongest first.
    expect(summary.subjects[0].subject).toBe("reading");
  });

  it("gives writing-style subjects with no objective marks a null percentage, sorted last", () => {
    const summary = buildChildSummary(
      CHILD,
      [
        makeAttempt(
          "a",
          isoDaysAgo(0),
          makeResult({
            breakdowns: {
              bySubject: {
                writing: {
                  total: 1,
                  correct: 0,
                  objectiveMarksEarned: 0,
                  objectiveMarksAvailable: 0,
                },
                numeracy: {
                  total: 5,
                  correct: 3,
                  objectiveMarksEarned: 3,
                  objectiveMarksAvailable: 5,
                },
              },
            },
          }),
        ),
      ],
      NOW,
    );
    const writing = summary.subjects.find((subject) => subject.subject === "writing");
    expect(writing?.percentage).toBeNull();
    expect(summary.subjects[summary.subjects.length - 1].subject).toBe("writing");
  });

  it("computes week activity, weekly totals and streaks from local calendar days", () => {
    const summary = buildChildSummary(
      CHILD,
      [
        makeAttempt("today", isoDaysAgo(0), makeResult({ timeTakenSeconds: 300 })),
        makeAttempt("yesterday", isoDaysAgo(1), makeResult({ timeTakenSeconds: 600 })),
        makeAttempt("two-days", isoDaysAgo(2), makeResult({ timeTakenSeconds: 900 })),
        // Gap at 3 days ago breaks the streak.
        makeAttempt("outside-week", isoDaysAgo(10)),
      ],
      NOW,
    );
    expect(summary.attemptsThisWeek).toBe(3);
    expect(summary.timeThisWeekSeconds).toBe(1800);
    expect(summary.streakDays).toBe(3);
    expect(summary.weekActivity[6]).toMatchObject({ practised: true, isToday: true });
    expect(summary.weekActivity[3]).toMatchObject({ practised: false });
  });

  it("keeps the streak alive when today has no attempt yet", () => {
    const summary = buildChildSummary(
      CHILD,
      [makeAttempt("yesterday", isoDaysAgo(1)), makeAttempt("two-days", isoDaysAgo(2))],
      NOW,
    );
    expect(summary.streakDays).toBe(2);
  });

  it("falls back to a friendly display name", () => {
    const summary = buildChildSummary(
      { id: "child-2", displayName: "  ", yearLevel: null },
      [],
      NOW,
    );
    expect(summary.displayName).toBe("Your child");
  });
});

describe("performanceBand", () => {
  it("maps percentages to bands", () => {
    expect(performanceBand(92)).toBe("strong");
    expect(performanceBand(80)).toBe("strong");
    expect(performanceBand(79)).toBe("good");
    expect(performanceBand(65)).toBe("good");
    expect(performanceBand(64)).toBe("building");
    expect(performanceBand(50)).toBe("building");
    expect(performanceBand(49)).toBe("focus");
    expect(performanceBand(0)).toBe("focus");
  });
});
