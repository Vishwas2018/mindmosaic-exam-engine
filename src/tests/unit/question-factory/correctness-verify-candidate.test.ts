import { describe, expect, it } from "vitest";

import { checkAgainstProductionSchema } from "@/features/question-factory/validation";
import { buildEvidence } from "@/features/question-factory/validation/evidence";
import type { CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";

import {
  isUnsupportedInteractionCategory,
  verifyCandidateCorrectness,
} from "@/features/question-factory/correctness/verify-candidate-correctness";

import {
  additionQuestion,
  ambiguousChartTieQuestion,
  buildCorrectnessFixture,
  divisionByZeroPromptQuestion,
  dragDropQuestion,
  explanationContradictionQuestion,
  fractionModelFillBlankQuestion,
  manualAnswerKeyQuestion,
  moneyTotalQuestion,
  multipleChoiceArithmeticQuestion,
  perimeterQuestion,
  readingComprehensionQuestion,
  underspecifiedPromptQuestion,
  unsupportedHotspotQuestion,
  VERIFIED_AT,
  wrongDeclaredAnswerQuestion,
} from "./correctness-fixtures";

describe("verifyCandidateCorrectness — deterministic pass", () => {
  it("passes an integer-addition number_entry candidate", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
    expect(result.evidence.capability).toBe("deterministically_verifiable");
    expect(result.evidence.outcome).toBe("passed");
  });

  it("passes a multiple-choice arithmetic candidate", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(multipleChoiceArithmeticQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
  });

  it("passes a money-total candidate derived from a price-list table", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(moneyTotalQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
  });

  it("passes a perimeter candidate", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(perimeterQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
  });

  it("passes a fraction-model fill-blank candidate", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(fractionModelFillBlankQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
  });

  it("is deterministic: two runs against the same inputs produce the same verificationFingerprint", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const first = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    const second = verifyCandidateCorrectness(candidate, { verifiedAt: "2030-05-01T00:00:00.000Z", structuralEvidence });
    expect(first.evidence.verificationFingerprint).toBe(second.evidence.verificationFingerprint);
  });
});

describe("verifyCandidateCorrectness — deterministic failure", () => {
  it("fails a candidate whose declared answer disagrees with the independently derived value", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(wrongDeclaredAnswerQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.capability).toBe("deterministically_verifiable");
      expect(result.issues.map((issue) => issue.code)).toContain("declared_answer_mismatch");
    }
  });

  it("fails a candidate whose explanation contradicts the verified numeric answer", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(explanationContradictionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.issues.map((issue) => issue.code)).toContain("explanation_contradiction");
    }
  });

  it("fails closed on a division-by-zero prompt rather than producing NaN/Infinity", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(divisionByZeroPromptQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("review_required");
    if (result.status === "review_required") {
      expect(result.issues.map((issue) => issue.code)).toContain("division_by_zero");
    }
  });

  /**
   * `hotspot` and `drag_drop` cannot currently reach `verifyCandidateCorrectness`
   * end-to-end at all — the shared `candidateQuestionSchema` this gate reuses
   * (the same trust boundary `validateCandidateStructure` already enforces)
   * does not accept those types today, so a candidate of either type can
   * never reach `structural_validation_passed` in the first place. These two
   * tests exercise the classification predicate directly against a real
   * `Question` (built the same way `derive-answer.test.ts` does) instead —
   * see `isUnsupportedInteractionCategory`'s doc comment for the full
   * reachability note, and the Mission 2C report's "confirmed gaps" section.
   */
  it("classifies hotspot as an unsupported correctness category", () => {
    const outcome = checkAgainstProductionSchema(unsupportedHotspotQuestion() as unknown as CandidateQuestion);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(isUnsupportedInteractionCategory(outcome.question)).toBe(true);
  });

  it("classifies drag_drop as an unsupported correctness category", () => {
    const outcome = checkAgainstProductionSchema(dragDropQuestion() as unknown as CandidateQuestion);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(isUnsupportedInteractionCategory(outcome.question)).toBe(true);
  });

  it("does not classify an ordinary numeric question as unsupported", () => {
    const outcome = checkAgainstProductionSchema(additionQuestion() as unknown as CandidateQuestion);
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(isUnsupportedInteractionCategory(outcome.question)).toBe(false);
  });
});

