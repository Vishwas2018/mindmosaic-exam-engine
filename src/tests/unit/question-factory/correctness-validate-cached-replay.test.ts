import { describe, expect, it } from "vitest";

import type { StoredStructuralValidationReport } from "@/features/question-factory/validation";
import type { StoredCorrectnessVerificationReport } from "@/features/question-factory/correctness/orchestrate-correctness-verification";
import type { QuestionFactoryCandidate } from "@/features/question-factory/correctness/types";
import { validateCachedCorrectnessReplay } from "@/features/question-factory/correctness/validate-cached-replay";
import { verifyCandidateCorrectness } from "@/features/question-factory/correctness/verify-candidate-correctness";

import { additionQuestion, baseProvenance, passedStructuralEvidence, VERIFIED_AT } from "./correctness-fixtures";

/**
 * The verified bound-blueprint hash every fixture report is built under.
 * Since the Mission 3B blueprint remediation, a cached replay is only ever
 * validated under a context whose hash the orchestrator has already
 * resolved fail-closed from the real blueprint record — this constant
 * stands in for that verified value in these pure-function tests.
 */
const FIXTURE_BLUEPRINT_HASH = "verified-blueprint-hash-fixture-0001";

/** Builds a genuinely-passed candidate + its structural and correctness reports, exactly as a real pass through the two gates would leave them. */
function buildPassedReplayFixture(): {
  readonly candidate: QuestionFactoryCandidate;
  readonly structuralReport: StoredStructuralValidationReport;
  readonly correctnessReport: StoredCorrectnessVerificationReport;
  readonly context: { readonly blueprintHash: string };
} {
  const question = additionQuestion();
  const candidateId = question.id as string;
  const provenance = baseProvenance(question);
  const structuralEvidence = passedStructuralEvidence(question, provenance, { blueprintHash: FIXTURE_BLUEPRINT_HASH });
  const structuralReport: StoredStructuralValidationReport = {
    candidateId,
    result: { status: "passed", evidence: structuralEvidence },
  };

  const candidateBeforePass: QuestionFactoryCandidate = {
    candidateId,
    state: "structural_validation_passed",
    question,
    provenance,
  };
  const result = verifyCandidateCorrectness(candidateBeforePass, {
    verifiedAt: VERIFIED_AT,
    structuralEvidence,
    blueprintHash: FIXTURE_BLUEPRINT_HASH,
  });
  if (result.status !== "passed") throw new Error("fixture question must independently pass correctness verification");
  const correctnessReport: StoredCorrectnessVerificationReport = { candidateId, result };

  const candidate: QuestionFactoryCandidate = { ...candidateBeforePass, state: "correctness_check_passed" };
  return { candidate, structuralReport, correctnessReport, context: { blueprintHash: FIXTURE_BLUEPRINT_HASH } };
}

describe("validateCachedCorrectnessReplay — valid replay", () => {
  it("accepts a genuinely unmodified passed candidate with matching reports under a verified blueprint binding", () => {
    const { candidate, structuralReport, correctnessReport, context } = buildPassedReplayFixture();
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, correctnessReport, context);
    expect(outcome).toEqual({ ok: true });
  });
});

describe("validateCachedCorrectnessReplay — bound-blueprint fail-closed (Mission 3B remediation)", () => {
  it("rejects when no current blueprint hash is supplied at all — absent hashes never match, even when the stored evidence also has none", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.code)).toContain("blueprint_binding_unresolved");
      expect(outcome.issues.map((issue) => issue.path)).toContain("context.blueprintHash");
    }
  });

  it("rejects an empty-string blueprint hash — empty values are never treated as verified", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, correctnessReport, { blueprintHash: "" });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.code)).toContain("blueprint_binding_unresolved");
    }
  });

  it("rejects stored evidence that carries no blueprint hash even under a verified current binding", () => {
    const { candidate, structuralReport, correctnessReport, context } = buildPassedReplayFixture();
    const evidenceWithoutHash = { ...correctnessReport.result.evidence } as Record<string, unknown>;
    delete evidenceWithoutHash.blueprintHash;
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: { ...correctnessReport.result, evidence: evidenceWithoutHash as unknown as typeof correctnessReport.result.evidence },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, context);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.blueprintHash");
    }
  });
});

