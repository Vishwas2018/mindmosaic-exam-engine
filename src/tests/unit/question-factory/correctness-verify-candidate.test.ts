import { describe, expect, it } from "vitest";

import { checkAgainstProductionSchema } from "@/features/question-factory/validation";
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
