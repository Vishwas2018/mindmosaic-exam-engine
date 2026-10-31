import {describe, expect, it} from "vitest";

import {samplePracticeFixtures, validateSampleAnswer, sampleExplanation} from "@/content/visual-fixtures/bar-model/sample-practice.server";

describe("samplePracticeFixtures", () => {
  it("returns exactly 15 Year 3 fixtures", () => {
    const y3 = samplePracticeFixtures(3);
    expect(y3).toHaveLength(15);
    expect(y3.every((f) => f.yearLevel === 3)).toBe(true);
  });

  it("returns exactly 15 Year 5 fixtures", () => {
    const y5 = samplePracticeFixtures(5);
    expect(y5).toHaveLength(15);
    expect(y5.every((f) => f.yearLevel === 5)).toBe(true);
  });

  it("strips privateAnswerKey and workedExplanation from client fixtures", () => {
    const fixtures = samplePracticeFixtures(3);
    for (const fixture of fixtures) {
      expect("privateAnswerKey" in fixture).toBe(false);
      expect("workedExplanation" in fixture).toBe(false);
      expect(fixture.name).toBeTruthy();
      expect(fixture.prompt).toBeTruthy();
      expect(fixture.visual).toBeTruthy();
    }
  });

  it("has unique fixture names", () => {
    const names = [...samplePracticeFixtures(3), ...samplePracticeFixtures(5)].map((f) => f.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("validateSampleAnswer", () => {
  it("returns correct for a known fixture with the right answer", () => {
    expect(validateSampleAnswer("pilot-y3-part-whole-01", 22)).toEqual({correct: true});
  });

  it("returns incorrect for a known fixture with the wrong answer", () => {
    expect(validateSampleAnswer("pilot-y3-part-whole-01", 99)).toEqual({correct: false});
  });

  it("returns incorrect for an unknown question id", () => {
    expect(validateSampleAnswer("does-not-exist", 42)).toEqual({correct: false});
  });

  it("never returns the answer key", () => {
    const result = validateSampleAnswer("pilot-y3-part-whole-01", 22);
    expect(result).not.toHaveProperty("privateAnswerKey");
    expect(result).not.toHaveProperty("answerKey");
  });
});

describe("sampleExplanation", () => {
  it("returns the worked explanation for a known fixture", () => {
    const explanation = sampleExplanation("pilot-y3-part-whole-01");
    expect(typeof explanation).toBe("string");
    expect(explanation!.length).toBeGreaterThan(0);
  });

  it("returns null for an unknown fixture", () => {
    expect(sampleExplanation("does-not-exist")).toBeNull();
  });
});
