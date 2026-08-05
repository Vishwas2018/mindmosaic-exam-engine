import { describe, expect, it } from "vitest";

import { summarizeAttempt, type AttemptRow } from "@/features/student/attempt-summary";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { toAttemptSummary } from "@/features/student/engagement/attempts";

/**
 * Defect 2, reproduced from production rows.
 *
 * /student showed "5 sessions finished · Average score 0% · Best score 0%"
 * for the Grade 5 student (profile 2668f328-...). The reported symptom was
 * "the aggregates are broken". They were not: querying exam_attempts for
 * that child on 5 August 2026 returned five rows, every one of them
 * genuinely scored zero —
 *
 *   4 rows: attemptedQuestions 0,  unansweredCount 10, objectivePercentage 0
 *   1 row:  attemptedQuestions 1,  incorrectCount 1,   objectivePercentage 0
 *
 *   every row: objectiveMarksAvailable 10, objectiveMarksEarned 0,
 *              submissionReason "user_submitted"
 *
 * So five 10-question papers were opened and submitted with almost nothing
 * answered. The arithmetic was right; describing it as a score was not.
 * A blank sitting and a genuine zero are the same number and not the same
 * thing, and the dashboard was reporting one as the other.
 *
 * These cases pin the distinction rather than the number.
 */

/** The exact result shape of the four blank rows. */
function blankResult() {
  return {
    totalQuestions: 10,
    attemptedQuestions: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 10,
    objectiveMarksEarned: 0,
    objectiveMarksAvailable: 10,
    objectivePercentage: 0,
    submissionReason: "user_submitted",
  };
}

/** The fifth row: one question answered, wrongly. A real 0%. */
function oneWrongResult() {
  return { ...blankResult(), attemptedQuestions: 1, incorrectCount: 1, unansweredCount: 9 };
}

function row(id: string, day: number, result: unknown): AttemptRow {
  return {
    id,
    submitted_at: new Date(Date.UTC(2026, 7, day, 12, 0, 0)).toISOString(),
    result,
    session: { config: { subject: "numeracy", examStyle: "naplan_style", timing: "timed" } },
  };
}

/** The live shape: four blank sittings and one answered-but-wrong. */
const LIVE_ROWS: AttemptRow[] = [
  row("a", 1, blankResult()),
  row("b", 2, blankResult()),
  row("c", 3, oneWrongResult()),
  row("d", 3, blankResult()),
  row("e", 3, blankResult()),
];

const engagementFrom = (rows: AttemptRow[]) =>
  buildEngagementSummary(
    rows.map((r) => toAttemptSummary({ submitted_at: r.submitted_at, result: r.result })),
    new Date(Date.UTC(2026, 7, 5, 9, 0, 0)),
  );

describe("summarizeAttempt — telling a blank sitting from a genuine zero", () => {
  it("reports zero attempted questions for a paper submitted blank", () => {
    const summary = summarizeAttempt(row("a", 1, blankResult()));
    expect(summary.attemptedQuestions).toBe(0);
    /* Still a real, correctly-scored 0% — the score is not being hidden. */
    expect(summary.scorePercent).toBe(0);
  });

  it("reports the answered count for a paper that was actually attempted", () => {
    const summary = summarizeAttempt(row("c", 3, oneWrongResult()));
    expect(summary.attemptedQuestions).toBe(1);
    expect(summary.scorePercent).toBe(0);
  });

  it("defaults to zero when the result carries no attempt count", () => {
    const summary = summarizeAttempt(row("x", 1, { objectivePercentage: 0 }));
    expect(summary.attemptedQuestions).toBe(0);
  });
});

describe("buildEngagementSummary — the live five-session shape", () => {
  const summary = engagementFrom(LIVE_ROWS);

  it("still counts every sitting as finished", () => {
    /* The student did turn up five times. That is not in dispute and must
       not be quietly deleted to make the average look better. */
    expect(summary.totalSessions).toBe(5);
  });

  it("counts the four blank sittings separately", () => {
    expect(summary.blankSessions).toBe(4);
    expect(summary.scoredSessions).toBe(1);
  });

  it("averages only the sitting that was actually attempted", () => {
    /* Not null — one paper WAS attempted, and scored a real 0%. The fix is
       not "hide zeros", it is "do not average papers nobody answered". */
    expect(summary.averagePercentage).toBe(0);
    expect(summary.bestPercentage).toBe(0);
  });

  it("reports no average at all when every sitting is blank", () => {
    const allBlank = engagementFrom(LIVE_ROWS.filter((r) => r.id !== "c"));
    expect(allBlank.totalSessions).toBe(4);
    expect(allBlank.blankSessions).toBe(4);
    expect(allBlank.scoredSessions).toBe(0);
    /* null renders as "—", not "0%" — the difference between "no answers
       yet" and "answered everything wrong". */
    expect(allBlank.averagePercentage).toBeNull();
    expect(allBlank.bestPercentage).toBeNull();
  });

  /*
   * Blank sittings must still feed streaks and milestones: the student did
   * turn up. `currentStreak` is 0 here only because the last sitting was
   * 3 August and "now" is the 5th — ordinary streak decay, nothing to do
   * with the sittings being blank. `bestStreak` shows the three
   * consecutive days were counted.
   */
  it("keeps streaks intact — showing up still counts", () => {
    expect(summary.bestStreak).toBe(3);
    expect(summary.achievements.find((a) => a.id === "first-session")?.earned).toBe(true);
  });
});

describe("buildEngagementSummary — normal history is unaffected", () => {
  it("averages answered sittings exactly as before", () => {
    const answered = [
      row("p", 1, { ...blankResult(), attemptedQuestions: 10, objectivePercentage: 80 }),
      row("q", 2, { ...blankResult(), attemptedQuestions: 10, objectivePercentage: 60 }),
    ];
    const summary = engagementFrom(answered);
    expect(summary.blankSessions).toBe(0);
    expect(summary.averagePercentage).toBe(70);
    expect(summary.bestPercentage).toBe(80);
  });

  /*
   * Rows written before `attemptedQuestions` existed cannot be classified.
   * They must keep counting exactly as they did — treating an unknown as
   * blank would silently wipe the averages of every historical attempt.
   */
  it("treats a result with no attempt count as sat, not as blank", () => {
    const legacy = [
      row("old", 1, { objectivePercentage: 90 }),
      row("older", 2, { objectivePercentage: 70 }),
    ];
    const summary = engagementFrom(legacy);
    expect(summary.blankSessions).toBe(0);
    expect(summary.scoredSessions).toBe(2);
    expect(summary.averagePercentage).toBe(80);
  });
});
