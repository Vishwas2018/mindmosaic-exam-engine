import { describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  REVIEW_CHAIN_GENESIS_HASH,
  appendReviewRecord,
  computeReviewHash,
  reviewRecordSchema,
  verifyReviewChain,
  type ReviewRecord,
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

describe("appendReviewRecord", () => {
  it("chains the first record from the explicit genesis value", () => {
    const record = appendReviewRecord([], draft());
    expect(record.previousReviewHash).toBe(REVIEW_CHAIN_GENESIS_HASH);
    expect(reviewRecordSchema.safeParse(record).success).toBe(true);
  });

  it("chains a second record from the first record's reviewHash", () => {
    const first = appendReviewRecord([], draft());
    const second = appendReviewRecord([first], draft({ result: "failed" }));
    expect(second.previousReviewHash).toBe(first.reviewHash);
    expect(second.reviewHash).not.toBe(first.reviewHash);
  });

  it("is deterministic: the same draft chained onto the same prior chain always produces the same reviewHash (golden vector)", () => {
    const chainInput = draft({
      reviewedAt: "2026-07-12T00:00:00.000Z",
      findings: ["Finding A", "Finding B"],
    });
    const first = appendReviewRecord([], chainInput);
    const second = appendReviewRecord([], chainInput);
    const third = appendReviewRecord([], chainInput);

    expect(first.reviewHash).toBe(second.reviewHash);
    expect(first.reviewHash).toBe(third.reviewHash);
    // Golden vector: pinned so an accidental change to the hashed payload
    // shape (field added/removed/renamed) is caught even if every input
    // in this file stays byte-identical.
    expect(first.reviewHash).toBe(
      "98b9ca34c1d4d28619797aa45dd7173f9c989092b9753e7dc80765a44166ab68",
    );
  });

  it("produces a different reviewHash when any bound field changes (reviewedAt)", () => {
    const a = appendReviewRecord([], draft({ reviewedAt: "2026-07-12T00:00:00.000Z" }));
    const b = appendReviewRecord([], draft({ reviewedAt: "2026-07-13T00:00:00.000Z" }));
    expect(a.reviewHash).not.toBe(b.reviewHash);
  });

  it("keeps two records for the same candidate/stage with different content independently and correctly chained (no id reuse collision)", () => {
    const first = appendReviewRecord(
      [],
      draft({ result: "uncertain", findings: ["First pass: minor issue."] }),
    );
    const second = appendReviewRecord(
      [first],
      draft({ result: "passed", findings: ["Second pass: issue resolved."] }),
    );

    expect(first.reviewHash).not.toBe(second.reviewHash);
    expect(verifyReviewChain([first, second]).valid).toBe(true);
  });
});

describe("verifyReviewChain", () => {
  function buildValidChain(length: number): ReviewRecord[] {
    const chain: ReviewRecord[] = [];
    for (let i = 0; i < length; i++) {
      chain.push(
        appendReviewRecord(chain, draft({ findings: [`Finding for record ${i}`] })),
      );
    }
    return chain;
  }

  it("accepts an empty chain", () => {
    expect(verifyReviewChain([])).toEqual({ valid: true, issues: [] });
  });

  it("accepts a valid multi-record chain", () => {
    const chain = buildValidChain(4);
    expect(verifyReviewChain(chain)).toEqual({ valid: true, issues: [] });
  });

  it("detects an edited record (content changed, stored reviewHash left stale)", () => {
    const chain = buildValidChain(3);
    const tampered = [
      chain[0]!,
      { ...chain[1]!, result: "failed" as const },
      chain[2]!,
    ];

    const result = verifyReviewChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ index: 1, code: "review_hash_mismatch" }),
    );
    // Localised: record 0 and the link into record 2 are untouched.
    expect(result.issues.some((issue) => issue.index === 0)).toBe(false);
  });

  it("detects a deleted record (the gap breaks the chain link)", () => {
    const chain = buildValidChain(3);
    const withDeletion = [chain[0]!, chain[2]!];

    const result = verifyReviewChain(withDeletion);
    expect(result.valid).toBe(false);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ index: 1, code: "previous_hash_mismatch" }),
    );
  });

  it("detects reordered records", () => {
    const chain = buildValidChain(3);
    const reordered = [chain[1]!, chain[0]!, chain[2]!];

    const result = verifyReviewChain(reordered);
    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("detects a changed candidate content hash on a stored record", () => {
    const chain = buildValidChain(2);
    const tampered = [
      { ...chain[0]!, evidenceBinding: { ...chain[0]!.evidenceBinding, candidateContentHash: "forged" } },
      chain[1]!,
    ];

    const result = verifyReviewChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.index === 0 && issue.code === "review_hash_mismatch")).toBe(
      true,
    );
  });

  it("detects a changed candidate revision on a stored record", () => {
    const chain = buildValidChain(2);
    const tampered = [
      { ...chain[0]!, evidenceBinding: { ...chain[0]!.evidenceBinding, candidateRevision: 7 } },
      chain[1]!,
    ];

    const result = verifyReviewChain(tampered);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.index === 0)).toBe(true);
  });

  it("detects a replaced record (different content under a fabricated but internally-consistent-looking hash)", () => {
    const chain = buildValidChain(2);
    const forged: ReviewRecord = {
      ...chain[0]!,
      findings: ["A completely different finding, forged after the fact."],
      // Attacker updates the stored hash too, but not to a value that
      // actually matches the recomputed content.
      reviewHash: "forged-hash-that-does-not-match-content",
    };

    const result = verifyReviewChain([forged, chain[1]!]);
    expect(result.valid).toBe(false);
  });

  it("does not store or rely on chain-of-thought — only the bounded findings/evidence fields feed the hash", () => {
    const record = appendReviewRecord([], draft());
    expect(computeReviewHash(record)).toBe(record.reviewHash);
    // The hash is a fixed-length digest, not a growing transcript.
    expect(record.reviewHash.length).toBeLessThanOrEqual(64);
  });
});
