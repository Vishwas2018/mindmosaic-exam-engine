import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { appendReviewRecord, type ReviewRecordDraft } from "@/features/question-factory/provenance";
import { AMC_ATTESTED_CONTENT_HASHES } from "@/features/question-factory/correctness/amc-content-bindings";
import { validateManifestReviewEvidence } from "@/features/question-factory/publication/manifest-schema";

// In-memory chain fixtures only. No manifest or attestation report is written.
const approval = JSON.parse(readFileSync("content/publication-approvals/roadmap-amc-y3-001.json", "utf8"));
const id = approval.questionId;
const contentHash = AMC_ATTESTED_CONTENT_HASHES[id];
const draft = (human: boolean): ReviewRecordDraft => ({ candidateId: id,
  stage: human ? "published" : "correctness_check_passed",
  reviewerIdentity: { provider: human ? "human" : "other", modelId: human ? approval.approvedBy : "mindmosaic-first-party-amc", modelFamily: human ? "human" : "mindmosaic", interactionMode: "external_manual" },
  reviewerVersion: "1", result: "passed", confidence: 1,
  findings: ["Test-only chain fixture"], evidenceReferences: [human ? approval.fingerprint : `cva-${"a".repeat(40)}`],
  ambiguityStatus: "none", reviewedAt: approval.approvedAt, reviewPromptVersion: "1", reviewPromptHash: "b".repeat(64),
  evidenceBinding: { candidateContentHash: contentHash, candidateRevision: 1, blueprintHash: "c".repeat(64), reviewResultHash: "d".repeat(64) },
});
const first = appendReviewRecord([], draft(false));
const human = appendReviewRecord([first], draft(true));
const base = { candidateId: id, contentHash, revision: 1, manifestSchemaVersion: 2,
  chainOrigin: "in_pipeline" as const, correctnessBasis: "deterministic" as const,
  question: approval.question, approvedBy: approval.approvedBy, humanApproval: approval };

describe("AMC manifests require both durable review stages", () => {
  it("accepts a bound first-party stage followed by a bound human stage", () => {
    expect(validateManifestReviewEvidence({ ...base, reviewChain: [first, human] }).ok).toBe(true);
  });
  it.each([[], [first], [appendReviewRecord([], draft(true))]])("refuses an empty or incomplete chain", (...records) => {
    const chain = records.flat();
    expect(validateManifestReviewEvidence({ ...base, reviewChain: chain }).ok).toBe(false);
  });
  it("refuses bare approvedBy even with two stage labels", () => {
    expect(validateManifestReviewEvidence({ ...base, humanApproval: undefined, reviewChain: [first, human] }).ok).toBe(false);
  });
  it("refuses stale candidate revision bindings", () => {
    expect(validateManifestReviewEvidence({ ...base, revision: 2, reviewChain: [first, human] }).ok).toBe(false);
  });
  it("refuses tampering with the human signature fingerprint", () => {
    expect(validateManifestReviewEvidence({ ...base, humanApproval: { ...approval, fingerprint: "0".repeat(64) }, reviewChain: [first, human] }).ok).toBe(false);
  });
});
