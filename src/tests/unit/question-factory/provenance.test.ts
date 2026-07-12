import { describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  type CandidateEvidenceSnapshot,
  type CandidateProvenanceInput,
  type ReviewRecord,
  candidateProvenanceSchema,
  isIndependentReview,
  isProductionGradeIndependentReview,
  isReviewStillValid,
  reviewRecordSchema,
} from "@/features/question-factory/provenance";

function baseReviewInput(overrides: Partial<ReviewRecord> = {}): unknown {
  return {
    candidateId: "candidate-001",
    stage: "correctness_check_passed",
    reviewerIdentity: normaliseIdentityOrThrow("claude"),
    reviewerVersion: "1.0.0",
    result: "passed",
    confidence: 0.92,
    findings: ["Answer key matches the computed value.", "No ambiguity in the prompt wording."],
    evidenceReferences: ["blueprint:num.data.read-bar-chart", "answerKey.value=42"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-12T00:00:00.000Z",
    reviewPromptVersion: "review-v1",
    reviewPromptHash: "abc123",
    evidenceBinding: {
      candidateContentHash: "content-hash-abc",
      blueprintHash: "blueprint-hash-abc",
      candidateRevision: 0,
      reviewResultHash: "result-hash-abc",
    },
    previousReviewHash: "genesis",
    reviewHash: "review-hash-abc",
    ...overrides,
  };
}

function baseProvenanceInput(
  overrides: Partial<CandidateProvenanceInput> = {},
): CandidateProvenanceInput {
  return {
    candidateId: "candidate-001",
    blueprintId: "blueprint-001",
    batchId: "batch-001",
    pipelineRunId: "run-001",
    revision: 0,
    generatedAt: "2026-07-12T00:00:00.000Z",
    generatorAdapter: {
      class: "deterministic_fixture",
      identity: normaliseIdentityOrThrow("deterministic-fixture-generator"),
    },
    generatorVersion: "1.0.0",
    promptVersion: "prompt-v1",
    schemaVersion: "1",
    taxonomyVersion: "1",
    contentHash: "content-hash-abc",
    reviewRecords: [],
    ...overrides,
  };
}

describe("reviewRecordSchema", () => {
  it("parses a well-formed review record", () => {
    expect(reviewRecordSchema.safeParse(baseReviewInput()).success).toBe(true);
  });

  it("rejects an unknown lifecycle stage", () => {
    expect(
      reviewRecordSchema.safeParse(baseReviewInput({ stage: "not_a_stage" as never })).success,
    ).toBe(false);
  });

  it("rejects an unknown review result", () => {
    expect(
      reviewRecordSchema.safeParse(baseReviewInput({ result: "maybe" as never })).success,
    ).toBe(false);
  });

  it("rejects confidence outside [0, 1]", () => {
    expect(reviewRecordSchema.safeParse(baseReviewInput({ confidence: 1.5 })).success).toBe(
      false,
    );
    expect(reviewRecordSchema.safeParse(baseReviewInput({ confidence: -0.1 })).success).toBe(
      false,
    );
  });

  it("rejects more than the maximum number of findings (concise evidence only)", () => {
    const tooMany = Array.from({ length: 16 }, (_, i) => `Finding ${i}`);
    expect(
      reviewRecordSchema.safeParse(baseReviewInput({ findings: tooMany })).success,
    ).toBe(false);
  });

  it("rejects an overly long finding string (no chain-of-thought dumps)", () => {
    const tooLong = "x".repeat(401);
    expect(
      reviewRecordSchema.safeParse(baseReviewInput({ findings: [tooLong] })).success,
    ).toBe(false);
  });
});

describe("candidateProvenanceSchema", () => {
  it("parses a well-formed provenance record", () => {
    const result = candidateProvenanceSchema.safeParse(baseProvenanceInput());
    expect(result.success).toBe(true);
  });

  it("defaults reviewRecords to an empty array", () => {
    const input = baseProvenanceInput();
    delete (input as { reviewRecords?: unknown }).reviewRecords;
    const parsed = candidateProvenanceSchema.parse(input);
    expect(parsed.reviewRecords).toEqual([]);
  });

  it("rejects an unknown generator class", () => {
    const result = candidateProvenanceSchema.safeParse(
      baseProvenanceInput({
        generatorAdapter: {
          class: "totally_made_up" as never,
          identity: normaliseIdentityOrThrow("claude"),
        },
      }),
    );
    expect(result.success).toBe(false);
  });

  it("accepts an optional parentCandidateId for a revision", () => {
    const result = candidateProvenanceSchema.safeParse(
      baseProvenanceInput({ parentCandidateId: "candidate-000", revision: 1 }),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a malformed candidateId", () => {
    const result = candidateProvenanceSchema.safeParse(
      baseProvenanceInput({ candidateId: "Not Valid!" }),
    );
    expect(result.success).toBe(false);
  });
});

describe("evidence binding and independence", () => {
  const currentSnapshot: CandidateEvidenceSnapshot = {
    contentHash: "content-hash-abc",
    blueprintHash: "blueprint-hash-abc",
    revision: 0,
  };

  it("isReviewStillValid is true when the binding matches the current candidate state", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(isReviewStillValid(review, currentSnapshot)).toBe(true);
  });

  it("isReviewStillValid is false after the candidate content changes", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(
      isReviewStillValid(review, { ...currentSnapshot, contentHash: "new-content-hash" }),
    ).toBe(false);
  });

  it("isReviewStillValid is false after the candidate revision bumps", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(isReviewStillValid(review, { ...currentSnapshot, revision: 1 })).toBe(false);
  });

  it("isReviewStillValid is false when the blueprint hash no longer matches", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(
      isReviewStillValid(review, { ...currentSnapshot, blueprintHash: "different-blueprint" }),
    ).toBe(false);
  });

  it("isIndependentReview is false when generator and reviewer share a normalised identity", () => {
    const review = reviewRecordSchema.parse(
      baseReviewInput({ reviewerIdentity: normaliseIdentityOrThrow("claude") }),
    );
    expect(isIndependentReview(normaliseIdentityOrThrow("claude"), review)).toBe(false);
  });

  it("isIndependentReview is true across different providers", () => {
    const review = reviewRecordSchema.parse(
      baseReviewInput({ reviewerIdentity: normaliseIdentityOrThrow("claude") }),
    );
    expect(isIndependentReview(normaliseIdentityOrThrow("qwen"), review)).toBe(true);
  });

  it("isProductionGradeIndependentReview passes a fully valid independent review", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("qwen"),
        review,
        currentSnapshot,
        0.8,
      ),
    ).toBe(true);
  });

  it("isProductionGradeIndependentReview fails on generator self-review", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("claude"),
        review,
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("isProductionGradeIndependentReview fails below the confidence threshold", () => {
    const review = reviewRecordSchema.parse(baseReviewInput({ confidence: 0.5 }));
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("qwen"),
        review,
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("isProductionGradeIndependentReview fails with no evidence references", () => {
    const review = reviewRecordSchema.parse(baseReviewInput({ evidenceReferences: [] }));
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("qwen"),
        review,
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("isProductionGradeIndependentReview fails with unresolved ambiguity", () => {
    const review = reviewRecordSchema.parse(baseReviewInput({ ambiguityStatus: "unresolved" }));
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("qwen"),
        review,
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("isProductionGradeIndependentReview fails on a stale binding (candidate changed since review)", () => {
    const review = reviewRecordSchema.parse(baseReviewInput());
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("qwen"),
        review,
        { ...currentSnapshot, contentHash: "changed" },
        0.8,
      ),
    ).toBe(false);
  });

  it("isProductionGradeIndependentReview fails when the result is not 'passed'", () => {
    const review = reviewRecordSchema.parse(baseReviewInput({ result: "warning" }));
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("qwen"),
        review,
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });
});
