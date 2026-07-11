import { describe, expect, it } from "vitest";

import {
  applyTransition,
  canAdvanceToSemanticReviewPassed,
  decideGateFailureOutcome,
} from "@/features/question-factory/workflow";

describe("decideGateFailureOutcome", () => {
  it("routes uncertain results to quarantined regardless of revision budget", () => {
    expect(
      decideGateFailureOutcome({ severity: "uncertain", revisionCount: 0, maxRevisions: 2 }),
    ).toBe("quarantined");
    expect(
      decideGateFailureOutcome({ severity: "uncertain", revisionCount: 2, maxRevisions: 2 }),
    ).toBe("quarantined");
  });

  it("routes hard failures to rejected regardless of revision budget", () => {
    expect(
      decideGateFailureOutcome({ severity: "hard_fail", revisionCount: 0, maxRevisions: 2 }),
    ).toBe("rejected");
  });

  it("routes soft failures to needs_revision while budget remains", () => {
    expect(
      decideGateFailureOutcome({ severity: "soft_fail", revisionCount: 0, maxRevisions: 2 }),
    ).toBe("needs_revision");
    expect(
      decideGateFailureOutcome({ severity: "soft_fail", revisionCount: 1, maxRevisions: 2 }),
    ).toBe("needs_revision");
  });

  it("routes soft failures to rejected once the revision budget is exhausted", () => {
    expect(
      decideGateFailureOutcome({ severity: "soft_fail", revisionCount: 2, maxRevisions: 2 }),
    ).toBe("rejected");
  });
});

describe("canAdvanceToSemanticReviewPassed", () => {
  it("allows deterministically_computable candidates through regardless of reviewer evidence", () => {
    expect(
      canAdvanceToSemanticReviewPassed({
        semanticClassification: "deterministically_computable",
        hasIndependentReviewerRecordAtThreshold: false,
      }),
    ).toBe(true);
  });

  it("blocks semantic_objective candidates without independent-reviewer evidence", () => {
    expect(
      canAdvanceToSemanticReviewPassed({
        semanticClassification: "semantic_objective",
        hasIndependentReviewerRecordAtThreshold: false,
      }),
    ).toBe(false);
  });

  it("allows semantic_objective candidates with independent-reviewer evidence at threshold", () => {
    expect(
      canAdvanceToSemanticReviewPassed({
        semanticClassification: "semantic_objective",
        hasIndependentReviewerRecordAtThreshold: true,
      }),
    ).toBe(true);
  });

  it("blocks manual_review_writing candidates without independent-reviewer evidence", () => {
    expect(
      canAdvanceToSemanticReviewPassed({
        semanticClassification: "manual_review_writing",
        hasIndependentReviewerRecordAtThreshold: false,
      }),
    ).toBe(false);
  });

  it("allows manual_review_writing candidates with independent-reviewer evidence at threshold", () => {
    expect(
      canAdvanceToSemanticReviewPassed({
        semanticClassification: "manual_review_writing",
        hasIndependentReviewerRecordAtThreshold: true,
      }),
    ).toBe(true);
  });
});

describe("applyTransition", () => {
  const baseContext = { revisionCount: 0, maxRevisions: 2 };

  it("allows a legal transition that needs no extra gate context", () => {
    const result = applyTransition("blueprint_created", "generated", baseContext);
    expect(result).toEqual({ ok: true, from: "blueprint_created", to: "generated" });
  });

  it("rejects an illegal transition", () => {
    const result = applyTransition("blueprint_created", "published", baseContext);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("illegal_transition");
  });

  it("blocks needs_revision once the revision budget is exhausted", () => {
    const result = applyTransition("generated", "needs_revision", {
      revisionCount: 2,
      maxRevisions: 2,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("revision_limit_exhausted");
  });

  it("allows needs_revision while the revision budget remains", () => {
    const result = applyTransition("generated", "needs_revision", {
      revisionCount: 1,
      maxRevisions: 2,
    });
    expect(result.ok).toBe(true);
  });

  it("requires semanticReviewGate context to advance to semantic_review_passed", () => {
    const result = applyTransition("correctness_check_passed", "semantic_review_passed", baseContext);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("missing_semantic_review_gate_context");
  });

  it("blocks semantic_review_passed for semantic_objective candidates without independent evidence", () => {
    const result = applyTransition("correctness_check_passed", "semantic_review_passed", {
      ...baseContext,
      semanticReviewGate: {
        semanticClassification: "semantic_objective",
        hasIndependentReviewerRecordAtThreshold: false,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("semantic_review_requires_independent_evidence");
  });

  it("allows semantic_review_passed for semantic_objective candidates with independent evidence", () => {
    const result = applyTransition("correctness_check_passed", "semantic_review_passed", {
      ...baseContext,
      semanticReviewGate: {
        semanticClassification: "semantic_objective",
        hasIndependentReviewerRecordAtThreshold: true,
      },
    });
    expect(result.ok).toBe(true);
  });

  it("allows semantic_review_passed for deterministically_computable candidates with no reviewer evidence", () => {
    const result = applyTransition("correctness_check_passed", "semantic_review_passed", {
      ...baseContext,
      semanticReviewGate: {
        semanticClassification: "deterministically_computable",
        hasIndependentReviewerRecordAtThreshold: false,
      },
    });
    expect(result.ok).toBe(true);
  });
});
