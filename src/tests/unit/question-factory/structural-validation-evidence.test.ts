import { describe, expect, it } from "vitest";

import { buildEvidence, computeStructuralValidationFingerprint } from "@/features/question-factory/validation/evidence";
import type { StructuralValidationIssue } from "@/features/question-factory/validation";

/**
 * Direct tests of the authoritative Mission 2B structural-fingerprint
 * algorithm: `buildEvidence` (fresh build) and
 * `computeStructuralValidationFingerprint` (recompute from an already-built
 * evidence record's own visible fields) must always agree — the second is
 * extracted from the first, not a parallel re-implementation — and must
 * react to exactly the fields the fingerprint is documented to cover.
 */
function baseInput(overrides: Partial<Parameters<typeof buildEvidence>[0]> = {}) {
  return {
    candidateId: "cand-001",
    candidateRevision: 0,
    candidateContentHash: "content-hash-abc",
    validatedAt: "2026-01-01T00:00:00.000Z",
    issues: [] as readonly StructuralValidationIssue[],
    ...overrides,
  };
}

describe("computeStructuralValidationFingerprint — agreement with buildEvidence", () => {
  it("recomputing from a fresh evidence record's own visible fields reproduces the same fingerprint", () => {
    const evidence = buildEvidence(baseInput());
    const recomputed = computeStructuralValidationFingerprint({
      candidateId: evidence.candidateId,
      candidateRevision: evidence.candidateRevision,
      candidateContentHash: evidence.candidateContentHash,
      blueprintHash: evidence.blueprintHash,
      validatorVersion: evidence.validatorVersion,
      schemaVersion: evidence.schemaVersion,
      taxonomyVersion: evidence.taxonomyVersion,
      checksPerformed: evidence.checksPerformed,
      issueSummary: evidence.issueSummary,
      outcome: evidence.outcome,
    });
    expect(recomputed).toBe(evidence.validationFingerprint);
  });

  it("is timestamp-independent: two builds with different validatedAt but identical facts fingerprint identically", () => {
    const a = buildEvidence(baseInput({ validatedAt: "2026-01-01T00:00:00.000Z" }));
    const b = buildEvidence(baseInput({ validatedAt: "2099-12-31T23:59:59.000Z" }));
    expect(a.validationFingerprint).toBe(b.validationFingerprint);
  });

  it("changes when candidate content hash changes", () => {
    const a = buildEvidence(baseInput());
    const b = buildEvidence(baseInput({ candidateContentHash: "different-hash" }));
    expect(a.validationFingerprint).not.toBe(b.validationFingerprint);
  });

  it("changes when the issue set (outcome) changes", () => {
    const a = buildEvidence(baseInput());
    const b = buildEvidence(
      baseInput({ issues: [{ code: "invalid_lifecycle_state", path: "state", message: "x", severity: "error" }] }),
    );
    expect(a.validationFingerprint).not.toBe(b.validationFingerprint);
    expect(a.outcome).toBe("passed");
    expect(b.outcome).toBe("failed");
  });

  it("changes when candidate revision changes", () => {
    const a = buildEvidence(baseInput());
    const b = buildEvidence(baseInput({ candidateRevision: 3 }));
    expect(a.validationFingerprint).not.toBe(b.validationFingerprint);
  });

  it("changes when blueprint hash changes", () => {
    const a = buildEvidence(baseInput({ blueprintHash: "bp-1" }));
    const b = buildEvidence(baseInput({ blueprintHash: "bp-2" }));
    expect(a.validationFingerprint).not.toBe(b.validationFingerprint);
  });

  it("detects a fingerprint that no longer matches its own record's visible fields (tampered/edited without recomputation)", () => {
    const evidence = buildEvidence(baseInput());
    // Simulate an edit to a visible field without recomputing the fingerprint.
    const tampered = { ...evidence, candidateRevision: evidence.candidateRevision + 1 };
    const recomputed = computeStructuralValidationFingerprint({
      candidateId: tampered.candidateId,
      candidateRevision: tampered.candidateRevision,
      candidateContentHash: tampered.candidateContentHash,
      blueprintHash: tampered.blueprintHash,
      validatorVersion: tampered.validatorVersion,
      schemaVersion: tampered.schemaVersion,
      taxonomyVersion: tampered.taxonomyVersion,
      checksPerformed: tampered.checksPerformed,
      issueSummary: tampered.issueSummary,
      outcome: tampered.outcome,
    });
    expect(recomputed).not.toBe(tampered.validationFingerprint);
  });

  it("issue-order behaviour: the fingerprint is stable regardless of the order issues were supplied in (deduplicated, sorted codes)", () => {
    const issuesA: readonly StructuralValidationIssue[] = [
      { code: "content_hash_mismatch", path: "a", message: "a", severity: "error" },
      { code: "invalid_candidate_id", path: "b", message: "b", severity: "error" },
    ];
    const issuesB: readonly StructuralValidationIssue[] = [
      { code: "invalid_candidate_id", path: "b", message: "b", severity: "error" },
      { code: "content_hash_mismatch", path: "a", message: "a", severity: "error" },
    ];
    const a = buildEvidence(baseInput({ issues: issuesA }));
    const b = buildEvidence(baseInput({ issues: issuesB }));
    expect(a.validationFingerprint).toBe(b.validationFingerprint);
  });
});
