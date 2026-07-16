import { describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import {
  REVIEW_CHAIN_GENESIS_HASH,
  appendReviewRecord,
  computeReviewHash,
  type CandidateEvidenceSnapshot,
  type CandidateProvenanceInput,
  type ReviewRecord,
  type ReviewRecordDraft,
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

  describe("Mission 3C — supersededBy (legacy compatibility)", () => {
    it("a pre-Mission-3C-shaped record with no supersededBy field remains schema-valid — the field is additive-only", () => {
      const result = candidateProvenanceSchema.safeParse(baseProvenanceInput());
      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.supersededBy).toBeUndefined();
    });

    it("accepts a well-formed supersededBy claim", () => {
      const result = candidateProvenanceSchema.safeParse(
        baseProvenanceInput({
          supersededBy: {
            candidateId: "rev-abc123",
            revisionRequestId: "rev-req-1",
            revisionFingerprint: "fingerprint-abc",
            claimedAt: "2026-07-16T00:00:00.000Z",
          },
        }),
      );
      expect(result.success).toBe(true);
    });

    it("rejects a supersededBy claim missing a required field", () => {
      const result = candidateProvenanceSchema.safeParse(
        baseProvenanceInput({
          supersededBy: {
            candidateId: "rev-abc123",
            revisionRequestId: "rev-req-1",
            // revisionFingerprint intentionally omitted
            claimedAt: "2026-07-16T00:00:00.000Z",
          } as never,
        }),
      );
      expect(result.success).toBe(false);
    });
  });
});

