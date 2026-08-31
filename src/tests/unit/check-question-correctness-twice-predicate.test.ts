import { describe, expect, it } from "vitest";

import { moreThanTwicePredicate } from "../../../scripts/lib/twice-predicate";

/**
 * Regression coverage for the "more than twice X but fewer than Y" interval
 * predicate used by checkOptionQuestion (scripts/check-question-correctness.mts),
 * added for g5-icas-math-b01-008 ("Which team scored more than twice Blue's
 * score but fewer than 20 points?", Blue=8, Red=18, Green=16, Gold=22, key=Red).
 *
 * Before this branch, "more than twice X" and "but fewer than Y" were not
 * distinguished from plain "twice X" (an exact-match predicate), so a
 * question phrased as a bounded interval would have its correct key ("Red",
 * the only score satisfying BOTH bounds) reported as wrong.
 */
describe("moreThanTwicePredicate", () => {
  it("accepts a value strictly between twice the reference and the upper bound (the real q008 case)", () => {
    const predicate = moreThanTwicePredicate(
      "which team scored more than twice blue's score but fewer than 20 points?",
      8,
      "blue",
    );

    // Red = 18: > 2*8 (16) and < 20 -> matches.
    expect(predicate.matches(18)).toBe(true);
    // Blue itself, 2x its own value, is excluded by the caller (item !== reference),
    // but the predicate alone must still reject values at or below twice the reference.
    expect(predicate.matches(16)).toBe(false); // Green: not > 16
    expect(predicate.matches(8)).toBe(false); // Blue: not > 16
    // Gold = 22: > 16 but NOT < 20 -> the upper bound must reject it.
    expect(predicate.matches(22)).toBe(false);
  });

  it("has no upper bound when the prompt has no 'fewer than'/'less than' clause", () => {
    const predicate = moreThanTwicePredicate("which team scored more than twice blue's score?", 8, "blue");

    expect(predicate.matches(18)).toBe(true);
    // Without the bounded clause, Gold (22) legitimately also satisfies "more than twice" —
    // it's checkOptionQuestion's verifyUnique() that then correctly refuses to pick between
    // two matches, not this predicate.
    expect(predicate.matches(22)).toBe(true);
    expect(predicate.matches(16)).toBe(false);
  });

  it("parses the upper bound number verbatim from an arbitrary 'fewer than N' clause", () => {
    const predicate = moreThanTwicePredicate("more than twice x but fewer than 50", 10, "x");

    expect(predicate.matches(21)).toBe(true); // > 20 and < 50
    expect(predicate.matches(50)).toBe(false); // not strictly < 50
    expect(predicate.matches(20)).toBe(false); // not strictly > 20
  });

  it("also recognises 'less than N' (not just 'fewer than N') as the upper bound", () => {
    const predicate = moreThanTwicePredicate("more than twice x but less than 30", 10, "x");

    expect(predicate.matches(25)).toBe(true);
    expect(predicate.matches(30)).toBe(false);
  });

  it("the description names the reference label and, when present, the upper bound", () => {
    const bounded = moreThanTwicePredicate("more than twice blue's score but fewer than 20 points", 8, "blue");
    expect(bounded.description).toBe("more than twice the 'blue' value but fewer than 20");

    const unbounded = moreThanTwicePredicate("more than twice blue's score", 8, "blue");
    expect(unbounded.description).toBe("more than twice the 'blue' value");
  });
});
