import type { CanonicalQuestionRevision, IndependentReview } from "./contracts";
import { riskAssessmentSchema } from "./contracts";
import type { BlindSolveResult, ComparisonReviewResult } from "./quality-contracts";

export interface GateSummary { hardGateFailures: readonly string[]; riskSignals: readonly string[] }

export function classifyPublicationRisk(question: CanonicalQuestionRevision, gates: GateSummary, review: IndependentReview, quality?: { blind: BlindSolveResult; comparison: ComparisonReviewResult }) {
  const signals = new Set(gates.riskSignals);
  if (question.question.type === "essay") signals.add("writing_task");
  if (question.question.stimulus?.body) signals.add("reading_stimulus");
  if (["hotspot", "drag_drop", "label_diagram"].includes(question.question.type)) signals.add("complex_interaction");
  if (!review.suppliedAnswerAgreement) signals.add("reviewer_answer_disagreement");
  if (review.decision !== "pass") signals.add(`review_${review.decision}`);
  if (gates.hardGateFailures.length) signals.add("hard_gate_failure");
  if (quality) {
    if (quality.blind.ambiguityStatus !== "clear") signals.add(`ambiguity_${quality.blind.ambiguityStatus}`);
    if (quality.blind.visualStatus !== "supported") signals.add(`visual_${quality.blind.visualStatus}`);
    if (quality.blind.assessmentFit !== "appropriate") signals.add(`assessment_fit_${quality.blind.assessmentFit}`);
    if (quality.blind.australianEnglishIssues.length) signals.add("australian_english_issue");
    if (quality.comparison.explanationQuality !== "good") signals.add(`explanation_${quality.comparison.explanationQuality}`);
    if (!quality.comparison.declaredAnswerAgreement) signals.add("reviewer_answer_disagreement");
  }
  const high = [...signals].some((signal) => [
    "writing_task", "reading_stimulus", "complex_interaction", "reviewer_answer_disagreement", "hard_gate_failure",
  ].includes(signal) || signal.startsWith("ambiguity_") || signal.startsWith("visual_") ||
    signal.startsWith("explanation_") || signal.startsWith("assessment_fit_"));
  return riskAssessmentSchema.parse({
    level: high ? "high" : signals.size ? "elevated" : "low",
    signals: [...signals].sort(),
    requiresIndividualOwnerReview: high,
  });
}

export function ownerQaSampleSize(batchSize: number): number {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error("batchSize must be a positive integer");
  return Math.min(batchSize, Math.max(5, Math.ceil(batchSize * 0.1)));
}

export function batchApprovalAllowed(input: { hardGateFailures: number; unresolvedRisks: number; reviewPasses: number; itemCount: number; sampled: number; sampleFailures: number }): boolean {
  return input.itemCount > 0 && input.hardGateFailures === 0 && input.unresolvedRisks === 0 &&
    input.reviewPasses === input.itemCount && input.sampled >= ownerQaSampleSize(input.itemCount) && input.sampleFailures === 0;
}
