import { describe, expect, it } from "vitest";

import {
  aggregateMastery,
  buildOverview,
  formatSubmittedAt,
  subjectLabel,
  summarizeAttempt,
  type AttemptRow,
} from "@/features/student/attempt-summary";

function row(overrides: Partial<AttemptRow> = {}): AttemptRow {
  return {
    id: "attempt-1",
    submitted_at: "2026-07-18T09:14:00.000Z",
    result: {
      totalQuestions: 20,
      objectiveMarksEarned: 16,
      objectiveMarksAvailable: 20,
      objectivePercentage: 80,
      pendingManualMarks: 0,
      breakdowns: {
        bySubject: {
          numeracy: { objectiveMarksEarned: 10, objectiveMarksAvailable: 12 },
          reading: { objectiveMarksEarned: 6, objectiveMarksAvailable: 8 },
        },
      },
    },
    session: {
      config: {
        yearLevel: 5,
        examStyle: "naplan_style",
        subject: "numeracy",
        questionCount: 20,
        timing: "timed",
      },
    },
    ...overrides,
  };
}

describe("summarizeAttempt", () => {
  it("builds the display title from the session's style and subject", () => {
    const summary = summarizeAttempt(row());
    expect(summary.title).toBe("NAPLAN-style Numeracy");
    expect(summary.timing).toBe("timed");
    expect(summary.totalQuestions).toBe(20);
    expect(summary.scorePercent).toBe(80);
    expect(summary.pendingManualReview).toBe(false);
  });

  it("reports no score when nothing was auto-marked", () => {
    const summary = summarizeAttempt(
      row({
        result: {
          totalQuestions: 1,
          objectiveMarksAvailable: 0,
          objectivePercentage: 0,
          pendingManualMarks: 1,
        },
      }),
    );
    expect(summary.scorePercent).toBeNull();
    expect(summary.pendingManualReview).toBe(true);
  });

  it("survives malformed jsonb without throwing", () => {
    const summary = summarizeAttempt(
      row({ result: "corrupt", session: { config: 42 } }),
    );
    expect(summary.scorePercent).toBeNull();
    expect(summary.totalQuestions).toBeNull();
    expect(summary.timing).toBeNull();
    expect(summary.title).toBe("Practice session");
  });

  it("handles a missing session join", () => {
    const summary = summarizeAttempt(row({ session: null }));
    expect(summary.timing).toBeNull();
    expect(summary.subjectLabel).toBe("Practice session");
  });
});

describe("aggregateMastery", () => {
  it("weights subjects by marks across attempts and sorts strongest first", () => {
    const rows = [
      row(),
      row({
        id: "attempt-2",
        result: {
          breakdowns: {
            bySubject: {
              numeracy: { objectiveMarksEarned: 2, objectiveMarksAvailable: 8 },
              language_conventions: {
                objectiveMarksEarned: 9,
                objectiveMarksAvailable: 10,
              },
            },
          },
        },
      }),
    ];

    const mastery = aggregateMastery(rows);
    expect(mastery.map((entry) => entry.subject)).toEqual([
      "language_conventions",
      "reading",
      "numeracy",
    ]);
    // numeracy: (10 + 2) / (12 + 8) = 60%
    expect(mastery.find((entry) => entry.subject === "numeracy")?.percent).toBe(60);
    expect(
      mastery.find((entry) => entry.subject === "language_conventions")?.label,
    ).toBe("Language conventions");
  });

  it("skips subjects with no objective marks and malformed breakdowns", () => {
    const mastery = aggregateMastery([
      row({
        result: {
          breakdowns: {
            bySubject: {
              writing: { objectiveMarksEarned: 0, objectiveMarksAvailable: 0 },
              numeracy: "broken",
            },
          },
        },
      }),
      row({ id: "attempt-3", result: null }),
    ]);
    expect(mastery).toEqual([]);
  });
});

describe("buildOverview", () => {
  it("recommends the weakest subject as focus", () => {
    const overview = buildOverview([row()]);
    // numeracy 10/12 ≈ 83%, reading 6/8 = 75% → reading is weakest.
    expect(overview.recommendedFocus?.subject).toBe("reading");
    expect(overview.attempts).toHaveLength(1);
  });

  it("has no focus without scored attempts", () => {
    const overview = buildOverview([]);
    expect(overview.recommendedFocus).toBeNull();
    expect(overview.attempts).toEqual([]);
    expect(overview.mastery).toEqual([]);
  });
});

describe("formatSubmittedAt", () => {
  const now = new Date(2026, 6, 18, 12, 0, 0);

  it("labels same-day and previous-day attempts", () => {
    expect(formatSubmittedAt(new Date(2026, 6, 18, 9, 14).toISOString(), now)).toBe(
      "Today",
    );
    expect(formatSubmittedAt(new Date(2026, 6, 17, 23, 59).toISOString(), now)).toBe(
      "Yesterday",
    );
  });

  it("falls back to an absolute date and tolerates junk", () => {
    expect(formatSubmittedAt(new Date(2026, 3, 7).toISOString(), now)).toBe(
      "7 Apr 2026",
    );
    expect(formatSubmittedAt("not-a-date", now)).toBe("");
  });
});

describe("subjectLabel", () => {
  it("maps known bank subjects and prettifies unknown ones", () => {
    expect(subjectLabel("language_conventions")).toBe("Language conventions");
    expect(subjectLabel("future_subject")).toBe("Future subject");
  });
});
