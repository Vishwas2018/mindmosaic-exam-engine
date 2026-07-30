import { describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { buildCorrectnessReportId } from "@/features/question-factory/correctness";
import { buildDifficultyReportId } from "@/features/question-factory/difficulty";
import { verifyUpstreamGateChain } from "@/features/question-factory/gate-chain";
import { buildOriginalityReportId } from "@/features/question-factory/originality";
import { appendReviewRecord, type ReviewRecord } from "@/features/question-factory/provenance";
import type { FactoryCompartment, FactoryRepository } from "@/features/question-factory/storage";
import { buildStructuralValidationReportId } from "@/features/question-factory/validation";

/**
 * P0-A regression suite. The 2026-07-30 post-hoc audit
 * (`docs/reports/publication-288-posthoc-audit.md`) found that 132 of 288
 * published questions carried a correctness report with status
 * `review_required` — the gate stating it could not establish correctness
 * and that independent semantic review was required — with no such review
 * anywhere, because neither `orchestrateStaging` nor
 * `checkPublicationEligibility` ever read the correctness report at all.
 *
 * These tests pin the two properties the owner required: such a candidate is
 * provably unstageable AND unpublishable. They also pin the property that
 * makes the fix correct rather than merely strict — a `review_required`
 * candidate that *does* carry genuine independent semantic review still
 * advances, because otherwise every reading and language-conventions
 * question would be permanently blocked (see
 * `orchestrate-correctness-verification.ts`'s `passed_pending_semantic_review`
 * contract).
 */

const CANDIDATE_ID = "man-p0a000000000000000000a";
const CONTENT_HASH = "a".repeat(64);
const BLUEPRINT_HASH = "b".repeat(64);
const REVISION = 0;

const GENERATOR_IDENTITY = normaliseIdentityOrThrow("claude-sonnet-5");
const INDEPENDENT_REVIEWER = normaliseIdentityOrThrow("gpt-4o");
const SAME_FAMILY_REVIEWER = normaliseIdentityOrThrow("claude-opus-4-8");

function boundEvidence(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    candidateId: CANDIDATE_ID,
    candidateRevision: REVISION,
    candidateContentHash: CONTENT_HASH,
    blueprintHash: BLUEPRINT_HASH,
    ...extra,
  };
}

/**
 * Minimal in-memory `reports` view. Only `read` is exercised by
 * `verifyUpstreamGateChain`; every other member throws so an accidental
 * write from the verifier would fail the test loudly rather than pass
 * silently (the verifier must stay read-only).
 */
function reportRepository(reports: Record<string, unknown>): FactoryRepository {
  const unexpected = (member: string) => () => {
    throw new Error(`gate-chain verification must not call repository.${member}`);
  };
  return {
    read: (compartment: FactoryCompartment, candidateId: string) => {
      if (compartment !== "reports") throw new Error(`unexpected compartment '${compartment}'`);
      return Promise.resolve(reports[candidateId]);
    },
    create: unexpected("create"),
    exists: unexpected("exists"),
    remove: unexpected("remove"),
    list: unexpected("list"),
    move: unexpected("move"),
    update: unexpected("update"),
  } as unknown as FactoryRepository;
}

function passingReports(correctness: unknown): Record<string, unknown> {
  return {
    [buildStructuralValidationReportId(CANDIDATE_ID)]: {
      candidateId: CANDIDATE_ID,
      result: { status: "passed", evidence: boundEvidence({ validationFingerprint: "c".repeat(64) }) },
    },
    [buildCorrectnessReportId(CANDIDATE_ID)]: correctness,
    [buildOriginalityReportId(CANDIDATE_ID)]: {
      candidateId: CANDIDATE_ID,
      result: { status: "passed", evidence: boundEvidence({ originalityFingerprint: "d".repeat(64) }) },
    },
    [buildDifficultyReportId(CANDIDATE_ID)]: {
      candidateId: CANDIDATE_ID,
      result: { status: "passed", evidence: boundEvidence({ difficultyFingerprint: "e".repeat(64) }) },
    },
  };
}

const DETERMINISTIC_CORRECTNESS = {
  candidateId: CANDIDATE_ID,
  result: { status: "passed", capability: "deterministically_verifiable", evidence: boundEvidence({ outcome: "passed" }) },
};

/** Exactly the shape the audit found on 132 published questions. */
const REVIEW_REQUIRED_CORRECTNESS = {
  candidateId: CANDIDATE_ID,
  result: {
    status: "review_required",
    capability: "requires_independent_semantic_review",
    evidence: boundEvidence({ outcome: "review_required" }),
    issues: [
      {
        code: "semantic_review_required",
        path: "question.type",
        message: "Question type requires independent semantic review; deterministic correctness cannot be established.",
        severity: "review_required",
      },
    ],
  },
};

/** A real chain built through `appendReviewRecord`, never hand-filled hashes. */
function semanticChain(
  reviewerIdentity: typeof INDEPENDENT_REVIEWER,
  confidence = 0.95,
  boundContentHash: string = CONTENT_HASH,
): readonly ReviewRecord[] {
  const record = appendReviewRecord([], {
    candidateId: CANDIDATE_ID,
    stage: "semantic_review_passed",
    reviewerIdentity,
    reviewerVersion: "1",
    result: "passed",
    confidence,
    findings: ["Single defensible answer grounded in the stimulus."],
    evidenceReferences: ["The text states the ranger reminded everyone to stay on the marked track."],
    ambiguityStatus: "none",
    reviewedAt: "2026-01-01T00:00:02.000Z",
    reviewPromptVersion: "v1",
    reviewPromptHash: "f".repeat(64),
    evidenceBinding: {
      candidateId: CANDIDATE_ID,
      candidateRevision: REVISION,
      candidateContentHash: boundContentHash,
      blueprintHash: BLUEPRINT_HASH,
      reviewResultHash: "0".repeat(64),
      semanticClassification: "semantic_objective",
    },
  } as never);
  return [record];
}

