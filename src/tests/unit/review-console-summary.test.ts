import { describe, expect, it } from "vitest";
import { computeBatchSummary } from "@/features/review-console/batch-summary";
import type { ReviewItem } from "@/features/review-console/types";
import type { Question } from "@/schemas/question.schema";

describe("review console batch summary analytics", () => {
  const sampleItems: ReviewItem[] = [
    {
      id: "q1",
      index: 0,
      contentHash: "h1",
      revision: 1,
      sourceManifestHash: null,
      question: {
        id: "q1",
        type: "reading_comprehension",
        yearLevel: 3,
        examStyle: "naplan_style",
        prompt: "Prompt 1",
        answerKey: { kind: "single_option", optionId: "a" },
        metadata: {
          subject: "reading",
          strand: "Interpreting",
          skill: "read.prod.literal-comprehension",
          difficulty: "easy",
        },
      } as unknown as Question,
      decision: "",
      notes: "",
      checks: { correctness: false, originality: false, ageAppropriateness: false },
      isMachineVerifiable: false,
      verificationNotes: [],
    },
    {
      id: "q2",
      index: 1,
      contentHash: "h2",
      revision: 1,
      sourceManifestHash: null,
      question: {
        id: "q2",
        type: "reading_comprehension",
        yearLevel: 3,
        examStyle: "naplan_style",
        prompt: "Prompt 2",
        answerKey: { kind: "single_option", optionId: "b" },
        metadata: {
          subject: "reading",
          strand: "Interpreting",
          skill: "lit.reading.inference",
          difficulty: "medium",
        },
      } as unknown as Question,
      decision: "",
      notes: "",
      checks: { correctness: false, originality: false, ageAppropriateness: false },
      isMachineVerifiable: false,
      verificationNotes: [],
    },
    {
      id: "q3",
      index: 2,
      contentHash: "h3",
      revision: 1,
      sourceManifestHash: null,
      question: {
        id: "q3",
        type: "multiple_choice",
        yearLevel: 3,
        examStyle: "naplan_style",
        prompt: "Prompt 3",
        answerKey: { kind: "single_option", optionId: "a" },
        metadata: {
          subject: "language_conventions",
          strand: "Spelling",
          skill: "lang.prod.spelling",
          difficulty: "easy",
        },
      } as unknown as Question,
      decision: "",
      notes: "",
      checks: { correctness: false, originality: false, ageAppropriateness: false },
      isMachineVerifiable: true,
      verificationNotes: [],
    },
    {
      id: "q4",
      index: 3,
      contentHash: "h4",
      revision: 1,
      sourceManifestHash: null,
      question: {
        id: "q4",
        type: "number_entry",
        yearLevel: 3,
        examStyle: "naplan_style",
        prompt: "Prompt 4",
        answerKey: { kind: "number", value: 42 },
        metadata: {
          subject: "numeracy",
          strand: "Number",
          skill: "num.addition",
          difficulty: "challenging",
        },
      } as unknown as Question,
      decision: "",
      notes: "",
      checks: { correctness: false, originality: false, ageAppropriateness: false },
      isMachineVerifiable: true,
      verificationNotes: [],
    },
  ];

  it("calculates accurate skill counts across the batch", () => {
    const summary = computeBatchSummary(sampleItems, "test-batch", "Test Batch");
    expect(summary.totalItems).toBe(4);
    expect(summary.skillCounts["read.prod.literal-comprehension"]).toBe(1);
    expect(summary.skillCounts["lit.reading.inference"]).toBe(1);
    expect(summary.skillCounts["lang.prod.spelling"]).toBe(1);
    expect(summary.skillCounts["num.addition"]).toBe(1);
  });

  it("calculates difficulty distribution", () => {
    const summary = computeBatchSummary(sampleItems);
    expect(summary.difficultyCounts["easy"]).toBe(2);
    expect(summary.difficultyCounts["medium"]).toBe(1);
    expect(summary.difficultyCounts["challenging"]).toBe(1);
  });

  it("calculates answer-position distribution", () => {
    const summary = computeBatchSummary(sampleItems);
    expect(summary.answerPositionCounts["a"]).toBe(2);
    expect(summary.answerPositionCounts["b"]).toBe(1);
    expect(summary.answerPositionCounts["number"]).toBe(1);
  });

  it("accurately categorizes solver-backed vs semantic-judgement items", () => {
    const summary = computeBatchSummary(sampleItems);
    expect(summary.solverBackedCount).toBe(2);
    expect(summary.semanticReviewCount).toBe(2);
    expect(summary.solverItemIds).toEqual(["q3", "q4"]);
    expect(summary.semanticItemIds).toEqual(["q1", "q2"]);
  });
});
