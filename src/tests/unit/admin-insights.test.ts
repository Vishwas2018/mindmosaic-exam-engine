import { describe, expect, it } from "vitest";

import {
  deriveContentInsights,
  derivePerformanceInsights,
} from "@/features/admin-analytics";
import type {
  DimensionPerformance,
  QuestionIntelligenceRow,
} from "@/features/admin-analytics";

function makeRow(
  overrides: Partial<QuestionIntelligenceRow>,
): QuestionIntelligenceRow {
  return {
    questionId: "q-test-001",
    attempts: 100,
    correct: 70,
    incorrect: 25,
    unanswered: 5,
    pendingManual: 0,
    avgOverallWhenCorrect: 75,
    avgOverallWhenMissed: 50,
    accuracyPct: 70,
    discrimination: 0.25,
    health: "healthy",
    promptExcerpt: "What is 3 + 4?",
    subject: "numeracy",
    strand: "Number",
    topic: "Addition",
    skill: "Mental addition",
    difficulty: "easy",
    yearLevel: 3,
    examStyle: "naplan",
    ...overrides,
  };
}

function makeDimension(
  overrides: Partial<DimensionPerformance>,
): DimensionPerformance {
  return {
    name: "numeracy",
    attempts: 50,
    questionsTotal: 500,
    questionsAttempted: 480,
    questionsCorrect: 300,
    questionsIncorrect: 150,
    questionsUnanswered: 50,
    marksEarned: 300,
    marksAvailable: 500,
    ...overrides,
  };
}

/* Five healthy rows in one strand so coverage is not flagged as thin. */
function healthyStrand(strand: string): QuestionIntelligenceRow[] {
  return Array.from({ length: 5 }, (_, index) =>
    makeRow({ questionId: `q-${strand}-${index}`, strand }),
  );
}

describe("deriveContentInsights", () => {
  it("reports all-clear when every item is healthy and covered", () => {
    const insights = deriveContentInsights(healthyStrand("Number"), []);
    expect(insights).toHaveLength(1);
    expect(insights[0].tone).toBe("good");
  });

  it("flags too-easy and too-hard items with their ids", () => {
    const rows = [
      ...healthyStrand("Number"),
      ...healthyStrand("Algebra").map((row, index) =>
        index === 0
          ? { ...row, questionId: "q-easy", health: "too_easy" as const }
          : index === 1
            ? { ...row, questionId: "q-hard", health: "too_hard" as const }
            : row,
      ),
    ];
    const insights = deriveContentInsights(rows, []);
    const titles = insights.map((insight) => insight.title).join(" | ");
    expect(titles).toContain("too easy");
    expect(titles).toContain("too hard");
    expect(insights.find((i) => i.title.includes("too easy"))?.body).toContain(
      "q-easy",
    );
  });

  it("flags strands with thin live coverage", () => {
    const rows = [
      ...healthyStrand("Number"),
      makeRow({ questionId: "q-frac-1", strand: "Fractions" }),
    ];
    const insights = deriveContentInsights(rows, []);
    expect(
      insights.some((insight) => insight.title === "Fractions has thin live coverage"),
    ).toBe(true);
  });

  it("mentions never-delivered bank questions without treating them as a problem", () => {
    const unattempted = [
      {
        questionId: "q-new-1",
        promptExcerpt: "New question",
        subject: "numeracy",
        strand: "Number",
        topic: "Addition",
        skill: null,
        difficulty: "easy",
        yearLevel: 3,
        examStyle: "naplan",
      },
    ];
    const insights = deriveContentInsights(healthyStrand("Number"), unattempted);
    const mention = insights.find((insight) =>
      insight.title.includes("not yet delivered"),
    );
    expect(mention?.tone).toBe("good");
  });
});

describe("derivePerformanceInsights", () => {
  it("calls out weak and strong subjects by mastery", () => {
    const insights = derivePerformanceInsights([
      makeDimension({ name: "numeracy", marksEarned: 250, marksAvailable: 500 }),
      makeDimension({ name: "reading", marksEarned: 400, marksAvailable: 500 }),
    ]);
    expect(insights.some((i) => i.tone === "bad" && i.title.includes("numeracy"))).toBe(
      true,
    );
    expect(insights.some((i) => i.tone === "good" && i.title.includes("reading"))).toBe(
      true,
    );
  });

  it("reports even performance when nothing crosses a threshold", () => {
    const insights = derivePerformanceInsights([
      makeDimension({ name: "numeracy", marksEarned: 325, marksAvailable: 500 }),
    ]);
    expect(insights).toHaveLength(1);
    expect(insights[0].tone).toBe("good");
  });

  it("skips subjects with no objective marks instead of dividing by zero", () => {
    const insights = derivePerformanceInsights([
      makeDimension({ name: "writing", marksEarned: 0, marksAvailable: 0 }),
    ]);
    expect(insights).toHaveLength(1);
    expect(insights[0].title).toBe("Performance is even across subjects");
  });
});
