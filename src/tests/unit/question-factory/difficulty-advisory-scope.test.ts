import { describe, expect, it } from "vitest";

import { isDifficultyAdvisory } from "@/features/question-factory/difficulty/advisory-scope";

describe("difficulty advisory scope (proposal)", () => {
  it("covers AMC and scholarship numerical reasoning / mathematics only", () => {
    expect(isDifficultyAdvisory({ examStyle: "amc_style", metadata: { subject: "amc_mathematics" } })).toBe(true);
    expect(isDifficultyAdvisory({ examStyle: "scholarship_style", metadata: { subject: "numerical_reasoning" } })).toBe(true);
    expect(isDifficultyAdvisory({ examStyle: "scholarship_style", metadata: { subject: "numeracy" } })).toBe(true);
  });
  it("leaves verbal reasoning, reading and every NAPLAN/ICAS item blocking", () => {
    expect(isDifficultyAdvisory({ examStyle: "scholarship_style", metadata: { subject: "verbal_reasoning" } })).toBe(false);
    expect(isDifficultyAdvisory({ examStyle: "scholarship_style", metadata: { subject: "reading" } })).toBe(false);
    expect(isDifficultyAdvisory({ examStyle: "naplan_style", metadata: { subject: "numeracy" } })).toBe(false);
    expect(isDifficultyAdvisory({ examStyle: "icas_style", metadata: { subject: "numeracy" } })).toBe(false);
  });
});
