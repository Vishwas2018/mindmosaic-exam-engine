import { describe, expect, it } from "vitest";

import { getStudioAvailability } from "@/server/practice-studio-availability";

/**
 * The wrapper over the real served bank. Invariants only: no assertion here
 * pins a question count, so publishing content never breaks it.
 */
describe("getStudioAvailability (real bank)", () => {
  const result = getStudioAvailability();

  it("could check the bank", () => {
    expect(result.integrity).toBe("ok");
  });

  it("never surfaces AMC-style or scholarship-style", () => {
    expect(result.subjects.some((s) => s.examStyle === "amc_style")).toBe(false);
    expect(result.subjects.some((s) => s.examStyle === "scholarship_style")).toBe(false);
  });

  it("finds the language programmes through the vocabulary join", () => {
    const language = result.subjects.filter((s) => s.subject === "language" && [3, 5].includes(s.yearLevel));
    expect(language.length).toBeGreaterThanOrEqual(4);
    for (const entry of language) {
      expect(entry.state).toBe("ready");
      expect(entry.uniqueQuestions).toBeGreaterThan(0);
    }
  });

  it("keeps ICAS Year 5 Science unavailable", () => {
    const cell = result.subjects.find((s) => s.yearLevel === 5 && s.examStyle === "icas_style" && s.subject === "science");
    expect(cell?.state).toBe("none");
  });

  it("only ever reports a strand as eligible at or above the floor, with no repeated strand key", () => {
    for (const subject of result.subjects) {
      const keys = subject.strands.map((s) => s.strandKey);
      expect(new Set(keys).size).toBe(keys.length);
      for (const strand of subject.strands) {
        expect(strand.eligible).toBe((strand.uniqueQuestions ?? 0) >= 5);
      }
    }
  });
});
