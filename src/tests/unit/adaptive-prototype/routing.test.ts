import { describe, expect, it } from "vitest";

import { routeBand, stepBand } from "@/features/adaptive-prototype";

/**
 * Strategy doc D1's one routing decision, in isolation: given a 0-1 running
 * score, which band does the next testlet come from.
 */
describe("routeBand", () => {
  const thresholds = { routeUpAt: 0.6, routeDownAt: 0.4 };

  it("routes to challenging at or above routeUpAt", () => {
    expect(routeBand(0.6, thresholds)).toBe("challenging");
    expect(routeBand(0.8, thresholds)).toBe("challenging");
    expect(routeBand(1, thresholds)).toBe("challenging");
  });

  it("routes to easy at or below routeDownAt", () => {
    expect(routeBand(0.4, thresholds)).toBe("easy");
    expect(routeBand(0.2, thresholds)).toBe("easy");
    expect(routeBand(0, thresholds)).toBe("easy");
  });

  it("routes to medium strictly between the two thresholds", () => {
    expect(routeBand(0.5, thresholds)).toBe("medium");
    expect(routeBand(0.41, thresholds)).toBe("medium");
    expect(routeBand(0.59, thresholds)).toBe("medium");
  });

  it("uses DEFAULT_ROUTING_THRESHOLDS when none is given", () => {
    expect(routeBand(0.6)).toBe("challenging");
    expect(routeBand(0.4)).toBe("easy");
    expect(routeBand(0.5)).toBe("medium");
  });

  it("refuses thresholds where routeDownAt >= routeUpAt — medium would be unreachable", () => {
    expect(() => routeBand(0.5, { routeUpAt: 0.4, routeDownAt: 0.4 })).toThrow();
    expect(() => routeBand(0.5, { routeUpAt: 0.3, routeDownAt: 0.5 })).toThrow();
  });
});

/**
 * The "banded" provisional-ability model's own transition rule: a Markov
 * step off the CURRENT band and the just-completed stage's OWN local score
 * — no memory of anything earlier, unlike routeBand()'s cumulative score.
 */
describe("stepBand", () => {
  const thresholds = { routeUpAt: 0.6, routeDownAt: 0.4 };

  it("moves up exactly one band on a strong stage score", () => {
    expect(stepBand("easy", 0.6, thresholds)).toBe("medium");
    expect(stepBand("medium", 0.6, thresholds)).toBe("challenging");
  });

  it("moves down exactly one band on a weak stage score", () => {
    expect(stepBand("challenging", 0.4, thresholds)).toBe("medium");
    expect(stepBand("medium", 0.4, thresholds)).toBe("easy");
  });

  it("stays on the current band for a middling stage score", () => {
    expect(stepBand("easy", 0.5, thresholds)).toBe("easy");
    expect(stepBand("medium", 0.5, thresholds)).toBe("medium");
    expect(stepBand("challenging", 0.5, thresholds)).toBe("challenging");
  });

  it("saturates rather than overshooting past challenging or easy", () => {
    expect(stepBand("challenging", 1, thresholds)).toBe("challenging");
    expect(stepBand("easy", 0, thresholds)).toBe("easy");
  });

  it("refuses thresholds where routeDownAt >= routeUpAt, same as routeBand", () => {
    expect(() => stepBand("medium", 0.5, { routeUpAt: 0.4, routeDownAt: 0.4 })).toThrow();
  });
});
