import { describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  appendReviewRecord,
  reviewRecordSchema,
  type ReviewRecordDraft,
} from "@/features/question-factory/provenance";

function draft(overrides: Partial<ReviewRecordDraft> = {}): ReviewRecordDraft {
  return {
    candidateId: "candidate-001",
    stage: "correctness_check_passed",
    reviewerIdentity: normaliseIdentityOrThrow("claude"),
    reviewerVersion: "1.0.0",
    result: "passed",
    confidence: 0.92,
    findings: ["Answer key matches the computed value."],
    evidenceReferences: ["blueprint:num.data.read-bar-chart"],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-12T00:00:00.000Z",
    reviewPromptVersion: "review-v1",
    reviewPromptHash: "prompt-hash-abc",
    evidenceBinding: {
      candidateContentHash: "content-hash-abc",
      blueprintHash: "blueprint-hash-abc",
      candidateRevision: 0,
      reviewResultHash: "result-hash-abc",
    },
    ...overrides,
  };
}

describe("Mission 3B additive review-record fields", () => {
  it("accepts recommendedCorrections and stamps it into a schema-valid record", () => {
    const record = appendReviewRecord([], draft({ recommendedCorrections: ["Clarify the ambiguous stem wording."] }));
    expect(reviewRecordSchema.safeParse(record).success).toBe(true);
    expect(record.recommendedCorrections).toEqual(["Clarify the ambiguous stem wording."]);
  });

  it("accepts semanticClassification on the evidence binding", () => {
    const record = appendReviewRecord(
      [],
      draft({ evidenceBinding: { ...draft().evidenceBinding, semanticClassification: "semantic_objective" } }),
    );
    expect(reviewRecordSchema.safeParse(record).success).toBe(true);
    expect(record.evidenceBinding.semanticClassification).toBe("semantic_objective");
  });

  it("remains schema-valid without either new field (backward compatibility)", () => {
    const record = appendReviewRecord([], draft());
    expect(reviewRecordSchema.safeParse(record).success).toBe(true);
    expect(record.recommendedCorrections).toBeUndefined();
    expect(record.evidenceBinding.semanticClassification).toBeUndefined();
  });

  it("changes reviewHash when recommendedCorrections differs — tamper-evident, not silently ignored", () => {
    const withoutCorrections = appendReviewRecord([], draft());
    const withCorrections = appendReviewRecord([], draft({ recommendedCorrections: ["Fix the stem."] }));
    expect(withoutCorrections.reviewHash).not.toBe(withCorrections.reviewHash);
  });

  it("changes reviewHash when semanticClassification differs", () => {
    const a = appendReviewRecord(
      [],
      draft({ evidenceBinding: { ...draft().evidenceBinding, semanticClassification: "semantic_objective" } }),
    );
    const b = appendReviewRecord(
      [],
      draft({ evidenceBinding: { ...draft().evidenceBinding, semanticClassification: "manual_review_writing" } }),
    );
    expect(a.reviewHash).not.toBe(b.reviewHash);
  });

  it("rejects recommendedCorrections beyond the configured count bound", () => {
    const tooMany = Array.from({ length: 16 }, (_, index) => `Correction ${index}`);
    const parsed = reviewRecordSchema.safeParse({ ...draft(), recommendedCorrections: tooMany, previousReviewHash: "genesis", reviewHash: "x" });
    expect(parsed.success).toBe(false);
  });
});
