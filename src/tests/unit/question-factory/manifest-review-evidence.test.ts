import { describe, expect, it } from "vitest";

import { normaliseIdentityOrThrow } from "@/features/question-factory/config";
import { appendReviewRecord, verifyReviewChain, type ReviewRecord } from "@/features/question-factory/provenance";
import {
  MANIFEST_SCHEMA_VERSION_CURRENT,
  MANIFEST_SCHEMA_VERSION_LEGACY,
  manifestSchemaVersionOf,
  validateManifestReviewEvidence,
  type RecoveredReviewEvidence,
} from "@/features/question-factory/publication";

/**
 * P0-B. Publication used to consume the candidate record — and with it
 * `provenance.reviewRecords` — leaving published content permanently
 * unauditable (`docs/reports/publication-288-posthoc-audit.md` §D2). These
 * tests pin the durable-evidence rules: what a post-P0-B manifest must
 * carry, what a pre-P0-B manifest must say about itself, and the structural
 * separation that stops rescued, unverifiable evidence ever being mistaken
 * for a tamper-evident chain.
 */

const CANDIDATE_ID = "man-p0b000000000000000000a";
const CONTENT_HASH = "a".repeat(64);
const BLUEPRINT_HASH = "b".repeat(64);
const REVISION = 2;

const REVIEWER = normaliseIdentityOrThrow("gpt-4o");

function chainRecord(contentHash = CONTENT_HASH, revision = REVISION, candidateId = CANDIDATE_ID): ReviewRecord {
  return appendReviewRecord([], {
    candidateId,
    stage: "semantic_review_passed",
    reviewerIdentity: REVIEWER,
    reviewerVersion: "1",
    result: "passed",
    confidence: 0.93,
    findings: ["Single defensible answer."],
    evidenceReferences: ["Stated directly in the stimulus."],
    ambiguityStatus: "none",
    reviewedAt: "2026-07-30T00:00:00.000Z",
    reviewPromptVersion: "v1",
    reviewPromptHash: "f".repeat(64),
    evidenceBinding: {
      candidateId,
      candidateRevision: revision,
      candidateContentHash: contentHash,
      blueprintHash: BLUEPRINT_HASH,
      reviewResultHash: "0".repeat(64),
      semanticClassification: "semantic_objective",
    },
  } as never);
}

function recovered(overrides: Partial<RecoveredReviewEvidence> = {}): RecoveredReviewEvidence {
  return {
    candidateId: CANDIDATE_ID,
    verifiability: "none",
    recoveredAt: "2026-07-30",
    sourceArtefact: "content/question-factory/reports/review-responses-depad-lang/rev5-x.json",
    recoveryCommit: "00c4fbf",
    reviewerModelDeclared: "claude-opus-4-8",
    reviewBoundContentHash: CONTENT_HASH,
    reviewBoundRevision: REVISION,
    ...overrides,
  };
}

const base = { candidateId: CANDIDATE_ID, contentHash: CONTENT_HASH, revision: REVISION };

describe("manifest review evidence — current-version manifests", () => {
  it("accepts a manifest whose chain re-verifies, and the chain still verifies from the manifest copy alone", () => {
    const reviewChain = [chainRecord()];
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      correctnessBasis: "independent_semantic_review",
      reviewChain,
    });

    expect(result.ok).toBe(true);
    // The point of persisting it: an auditor holding only the manifest can
    // still verify the chain, with no candidate record left anywhere.
    expect(verifyReviewChain(reviewChain).valid).toBe(true);
  });

  it("REJECTS a current-version publication whose correctness rests on semantic review but carries no chain", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      correctnessBasis: "independent_semantic_review",
      reviewChain: [],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.path === "reviewChain")).toBe(true);
  });

  it("accepts an EMPTY chain when correctness was established deterministically — numeracy must still be publishable", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      correctnessBasis: "deterministic",
      reviewChain: [],
    });

    expect(result.ok).toBe(true);
  });

  it("REJECTS a current-version manifest with no reviewChain field at all, even a deterministic one", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      correctnessBasis: "deterministic",
    });

    expect(result.ok).toBe(false);
  });

  it("REJECTS a current-version manifest that does not record how correctness was established", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      reviewChain: [chainRecord()],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.path === "correctnessBasis")).toBe(true);
  });

  it("REJECTS a current-version manifest that does not declare where its chain was rooted", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      correctnessBasis: "independent_semantic_review",
      reviewChain: [chainRecord()],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.path === "chainOrigin")).toBe(true);
  });

  it("REJECTS a tampered chain", () => {
    const record = chainRecord();
    const tampered = { ...record, confidence: 0.1 } as ReviewRecord;

    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      correctnessBasis: "independent_semantic_review",
      reviewChain: [tampered],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.message.includes("review_hash_mismatch"))).toBe(true);
  });

  it("REJECTS a chain containing another candidate's record", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "in_pipeline",
      correctnessBasis: "independent_semantic_review",
      reviewChain: [chainRecord(CONTENT_HASH, REVISION, "man-someoneelse00000000000")],
    });

    expect(result.ok).toBe(false);
  });
});

