import { describe, expect, it } from "vitest";

import { probabilisticStrategy } from "@/features/adaptive-prototype";

describe("probabilisticStrategy", () => {
  it("is deterministic for the same seed", () => {
    const strategyA = probabilisticStrategy(0.5, "seed-x");
    const strategyB = probabilisticStrategy(0.5, "seed-x");
    const item = {} as never;
    const resultsA = Array.from({ length: 20 }, (_, index) => strategyA(1, index, item));
    const resultsB = Array.from({ length: 20 }, (_, index) => strategyB(1, index, item));
    expect(resultsA).toEqual(resultsB);
  });

  it("differs between two seeds (not guaranteed, but true for these two)", () => {
    const strategyA = probabilisticStrategy(0.5, "seed-x");
    const strategyB = probabilisticStrategy(0.5, "seed-y");
    const item = {} as never;
    const resultsA = Array.from({ length: 20 }, (_, index) => strategyA(1, index, item));
    const resultsB = Array.from({ length: 20 }, (_, index) => strategyB(1, index, item));
    expect(resultsA).not.toEqual(resultsB);
  });

  it("probability 1 is always correct, probability 0 is always incorrect", () => {
    const item = {} as never;
    const always = probabilisticStrategy(1, "any-seed");
    const never = probabilisticStrategy(0, "any-seed");
    for (let index = 0; index < 20; index += 1) {
      expect(always(1, index, item)).toBe(true);
      expect(never(1, index, item)).toBe(false);
    }
  });

  it("a mid probability produces a roughly proportionate share of correct answers over many draws", () => {
    const strategy = probabilisticStrategy(0.5, "law-of-large-numbers");
    const item = {} as never;
    let correct = 0;
    const trials = 2000;
    for (let index = 0; index < trials; index += 1) {
      if (strategy(1, index, item)) correct += 1;
    }
    /* Not a statistical assertion of exact fairness — just that it isn't
       secretly always-true or always-false at 2000 draws. */
    expect(correct / trials).toBeGreaterThan(0.4);
    expect(correct / trials).toBeLessThan(0.6);
  });

  it("refuses a probability outside [0, 1]", () => {
    expect(() => probabilisticStrategy(-0.1, "seed")).toThrow();
    expect(() => probabilisticStrategy(1.1, "seed")).toThrow();
  });
});