describe("evidence binding and independence", () => {
  const currentSnapshot: CandidateEvidenceSnapshot = {
    candidateId: "candidate-001",
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
});

/**
 * isProductionGradeIndependentReview no longer accepts a bare ReviewRecord —
 * it requires a VerifiedReviewChainEvidence (the candidate's full,
 * append-order review chain, which specific record in it is being claimed,
 * and the hash the caller expects the chain to currently end at). This is
 * the review-chain-integrity fix recorded in
 * docs/reports/mission2-fixture-prep/05-review-chain-followup.md: a
 * directly constructed, standalone ReviewRecord with a plausible-looking
 * previousReviewHash/reviewHash pair — one that was never actually appended
 * through appendReviewRecord — must never satisfy this helper, even when
 * every other field (result, confidence, evidence references, ambiguity,
 * binding) is otherwise valid.
 */
describe("isProductionGradeIndependentReview: verified review-chain requirement", () => {
  const currentSnapshot: CandidateEvidenceSnapshot = {
    candidateId: "candidate-001",
    contentHash: "content-hash-abc",
    blueprintHash: "blueprint-hash-abc",
    revision: 0,
  };

  function reviewDraft(overrides: Partial<ReviewRecordDraft> = {}): ReviewRecordDraft {
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

  function buildChain(drafts: readonly Partial<ReviewRecordDraft>[]): ReviewRecord[] {
    const chain: ReviewRecord[] = [];
    for (const overrides of drafts) {
      chain.push(appendReviewRecord(chain, reviewDraft(overrides)));
    }
    return chain;
  }

  // The independent (non-self) reviewer identity used across this describe
  // block; the reviewer on every drafted record above is "claude".
  const INDEPENDENT_GENERATOR = normaliseIdentityOrThrow("qwen");

  it("accepts a fully valid, verified single-record chain", () => {
    const chain = buildChain([{}]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(true);
  });

  it("accepts the latest record of a fully valid, verified multi-record chain", () => {
    const chain = buildChain([
      { result: "uncertain", findings: ["First pass: minor issue."] },
      {},
    ]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(true);
  });

  it("still enforces reviewer independence: rejects generator self-review even with a verified chain", () => {
    const chain = buildChain([{}]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        normaliseIdentityOrThrow("claude"), // same identity as the reviewer on the draft
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("still enforces the confidence threshold", () => {
    const chain = buildChain([{ confidence: 0.5 }]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("still enforces the at-least-one-evidence-reference requirement", () => {
    const chain = buildChain([{ evidenceReferences: [] }]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("still enforces the no-unresolved-ambiguity requirement", () => {
    const chain = buildChain([{ ambiguityStatus: "unresolved" }]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("still enforces result === 'passed'", () => {
    const chain = buildChain([{ result: "warning" }]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a stale candidate content hash (candidate content changed since review)", () => {
    const chain = buildChain([{}]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        { ...currentSnapshot, contentHash: "changed-content-hash" },
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a stale candidate revision (candidate revision bumped since review)", () => {
    const chain = buildChain([{}]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        { ...currentSnapshot, revision: 1 },
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a stale blueprint hash (blueprint changed since review)", () => {
    const chain = buildChain([{}]);
    const terminal = chain[chain.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain, reviewHash: terminal.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
        { ...currentSnapshot, blueprintHash: "changed-blueprint-hash" },
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a directly constructed standalone review record with fabricated hashes (the original defect)", () => {
    const forged: ReviewRecord = {
      ...reviewDraft(),
      previousReviewHash: REVIEW_CHAIN_GENESIS_HASH,
      reviewHash: "plausible-looking-but-fabricated-review-hash",
    };
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain: [forged],
          reviewHash: forged.reviewHash,
          expectedTerminalReviewHash: forged.reviewHash,
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects an arbitrary previousReviewHash, even when reviewHash is internally self-consistent", () => {
    const withArbitraryPrevious: Omit<ReviewRecord, "reviewHash"> = {
      ...reviewDraft(),
      previousReviewHash: "arbitrary-previous-hash-not-genesis",
    };
    const forged: ReviewRecord = {
      ...withArbitraryPrevious,
      reviewHash: computeReviewHash(withArbitraryPrevious),
    };
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain: [forged],
          reviewHash: forged.reviewHash,
          expectedTerminalReviewHash: forged.reviewHash,
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects an arbitrary expectedTerminalReviewHash that matches nothing in the chain", () => {
    const chain = buildChain([{}]);
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain,
          reviewHash: chain[0]!.reviewHash,
          expectedTerminalReviewHash: "completely-made-up-terminal-hash",
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a wrong (stale-but-real) terminal review hash — an earlier record's hash after a new review was appended", () => {
    const chain = buildChain([
      { result: "uncertain", findings: ["First pass: minor issue."] },
      {},
    ]);
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain,
          reviewHash: chain[1]!.reviewHash,
          expectedTerminalReviewHash: chain[0]!.reviewHash, // stale: the chain has since grown
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a review record not present in the verified chain", () => {
    const chainA = buildChain([{ findings: ["Chain A's only finding."] }]);
    const chainB = buildChain([{ findings: ["Chain B's only finding."] }]);
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain: chainA,
          reviewHash: chainB[0]!.reviewHash, // borrowed from a different, unrelated chain
          expectedTerminalReviewHash: chainA[0]!.reviewHash,
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects an edited record (content changed, stored reviewHash left stale)", () => {
    const chain = buildChain([{}, {}, {}]);
    const tampered: ReviewRecord[] = [
      chain[0]!,
      { ...chain[1]!, result: "failed" },
      chain[2]!,
    ];
    const target = tampered[tampered.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        { chain: tampered, reviewHash: target.reviewHash, expectedTerminalReviewHash: target.reviewHash },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a deleted record (the gap breaks the chain link)", () => {
    const chain = buildChain([{}, {}, {}]);
    const withDeletion: ReviewRecord[] = [chain[0]!, chain[2]!];
    const target = withDeletion[withDeletion.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain: withDeletion,
          reviewHash: target.reviewHash,
          expectedTerminalReviewHash: target.reviewHash,
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a reordered chain", () => {
    const chain = buildChain([{}, {}, {}]);
    const reordered: ReviewRecord[] = [chain[1]!, chain[0]!, chain[2]!];
    const target = reordered[reordered.length - 1]!;
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain: reordered,
          reviewHash: target.reviewHash,
          expectedTerminalReviewHash: target.reviewHash,
        },
        currentSnapshot,
        0.8,
      ),
    ).toBe(false);
  });

  it("rejects a valid, fully verified record taken from a different candidate's chain", () => {
    const otherCandidateChain = buildChain([{ candidateId: "candidate-999" }]);
    const terminal = otherCandidateChain[otherCandidateChain.length - 1]!;

    // Every hash check passes: the chain verifies, it terminates where
    // expected, and the claimed record is genuinely present in it. It is
    // still rejected, because it belongs to "candidate-999", not the
    // "candidate-001" identified by `current`.
    expect(terminal.candidateId).toBe("candidate-999");
    expect(
      isProductionGradeIndependentReview(
        INDEPENDENT_GENERATOR,
        {
          chain: otherCandidateChain,
          reviewHash: terminal.reviewHash,
          expectedTerminalReviewHash: terminal.reviewHash,
        },
        currentSnapshot, // candidateId: "candidate-001"
        0.8,
      ),
    ).toBe(false);
  });
});