describe("manifest review evidence — retroactive chain anchor", () => {
  it("accepts a retroactive chain anchored to the published content hash and revision", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "retroactive_post_publication",
      correctnessBasis: "independent_semantic_review",
      reviewChain: [chainRecord(CONTENT_HASH, REVISION)],
    });

    expect(result.ok).toBe(true);
  });

  it.each([
    ["content hash", "9".repeat(64), REVISION],
    ["revision", CONTENT_HASH, 99],
  ])("REJECTS a retroactive chain anchored to the wrong %s", (_label, hash, revision) => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT,
      chainOrigin: "retroactive_post_publication",
      correctnessBasis: "independent_semantic_review",
      reviewChain: [chainRecord(hash as string, revision as number)],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.message.includes("anchored to the manifest's published"))).toBe(true);
  });
});

describe("manifest review evidence — legacy manifests", () => {
  it("treats a manifest with no version field as legacy", () => {
    expect(manifestSchemaVersionOf({})).toBe(MANIFEST_SCHEMA_VERSION_LEGACY);
    expect(manifestSchemaVersionOf({ manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_CURRENT })).toBe(
      MANIFEST_SCHEMA_VERSION_CURRENT,
    );
  });

  it("accepts a legacy manifest carrying recovered evidence", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY,
      recoveredEvidence: [recovered()],
    });

    expect(result.ok).toBe(true);
  });

  it("accepts a legacy manifest that explicitly declares nothing was recovered", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY,
      noChainRecovered: true,
    });

    expect(result.ok).toBe(true);
  });

  it("REJECTS a legacy manifest with neither a chain, nor recovered evidence, nor the explicit marker", () => {
    const result = validateManifestReviewEvidence({ ...base, manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.path === "recoveredEvidence")).toBe(true);
  });

  it("REJECTS a legacy manifest that both carries recovered evidence and claims none was recovered", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY,
      recoveredEvidence: [recovered()],
      noChainRecovered: true,
    });

    expect(result.ok).toBe(false);
  });
});

describe("manifest review evidence — recovered evidence is structurally not a chain", () => {
  it("REJECTS recovered evidence shaped like a chain record", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY,
      recoveredEvidence: [{ ...recovered(), reviewHash: "c".repeat(64), previousReviewHash: "genesis" } as never],
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues.some((entry) => entry.message.includes("never carry chain fields"))).toBe(true);
  });

  it("REJECTS recovered evidence that does not declare verifiability 'none'", () => {
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY,
      recoveredEvidence: [{ ...recovered(), verifiability: "verified" } as never],
    });

    expect(result.ok).toBe(false);
  });

  it.each([["recoveryCommit"], ["sourceArtefact"]])("REJECTS recovered evidence with no %s", (field) => {
    const record = { ...recovered(), [field]: "" } as never;
    const result = validateManifestReviewEvidence({
      ...base,
      manifestSchemaVersion: MANIFEST_SCHEMA_VERSION_LEGACY,
      recoveredEvidence: [record],
    });

    expect(result.ok).toBe(false);
  });

  it("recovered evidence is rejected outright if fed to verifyReviewChain", () => {
    // The structural separation, proven at the verifier itself: a rescued
    // envelope has no chain fields, so the chain walk fails immediately
    // rather than silently accepting it as evidence.
    const asChain = [recovered() as unknown as ReviewRecord];
    expect(verifyReviewChain(asChain).valid).toBe(false);
  });
});