describe("validateCachedCorrectnessReplay — candidate-side mutation", () => {
  it("rejects when the candidate content hash no longer matches the stored evidence", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const mutatedCandidate: QuestionFactoryCandidate = {
      ...candidate,
      provenance: { ...(candidate.provenance as Record<string, unknown>), contentHash: "mutated-content-hash" },
    };
    const outcome = validateCachedCorrectnessReplay(mutatedCandidate, structuralReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("structuralReport.evidence.candidateContentHash");
      expect(paths).toContain("correctnessReport.evidence.candidateContentHash");
    }
  });

  it("rejects when the candidate revision no longer matches the stored evidence", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const mutatedCandidate: QuestionFactoryCandidate = {
      ...candidate,
      provenance: { ...(candidate.provenance as Record<string, unknown>), revision: 7 },
    };
    const outcome = validateCachedCorrectnessReplay(mutatedCandidate, structuralReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("structuralReport.evidence.candidateRevision");
      expect(paths).toContain("correctnessReport.evidence.candidateRevision");
    }
  });

  it("rejects when the candidate's current blueprint hash no longer matches the stored evidence", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, correctnessReport, {
      blueprintHash: "a-different-blueprint-hash",
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("structuralReport.evidence.blueprintHash");
      expect(paths).toContain("correctnessReport.evidence.blueprintHash");
    }
  });

  it("rejects when the candidate provenance no longer parses", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const brokenCandidate: QuestionFactoryCandidate = { ...candidate, provenance: { not: "valid provenance" } };
    const outcome = validateCachedCorrectnessReplay(brokenCandidate, structuralReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("candidate.provenance");
    }
  });

  it("rejects when the candidate is not actually stored as correctness_check_passed", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const wrongState: QuestionFactoryCandidate = { ...candidate, state: "structural_validation_passed" };
    const outcome = validateCachedCorrectnessReplay(wrongState, structuralReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("candidate.state");
    }
  });
});

describe("validateCachedCorrectnessReplay — structural report binding", () => {
  it("rejects when no structural report is supplied", () => {
    const { candidate, correctnessReport } = buildPassedReplayFixture();
    const outcome = validateCachedCorrectnessReplay(candidate, undefined, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.code)).toContain("missing_structural_evidence");
    }
  });

  it("rejects a stale structural report (non-passed outcome)", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const staleReport: StoredStructuralValidationReport = {
      ...structuralReport,
      result: { status: "failed", issues: [], evidence: { ...structuralReport.result.evidence, outcome: "failed" } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, staleReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.code)).toContain("stale_structural_evidence");
    }
  });

  it("rejects a tampered structural fingerprint (visible fields edited, fingerprint not recomputed)", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const tamperedReport: StoredStructuralValidationReport = {
      ...structuralReport,
      result: {
        status: "passed",
        evidence: { ...structuralReport.result.evidence, candidateRevision: 999 },
      },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, tamperedReport, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      const paths = outcome.issues.map((issue) => issue.path);
      expect(paths).toContain("structuralReport.evidence.validationFingerprint");
    }
  });

  it("rejects a structural report belonging to a different candidate id", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const wrongOwner: StoredStructuralValidationReport = { ...structuralReport, candidateId: "some-other-candidate" };
    const outcome = validateCachedCorrectnessReplay(candidate, wrongOwner, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("structuralReport.candidateId");
    }
  });

  it("rejects a structural report produced under a stale validator version", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const staleVersion: StoredStructuralValidationReport = {
      ...structuralReport,
      result: { status: "passed", evidence: { ...structuralReport.result.evidence, validatorVersion: "0" } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, staleVersion, correctnessReport, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.code)).toContain("stale_structural_evidence");
    }
  });
});

