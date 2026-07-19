import { describe, expect, it } from "vitest";

import {
  LOW_DISCRIMINATION,
  MIN_ATTEMPTS_FOR_SIGNAL,
  accuracyPct,
  classifyQuestionHealth,
  discriminationIndex,
  masteryPct,
  scoreBandLabel,
} from "@/features/admin-analytics";

describe("accuracyPct", () => {
  it("is the whole-number percent of deliveries answered correctly", () => {
    expect(accuracyPct({ attempts: 40, correct: 30 })).toBe(75);
  });

  it("rounds to the nearest whole percent", () => {
    expect(accuracyPct({ attempts: 3, correct: 2 })).toBe(67);
  });

  it("is null with zero attempts rather than dividing by zero", () => {
    expect(accuracyPct({ attempts: 0, correct: 0 })).toBeNull();
  });
});

describe("discriminationIndex", () => {
  it("scales the correct-vs-missed overall score gap to 0..1", () => {
    expect(discriminationIndex(80, 50)).toBe(0.3);
  });

  it("clamps a negative gap to 0", () => {
    expect(discriminationIndex(50, 80)).toBe(0);
  });

  it("is null when either side has no attempts yet", () => {
    expect(discriminationIndex(null, 50)).toBeNull();
    expect(discriminationIndex(80, null)).toBeNull();
  });
});

describe("classifyQuestionHealth", () => {
  const enough = MIN_ATTEMPTS_FOR_SIGNAL;

  it("needs a minimum number of attempts before judging", () => {
    expect(
      classifyQuestionHealth({ attempts: enough - 1, accuracy: 95, discrimination: 0.4 }),
    ).toBe("insufficient_data");
  });

  it("flags very high accuracy as too easy", () => {
    expect(
      classifyQuestionHealth({ attempts: enough, accuracy: 92, discrimination: 0.4 }),
    ).toBe("too_easy");
  });

  it("flags very low accuracy as too hard", () => {
    expect(
      classifyQuestionHealth({ attempts: enough, accuracy: 30, discrimination: 0.4 }),
    ).toBe("too_hard");
  });

  it("flags weak separation as low discrimination", () => {
    expect(
      classifyQuestionHealth({
        attempts: enough,
        accuracy: 70,
        discrimination: LOW_DISCRIMINATION - 0.01,
      }),
    ).toBe("low_discrimination");
  });

  it("accepts a mid-range item with unknown discrimination as healthy", () => {
    expect(
      classifyQuestionHealth({ attempts: enough, accuracy: 70, discrimination: null }),
    ).toBe("healthy");
  });
});

describe("masteryPct", () => {
  it("is earned over available marks as a whole-number percent", () => {
    expect(masteryPct({ marksEarned: 45, marksAvailable: 60 })).toBe(75);
  });

  it("is null when no objective marks were available", () => {
    expect(masteryPct({ marksEarned: 0, marksAvailable: 0 })).toBeNull();
  });
});

describe("scoreBandLabel", () => {
  it("labels ordinary bands as start–start+15", () => {
    expect(scoreBandLabel(45)).toBe("45–60");
  });

  it("labels the top band as 90–100", () => {
    expect(scoreBandLabel(90)).toBe("90–100");
  });
});