describe("verifyCandidateCorrectness — review-required", () => {
  it("routes a genuine tie at a chart extreme to review_required, never a fabricated pass", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(ambiguousChartTieQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("review_required");
    if (result.status === "review_required") expect(result.capability).toBe("structurally_scoreable_only");
  });

  it("routes an under-specified word problem to review_required rather than guessing", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(underspecifiedPromptQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("review_required");
    if (result.status === "review_required") expect(result.capability).toBe("structurally_scoreable_only");
  });

  it("routes reading comprehension to requires_independent_semantic_review, never passed", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(readingComprehensionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("review_required");
    if (result.status === "review_required") {
      expect(result.capability).toBe("requires_independent_semantic_review");
      expect(result.issues.map((issue) => issue.code)).toContain("semantic_review_required");
    }
  });

  it("routes a manual (rubric-marked) answer key to requires_independent_semantic_review, never passed", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(manualAnswerKeyQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("review_required");
    if (result.status === "review_required") expect(result.capability).toBe("requires_independent_semantic_review");
  });
});

describe("verifyCandidateCorrectness — structural-evidence binding", () => {
  it("fails closed when no structural evidence is supplied", () => {
    const { candidate } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.capability).toBe("unsupported");
      expect(result.issues.map((issue) => issue.code)).toContain("missing_structural_evidence");
    }
  });

  it("fails closed when the structural evidence outcome is not 'passed'", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { outcome: "failed" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
  });

  it("fails closed when the structural evidence belongs to a different candidate", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { candidateId: "some-other-candidate" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
  });

  it("fails closed on a candidate revision mismatch", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { candidateRevision: 7 },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
  });

  it("fails closed on a candidate content-hash mismatch", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { candidateContentHash: "stale-hash-from-a-prior-revision" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
  });

  it("fails closed on a blueprint-hash mismatch", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { blueprintHash: "some-other-blueprint-hash" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
  });

  it("fails closed when structural evidence was produced under a stale schema/taxonomy/validator version", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { schemaVersion: "0" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") expect(result.issues.map((issue) => issue.code)).toContain("stale_structural_evidence");
  });

  it("the verification fingerprint excludes verifiedAt", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const a = verifyCandidateCorrectness(candidate, { verifiedAt: "2026-01-01T00:00:00.000Z", structuralEvidence });
    const b = verifyCandidateCorrectness(candidate, { verifiedAt: "2099-12-31T00:00:00.000Z", structuralEvidence });
    expect(a.evidence.verificationFingerprint).toBe(b.evidence.verificationFingerprint);
    expect(a.evidence.verifiedAt).not.toBe(b.evidence.verifiedAt);
  });
});

/**
 * Mission 2C stabilisation: `verifyCandidateCorrectness` previously trusted
 * every visible field of `context.structuralEvidence` individually but never
 * recomputed and compared `validationFingerprint` itself — so a report whose
 * visible fields were edited without a corresponding fingerprint update (or
 * whose fingerprint was hand-edited directly) could still bind and let
 * derivation/scoring proceed. These tests exercise the fix: the fresh path
 * now reconstructs the canonical fingerprint input from the stored
 * structural report (via `computeStructuralValidationFingerprint`, the same
 * authoritative algorithm the structural gate itself used to mint it) and
 * refuses to derive, score, or pass on any mismatch.
 */
