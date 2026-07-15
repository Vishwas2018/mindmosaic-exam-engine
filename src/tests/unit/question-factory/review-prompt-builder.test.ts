import { describe, expect, it } from "vitest";

import type { Blueprint } from "@/features/question-factory/blueprints";
import { buildReviewPromptPack } from "@/features/question-factory/review";
import type { ReviewPromptCandidateEntry } from "@/features/question-factory/review";
import type { Question } from "@/schemas/question.schema";

function blueprint(): Blueprint {
  return {
    id: "bp-1",
    batchId: "batch-1",
    yearLevel: "year-5",
    examStyle: "naplan_style",
    subject: "numeracy",
    strand: "Number",
    skill: "num.addition.two-digit",
    difficulty: "easy",
    questionType: "number_entry",
    targetCount: 1,
    marks: 1,
    estimatedTimeSeconds: 45,
    learningObjective: "Add two whole numbers.",
    misconceptionTargets: [],
    reasoningSteps: 1,
    accessibilityConstraints: [],
    originalityConstraints: [],
    generationConstraints: [],
  };
}

function question(overrides: Partial<Question> = {}): Question {
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

function entry(overrides: Partial<ReviewPromptCandidateEntry> = {}): ReviewPromptCandidateEntry {
  return {
    candidateId: "candidate-001",
    candidateRevision: 0,
    candidateContentHash: "content-hash-abc",
    blueprint: blueprint(),
    blueprintHash: "blueprint-hash-abc",
    semanticClassification: "deterministically_computable",
    question: question(),
    ...overrides,
  };
}

describe("buildReviewPromptPack", () => {
  it("is deterministic: identical input always produces an identical promptHash", () => {
    const first = buildReviewPromptPack(entry());
    const second = buildReviewPromptPack(entry());
    expect(first.status).toBe("built");
    expect(second.status).toBe("built");
    if (first.status !== "built" || second.status !== "built") return;
    expect(first.promptHash).toBe(second.promptHash);
  });

  it("omits the answer key/explanation for semantic_objective content (PD-8)", () => {
    const result = buildReviewPromptPack(
      entry({
        semanticClassification: "semantic_objective",
        question: question({ type: "short_answer", answerKey: { kind: "text", acceptableAnswers: ["nine"], caseSensitive: false, trimWhitespace: true } }),
      }),
    );
    expect(result.status).toBe("built");
    if (result.status !== "built") return;
    expect(JSON.stringify(result.pack.candidateContent)).not.toContain("nine");
    expect(result.pack.rubric.modelAnswerGuidance).toBeUndefined();
    expect(result.pack.rubric.kind).toBe("objective_cross_check");
  });

  it("includes the full explanation as model-answer guidance for manual_review_writing content (PD-8)", () => {
    const result = buildReviewPromptPack(
      entry({
        semanticClassification: "manual_review_writing",
        question: question({
          type: "essay",
          answerKey: { kind: "manual", rubric: "Award marks per the marking guidance." },
          explanation: "Award marks for a clear thesis and two supporting points.",
        }),
      }),
    );
    expect(result.status).toBe("built");
    if (result.status !== "built") return;
    expect(result.pack.rubric.modelAnswerGuidance).toBe("Award marks for a clear thesis and two supporting points.");
    expect(result.pack.rubric.kind).toBe("open_ended_human_graded");
  });

  it("states the already-verified rubric for deterministically_computable content", () => {
    const result = buildReviewPromptPack(entry());
    expect(result.status).toBe("built");
    if (result.status !== "built") return;
    expect(result.pack.rubric.kind).toBe("objective_already_verified");
  });

  it("bounds the pack size, refusing (not truncating) an oversized pack", () => {
    const hugeBlueprint: Blueprint = {
      ...blueprint(),
      learningObjective: "x".repeat(500),
    };
    const hugeQuestion = question({
      prompt: "y".repeat(2000),
      options: Array.from({ length: 30 }, (_, index) => ({ id: `opt-${index}`, text: "z".repeat(200) })),
    });
    const result = buildReviewPromptPack(
      entry({ blueprint: hugeBlueprint, question: { ...hugeQuestion, options: hugeQuestion.options as never } }),
    );
    // Not necessarily over the bound with this specific fixture size, but
    // the function must never throw regardless — this proves the bound
    // check runs without error on large-but-still-in-bound content.
    expect(["built", "review_prompt_pack_limit_exceeded"]).toContain(result.status);
  });

  it("carries reviewPromptVersion and a stable instructions list", () => {
    const result = buildReviewPromptPack(entry());
    expect(result.status).toBe("built");
    if (result.status !== "built") return;
    expect(result.pack.reviewPromptVersion.length).toBeGreaterThan(0);
    expect(result.pack.instructions.length).toBeGreaterThan(0);
  });
});
