import { describe, expect, it } from "vitest";

import { routeBand } from "@/features/adaptive-prototype";

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
