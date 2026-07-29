import { describe, expect, it } from "vitest";

import { percentageTrend } from "@/features/teacher/analytics";

describe("percentageTrend", () => {
  it("is flat with fewer than two data points", () => {
    expect(percentageTrend([])).toEqual({ direction: "flat", deltaPoints: 0 });
    expect(percentageTrend([80])).toEqual({ direction: "flat", deltaPoints: 0 });
  });

  it("is up once the recent half clears the noise threshold", () => {
    const result = percentageTrend([50, 52, 70, 74]);
    expect(result.direction).toBe("up");
    expect(result.deltaPoints).toBeGreaterThan(3);
  });

  it("is down once the recent half drops beyond the noise threshold", () => {
    const result = percentageTrend([80, 78, 60, 58]);
    expect(result.direction).toBe("down");
    expect(result.deltaPoints).toBeLessThan(-3);
  });

  it("is flat for a shift within the noise threshold", () => {
    const result = percentageTrend([70, 71, 72, 73]);
    expect(result.direction).toBe("flat");
  });
});
