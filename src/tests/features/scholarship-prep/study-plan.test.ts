import { describe, expect, it } from "vitest";
import { buildStudyPlan, recommendNextFocus } from "@/features/scholarship-prep/lib/study-plan";

describe("buildStudyPlan", () => {
  it("creates a 6-day plan with 60 minutes per day", () => {
    const plan = buildStudyPlan([]);
    expect(plan.days).toHaveLength(6);
    for (const day of plan.days) {
      expect(day.minutes).toBe(60);
    }
    expect(plan.totalMinutesPerWeek).toBe(360);
  });

  it("assigns unique days 1 through 6", () => {
    const plan = buildStudyPlan([]);
    const dayNumbers = plan.days.map((d) => d.day);
    expect(dayNumbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("uses weak subject for day 6 revision when provided", () => {
    const plan = buildStudyPlan(["numerical_reasoning"]);
    const day6 = plan.days[5];
    expect(day6.day).toBe(6);
    expect(day6.focus).toBe("numerical_reasoning");
    expect(day6.activity).toBe("revision");
  });

  it("defaults day 6 to mixed revision when no weak subjects", () => {
    const plan = buildStudyPlan([]);
    const day6 = plan.days[5];
    expect(day6.focus).toBe("mixed_revision");
    expect(day6.activity).toBe("revision");
  });
});

describe("recommendNextFocus", () => {
  it("returns the first weak subject when available", () => {
    expect(recommendNextFocus(["verbal_reasoning", "mathematics"])).toBe("verbal_reasoning");
  });

  it("falls back to mathematics when no weak subjects", () => {
    expect(recommendNextFocus([])).toBe("mathematics");
  });
});
