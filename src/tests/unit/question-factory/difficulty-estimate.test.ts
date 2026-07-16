import { describe, expect, it } from "vitest";

import { FACTORY_THRESHOLDS } from "@/features/question-factory/config";
import {
  computeDifficultyDeviation,
  estimateDifficulty,
  type DifficultyEstimateInput,
} from "@/features/question-factory/difficulty/estimate-difficulty";

function words(count: number): string {
  return Array.from({ length: count }, (_, index) => `word${index}`).join(" ");
}

describe("estimateDifficulty — reading-load signal", () => {
  it("scores 0 at or below the low anchor (20 words)", () => {
    const estimate = estimateDifficulty({ prompt: words(20), optionTexts: [] });
    expect(estimate.signals.readingLoadScore).toBe(0);
  });

  it("scores 1 at or above the high anchor (60 words)", () => {
    const estimate = estimateDifficulty({ prompt: words(60), optionTexts: [] });
    expect(estimate.signals.readingLoadScore).toBe(1);
  });

  it("scores 0.5 at the midpoint (40 words)", () => {
    const estimate = estimateDifficulty({ prompt: words(40), optionTexts: [] });
    expect(estimate.signals.readingLoadScore).toBeCloseTo(0.5, 10);
  });
});

describe("estimateDifficulty — vocabulary-complexity signal", () => {
  it("scores low for short, simple words", () => {
    const estimate = estimateDifficulty({ prompt: "a an it is on at to", optionTexts: [] });
    expect(estimate.signals.vocabularyComplexityScore).toBeLessThan(0.2);
  });

  it("scores high for long, complex words", () => {
    const estimate = estimateDifficulty({
      prompt: "extraordinarily incomprehensible multidimensional interdisciplinary characterisations",
      optionTexts: [],
    });
    expect(estimate.signals.vocabularyComplexityScore).toBeGreaterThan(0.8);
  });
});

describe("estimateDifficulty — reasoning-step proxy signal", () => {
  it("scores 0 when explanation is absent", () => {
    const estimate = estimateDifficulty({ prompt: "Some prompt text here.", optionTexts: [] });
    expect(estimate.signals.reasoningStepScore).toBe(0);
  });

  it("scores 0 for a single-sentence explanation (at the low anchor)", () => {
    const estimate = estimateDifficulty({ prompt: "Some prompt text here.", optionTexts: [], explanation: "One sentence only." });
    expect(estimate.signals.reasoningStepScore).toBe(0);
  });

  it("scores 1 at or above the high anchor (4 sentences)", () => {
    const estimate = estimateDifficulty({
      prompt: "Some prompt text here.",
      optionTexts: [],
      explanation: "First step. Second step. Third step. Fourth step.",
    });
    expect(estimate.signals.reasoningStepScore).toBe(1);
  });
});

describe("estimateDifficulty — confidence", () => {
  it("is 0 for a candidate with no extractable words", () => {
    const estimate = estimateDifficulty({ prompt: "", optionTexts: [] });
    expect(estimate.estimateConfidence).toBe(0);
  });

  it("hits the exact MIN_DIFFICULTY_ESTIMATE_CONFIDENCE boundary (0.5) at 4 words", () => {
    const estimate = estimateDifficulty({ prompt: words(4), optionTexts: [] });
    expect(estimate.estimateConfidence).toBeCloseTo(FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE, 10);
  });

  it("is below the confidence floor at 3 words", () => {
    const estimate = estimateDifficulty({ prompt: words(3), optionTexts: [] });
    expect(estimate.estimateConfidence).toBeLessThan(FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE);
  });

  it("reaches full confidence (1.0) at or above 8 words", () => {
    const estimate = estimateDifficulty({ prompt: words(8), optionTexts: [] });
    expect(estimate.estimateConfidence).toBe(1);
  });
});

describe("estimateDifficulty — determinism", () => {
  it("produces identical output for identical input across repeated calls", () => {
    const input: DifficultyEstimateInput = { prompt: words(30), optionTexts: ["opt one", "opt two"], explanation: "Step one. Step two." };
    expect(estimateDifficulty(input)).toEqual(estimateDifficulty({ ...input }));
  });
});

describe("computeDifficultyDeviation", () => {
  it("is 0 for the same band", () => {
    expect(computeDifficultyDeviation("medium", "medium")).toBe(0);
  });

  it("is 0.5 for adjacent bands", () => {
    expect(computeDifficultyDeviation("easy", "medium")).toBe(0.5);
    expect(computeDifficultyDeviation("medium", "challenging")).toBe(0.5);
  });

  it("is 1.0 (maximal) for the extreme bands", () => {
    expect(computeDifficultyDeviation("easy", "challenging")).toBe(1);
    expect(computeDifficultyDeviation("challenging", "easy")).toBe(1);
  });

  it("hits the exact DIFFICULTY_MATCH_TOLERANCE boundary is exceeded by any adjacent-band deviation", () => {
    // Tolerance is 0.15; the smallest non-zero deviation this scale can
    // produce is 0.5 (adjacent bands) — any real mismatch always exceeds
    // tolerance, confirming there is no "almost matching" grey zone.
    expect(computeDifficultyDeviation("easy", "medium")).toBeGreaterThan(FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE);
  });
});
