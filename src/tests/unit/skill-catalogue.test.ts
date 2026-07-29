import { describe, expect, it } from "vitest";

import { buildSkillCatalogue } from "@/features/exam-engine/selection/skill-catalogue";
import { questionBank } from "@/content/questions/question-bank";

describe("buildSkillCatalogue", () => {
  it("aggregates real bank metadata into browsable subject/skill counts", () => {
    const catalogue = buildSkillCatalogue(questionBank);
    expect(catalogue.length).toBeGreaterThan(0);
    for (const entry of catalogue) {
      expect(["numeracy", "reading", "language"]).toContain(entry.subject);
      expect(entry.questionCount).toBeGreaterThan(0);
      expect(entry.skill.length).toBeGreaterThan(0);
    }
  });

  it("excludes writing questions, which have no browsable subject filter", () => {
    const catalogue = buildSkillCatalogue(questionBank);
    const writingBankSubject = questionBank.filter((q) => q.metadata.subject === "writing");
    if (writingBankSubject.length > 0) {
      const total = catalogue.reduce((sum, entry) => sum + entry.questionCount, 0);
      const nonWritingCount = questionBank.filter((q) => q.metadata.subject !== "writing").length;
      expect(total).toBeLessThanOrEqual(nonWritingCount);
    }
  });

  it("sums counts per skill rather than counting each question once per subject/skill pair", () => {
    const bank = [
      { metadata: { subject: "numeracy", skill: "Fractions", topic: "Fractions" } },
      { metadata: { subject: "numeracy", skill: "Fractions", topic: "Fractions" } },
      { metadata: { subject: "numeracy", skill: "Addition", topic: "Addition" } },
    ] as unknown as Parameters<typeof buildSkillCatalogue>[0];
    const catalogue = buildSkillCatalogue(bank);
    expect(catalogue).toEqual(
      expect.arrayContaining([
        { subject: "numeracy", skill: "Fractions", questionCount: 2 },
        { subject: "numeracy", skill: "Addition", questionCount: 1 },
      ]),
    );
  });

  it("falls back to topic when a question has no skill", () => {
    const bank = [
      { metadata: { subject: "reading", topic: "Inference" } },
    ] as unknown as Parameters<typeof buildSkillCatalogue>[0];
    expect(buildSkillCatalogue(bank)).toEqual([
      { subject: "reading", skill: "Inference", questionCount: 1 },
    ]);
  });
});
