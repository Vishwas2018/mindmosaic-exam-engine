import { describe, expect, it } from "vitest";

import { reviewRecordSchema } from "@/features/question-factory/provenance";
import { DeterministicRuleReviewer } from "@/features/question-factory/review";
import type { ReviewContext } from "@/features/question-factory/review";
import type { Question } from "@/schemas/question.schema";

function baseQuestion(overrides: Partial<Question> = {}): Question {
  return {
    id: "q-1",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "draft",
    origin: "original_seed",
    prompt: "What is 4 + 5?",
    options: [],
    visuals: [],
    answerKey: { kind: "number", value: 9, tolerance: 0 },
    explanation: "4 + 5 = 9.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Addition",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
    ...overrides,
  } as Question;
}

function context(question: Question, semanticClassification: ReviewContext["semanticClassification"]): ReviewContext {
  return {
    question,
    candidateId: "candidate-001",
    candidateRevision: 0,
    candidateContentHash: "content-hash-abc",
    blueprintHash: "blueprint-hash-abc",
    semanticClassification,
    reviewedAt: "2026-07-15T00:00:00.000Z",
  };
}

describe("DeterministicRuleReviewer", () => {
  const reviewer = new DeterministicRuleReviewer();

  it("passes a clean deterministically_computable candidate", async () => {
    const outcome = await reviewer.review(context(baseQuestion(), "deterministically_computable"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.result).toBe("passed");
    expect(reviewRecordSchema.omit({ previousReviewHash: true, reviewHash: true }).safeParse(outcome.draft).success).toBe(true);
  });

  it("fails a deterministically_computable candidate containing unsafe markup", async () => {
    const question = baseQuestion({ explanation: "<script>alert(1)</script> 4 + 5 = 9." });
    const outcome = await reviewer.review(context(question, "deterministically_computable"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.result).toBe("failed");
    expect(outcome.draft.findings.some((finding) => finding.toLowerCase().includes("unsafe"))).toBe(true);
  });

  it("fails a deterministically_computable candidate whose visual alt text leaks the answer", async () => {
    const question = baseQuestion({
      answerKey: { kind: "number", value: 42, tolerance: 0 },
      explanation: "The answer is 42.",
      visuals: [{ id: "v1", type: "bar_chart", altText: "A chart showing the answer is 42.", data: { categories: [] } } as never],
    });
    const outcome = await reviewer.review(context(question, "deterministically_computable"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.result).toBe("failed");
  });

  it("flags (warning, never blocking) a non-Australian spelling pattern", async () => {
    const question = baseQuestion({ explanation: "Choose your favorite color and organize the answer: 4 + 5 = 9." });
    const outcome = await reviewer.review(context(question, "deterministically_computable"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.result).toBe("warning");
  });

  it("defers entirely for a clean semantic_objective candidate — never fabricates a passed result", async () => {
    const question = baseQuestion({
      type: "short_answer",
      answerKey: { kind: "text", acceptableAnswers: ["nine"], caseSensitive: false, trimWhitespace: true },
      explanation: "The answer is nine because 4 + 5 = 9.",
    });
    const outcome = await reviewer.review(context(question, "semantic_objective"));
    expect(outcome.kind).toBe("deferred");
  });

  it("defers entirely for a clean manual_review_writing candidate", async () => {
    const question = baseQuestion({
      type: "essay",
      answerKey: { kind: "manual", rubric: "Award marks per the marking guidance." },
      explanation: "Award marks for a clear argument with at least two supporting points.",
    });
    const outcome = await reviewer.review(context(question, "manual_review_writing"));
    expect(outcome.kind).toBe("deferred");
  });

  it("never emits result 'passed' for semantic_objective content, even when it has findings to report", async () => {
    const question = baseQuestion({
      type: "short_answer",
      answerKey: { kind: "text", acceptableAnswers: ["nine"], caseSensitive: false, trimWhitespace: true },
      explanation: "<script>bad</script>",
    });
    const outcome = await reviewer.review(context(question, "semantic_objective"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.result).not.toBe("passed");
  });

  it("never emits result 'passed' for manual_review_writing content, even when it has findings to report", async () => {
    const question = baseQuestion({
      type: "essay",
      answerKey: { kind: "manual", rubric: "Award marks per the marking guidance." },
      explanation: "",
    });
    const outcome = await reviewer.review(context(question, "manual_review_writing"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.result).not.toBe("passed");
  });

  it("flags missing rubric guidance for manual-answer-key content with a trivially short explanation", async () => {
    const question = baseQuestion({ type: "essay", answerKey: { kind: "manual", rubric: "Award marks per the marking guidance." }, explanation: "Ok." });
    const outcome = await reviewer.review(context(question, "manual_review_writing"));
    expect(outcome.kind).toBe("record");
    if (outcome.kind !== "record") return;
    expect(outcome.draft.findings.some((finding) => finding.toLowerCase().includes("marking guidance"))).toBe(true);
  });

  it("is deterministic: the same input always produces the same finding set and result", async () => {
    const question = baseQuestion({ explanation: "Choose your favorite color: 4 + 5 = 9." });
    const first = await reviewer.review(context(question, "deterministically_computable"));
    const second = await reviewer.review(context(question, "deterministically_computable"));
    expect(first).toEqual(second);
  });
});