function provenance(reviewRecords: readonly ReviewRecord[]): never {
  return {
    candidateId: CANDIDATE_ID,
    blueprintId: "bp-p0a",
    batchId: "batch-p0a",
    pipelineRunId: "run-p0a",
    revision: REVISION,
    generatedAt: "2026-01-01T00:00:00.000Z",
    generatorAdapter: { class: "manual_external", identity: GENERATOR_IDENTITY },
    generatorVersion: "1",
    promptVersion: "v1",
    schemaVersion: "1",
    taxonomyVersion: "1",
    contentHash: CONTENT_HASH,
    reviewRecords,
  } as never;
}

describe("verifyUpstreamGateChain — P0-A: review_required correctness", () => {
  it("REFUSES a review_required-correctness candidate with an empty review chain (the exact shape of the audited 132)", async () => {
    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance([]) },
      reportRepository(passingReports(REVIEW_REQUIRED_CORRECTNESS)),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    const semantic = result.failures.filter((failure) => failure.gate === "semantic");
    expect(semantic).toHaveLength(1);
    expect(semantic[0]!.path).toBe("provenance.reviewRecords");
    expect(semantic[0]!.message).toContain("independent semantic review is required");
  });

  it("REFUSES when the only semantic review comes from the generator's own model family (self-supplied review)", async () => {
    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance(semanticChain(SAME_FAMILY_REVIEWER)) },
      reportRepository(passingReports(REVIEW_REQUIRED_CORRECTNESS)),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures.some((failure) => failure.gate === "semantic")).toBe(true);
  });

  it("REFUSES when the semantic review is bound to a stale content hash", async () => {
    const result = await verifyUpstreamGateChain(
      {
        candidateId: CANDIDATE_ID,
        provenance: provenance(semanticChain(INDEPENDENT_REVIEWER, 0.95, "9".repeat(64))),
      },
      reportRepository(passingReports(REVIEW_REQUIRED_CORRECTNESS)),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures.some((failure) => failure.gate === "semantic")).toBe(true);
  });

  it("ACCEPTS a review_required candidate carrying genuine independent semantic review — the pipeline must not be bricked for reading/language content", async () => {
    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance(semanticChain(INDEPENDENT_REVIEWER)) },
      reportRepository(passingReports(REVIEW_REQUIRED_CORRECTNESS)),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.correctnessEstablishedBySemanticReview).toBe(true);
  });
});

describe("verifyUpstreamGateChain — P0-A: every gate is actually read", () => {
  it("ACCEPTS a deterministically-verifiable candidate with no semantic review at all", async () => {
    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance([]) },
      reportRepository(passingReports(DETERMINISTIC_CORRECTNESS)),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.correctnessEstablishedBySemanticReview).toBe(false);
    expect(result.originalityFingerprint).toBe("d".repeat(64));
    expect(result.difficultyFingerprint).toBe("e".repeat(64));
  });

  it.each([
    ["structural", buildStructuralValidationReportId(CANDIDATE_ID)],
    ["correctness", buildCorrectnessReportId(CANDIDATE_ID)],
    ["originality", buildOriginalityReportId(CANDIDATE_ID)],
    ["difficulty", buildDifficultyReportId(CANDIDATE_ID)],
  ])("REFUSES when the %s report is missing entirely", async (gate, reportId) => {
    const reports = passingReports(DETERMINISTIC_CORRECTNESS);
    delete reports[reportId];

    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance([]) },
      reportRepository(reports),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures.some((failure) => failure.gate === gate)).toBe(true);
  });

  it("REFUSES a failed structural report even when every later gate passed (state is never a proxy)", async () => {
    const reports = passingReports(DETERMINISTIC_CORRECTNESS);
    reports[buildStructuralValidationReportId(CANDIDATE_ID)] = {
      candidateId: CANDIDATE_ID,
      result: { status: "failed", evidence: boundEvidence({ validationFingerprint: "c".repeat(64) }) },
    };

    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance([]) },
      reportRepository(reports),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.failures.some((failure) => failure.gate === "structural")).toBe(true);
  });

  it.each([
    ["content hash", { candidateContentHash: "7".repeat(64) }],
    ["revision", { candidateRevision: 99 }],
  ])("REFUSES when difficulty evidence is bound to a different %s", async (_label, drift) => {
    const reports = passingReports(DETERMINISTIC_CORRECTNESS);
    reports[buildDifficultyReportId(CANDIDATE_ID)] = {
      candidateId: CANDIDATE_ID,
      result: { status: "passed", evidence: { ...boundEvidence({ difficultyFingerprint: "e".repeat(64) }), ...drift } },
    };

    const result = await verifyUpstreamGateChain(
      { candidateId: CANDIDATE_ID, provenance: provenance([]) },
      reportRepository(reports),
    );

    expect(result.ok).toBe(false);
  });
});