describe("validateCachedCorrectnessReplay — correctness report binding", () => {
  it("rejects when no correctness report is supplied", () => {
    const { candidate, structuralReport } = buildPassedReplayFixture();
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, undefined, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.code)).toContain("cached_replay_integrity_failure");
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport");
    }
  });

  it("rejects a correctness report belonging to a different candidate id", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    const wrongOwner: StoredCorrectnessVerificationReport = { ...correctnessReport, candidateId: "some-other-candidate" };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, wrongOwner, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.candidateId");
    }
  });

  it("rejects a mismatched correctness revision", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: { ...correctnessReport.result, evidence: { ...correctnessReport.result.evidence, candidateRevision: 42 } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.candidateRevision");
    }
  });

  it("rejects a mismatched correctness content hash", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: {
        ...correctnessReport.result,
        evidence: { ...correctnessReport.result.evidence, candidateContentHash: "tampered-hash" },
      },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.candidateContentHash");
    }
  });

  it("rejects a mismatched correctness blueprint hash", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: { ...correctnessReport.result, evidence: { ...correctnessReport.result.evidence, blueprintHash: "some-hash" } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.blueprintHash");
    }
  });

  it("rejects a mismatched verifier version", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: { ...correctnessReport.result, evidence: { ...correctnessReport.result.evidence, verifierVersion: "0" } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.verifierVersion");
    }
  });

  it("rejects a mismatched scorer version", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: { ...correctnessReport.result, evidence: { ...correctnessReport.result.evidence, scorerVersion: "0" } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.scorerVersion");
    }
  });

  it("rejects a tampered correctness fingerprint (visible fields edited, fingerprint not recomputed)", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const tampered: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: { ...correctnessReport.result, evidence: { ...correctnessReport.result.evidence, candidateRevision: 12345 } },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, tampered, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.verificationFingerprint");
    }
  });

  it("rejects when the correctness report's referenced structural fingerprint no longer matches the current structural report", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const mismatched: StoredCorrectnessVerificationReport = {
      ...correctnessReport,
      result: {
        ...correctnessReport.result,
        evidence: { ...correctnessReport.result.evidence, structuralEvidenceFingerprint: "stale-fingerprint" },
      },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, mismatched, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.evidence.structuralEvidenceFingerprint");
    }
  });

  it("rejects a stored report whose outcome is inconsistent with correctness_check_passed (failed)", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const inconsistent: StoredCorrectnessVerificationReport = {
      candidateId: correctnessReport.candidateId,
      result: {
        status: "failed",
        capability: "deterministically_verifiable",
        issues: [{ code: "declared_answer_mismatch", path: "answerKey", message: "simulated", severity: "error" }],
        evidence: { ...correctnessReport.result.evidence, outcome: "failed" },
      },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, inconsistent, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.result.status");
    }
  });

  it("rejects a stored report whose outcome is inconsistent with correctness_check_passed (quarantined/review_required)", () => {
    const { candidate, structuralReport, correctnessReport } = buildPassedReplayFixture();
    if (correctnessReport.result.status !== "passed") throw new Error("fixture must be passed");
    const inconsistent: StoredCorrectnessVerificationReport = {
      candidateId: correctnessReport.candidateId,
      result: {
        status: "review_required",
        capability: "structurally_scoreable_only",
        issues: [{ code: "unable_to_derive_answer", path: "question", message: "simulated", severity: "review_required" }],
        evidence: { ...correctnessReport.result.evidence, outcome: "review_required" },
      },
    };
    const outcome = validateCachedCorrectnessReplay(candidate, structuralReport, inconsistent, {});
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.issues.map((issue) => issue.path)).toContain("correctnessReport.result.status");
    }
  });
});