describe("verifyCandidateCorrectness — structural fingerprint integrity", () => {
  it("passes with a genuinely fresh, untampered structural fingerprint", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion());
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
  });

  it("flags an altered structural issue summary left behind a stale fingerprint", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: {
        issueSummary: { errorCount: 2, codes: ["invalid_prompt", "invalid_marks"] },
      },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.capability).toBe("unsupported");
      expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
      expect(result.issues.map((issue) => issue.path)).toContain("structuralEvidence.validationFingerprint");
      expect(result.evidence.derivedAnswer).toBeUndefined();
    }
  });

  it("flags an outcome flipped from failed to passed after the fact, even though the visible outcome field now reads 'passed'", () => {
    const question = additionQuestion();
    const { candidate } = buildCorrectnessFixture(question);
    const provenance = candidate.provenance as Record<string, unknown>;
    // A genuinely failed structural run (real issues, real fingerprint)...
    const genuinelyFailed = buildEvidence({
      candidateId: provenance.candidateId as string,
      candidateRevision: provenance.revision as number,
      candidateContentHash: provenance.contentHash as string,
      validatedAt: "2026-01-15T00:00:00.000Z",
      issues: [{ code: "invalid_prompt", path: "question.prompt", message: "simulated", severity: "error" }],
    });
    // ...tampered afterward: outcome flipped to 'passed', stale fingerprint left in place.
    const structuralEvidence = { ...genuinelyFailed, outcome: "passed" as const };
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.capability).toBe("unsupported");
      expect(result.issues.map((issue) => issue.code)).toContain("structural_evidence_mismatch");
      expect(result.issues.map((issue) => issue.path)).toContain("structuralEvidence.validationFingerprint");
    }
  });

  it("flags an altered visible candidate binding (blueprint hash) alongside the recomputed-fingerprint mismatch it produces", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { blueprintHash: "a-tampered-blueprint-hash" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      const paths = result.issues.map((issue) => issue.path);
      expect(paths).toContain("structuralEvidence.blueprintHash");
      expect(paths).toContain("structuralEvidence.validationFingerprint");
    }
  });

  it("flags an altered version field (taxonomyVersion) alongside the recomputed-fingerprint mismatch it produces", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { taxonomyVersion: "0" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      const codes = result.issues.map((issue) => issue.code);
      expect(codes).toContain("stale_structural_evidence");
      expect(codes).toContain("structural_evidence_mismatch");
      expect(result.issues.map((issue) => issue.path)).toContain("structuralEvidence.validationFingerprint");
    }
  });

  it("flags a directly hand-edited stored fingerprint even though every other visible field still matches exactly", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { validationFingerprint: "hand-edited-fingerprint-value" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.capability).toBe("unsupported");
      expect(result.issues).toEqual([
        {
          code: "structural_evidence_mismatch",
          path: "structuralEvidence.validationFingerprint",
          message:
            "Recomputed structural-validation fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with.",
          severity: "error",
        },
      ]);
      expect(result.evidence.derivedAnswer).toBeUndefined();
      expect(result.evidence.declaredScoring).toBeUndefined();
    }
  });

  it("is unaffected by a differing structural validatedAt timestamp (replay-safety is preserved)", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { validatedAt: "2000-01-01T00:00:00.000Z" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).toBe("passed");
  });

  it("performs no derivation, scoring, or pass on a fingerprint mismatch", () => {
    const { candidate, structuralEvidence } = buildCorrectnessFixture(additionQuestion(), {
      structuralEvidenceOverrides: { validationFingerprint: "hand-edited-fingerprint-value" },
    });
    const result = verifyCandidateCorrectness(candidate, { verifiedAt: VERIFIED_AT, structuralEvidence });
    expect(result.status).not.toBe("passed");
    expect(result.evidence.derivedAnswer).toBeUndefined();
    expect(result.evidence.derivedScoring).toBeUndefined();
    expect(result.evidence.declaredAnswer).toBeUndefined();
    expect(result.evidence.declaredScoring).toBeUndefined();
  });
});
