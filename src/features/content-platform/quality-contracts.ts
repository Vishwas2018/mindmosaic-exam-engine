import { z } from "zod";
import { canonicalContentHash } from "./contracts";

export const ambiguityStatusSchema = z.enum([
  "clear", "alternative_valid_answer", "wording_ambiguous", "insufficient_information", "human_review_required",
]);
export const explanationQualitySchema = z.enum([
  "good", "correct_but_weak", "incorrect", "misleading", "too_complex", "human_review_required",
]);
export const visualSemanticStatusSchema = z.enum([
  "supported", "insufficient_visual_information", "visual_answer_conflict", "visual_ambiguity", "missing_visible_element", "answer_leakage", "human_review_required",
]);
export const assessmentFitSchema = z.enum([
  "appropriate", "probably_appropriate", "too_easy", "too_difficult", "curriculum_mismatch", "assessment_style_mismatch", "human_review_required",
]);
export const comparisonOutcomeSchema = z.enum(["pass", "revision_required", "human_required", "reject"]);

const conciseEvidenceSchema = z.string().trim().min(1).max(800);

export const blindSolveResultSchema = z.object({
  candidateContentHash: z.string().regex(/^[a-f0-9]{64}$/),
  reviewerKind: z.enum(["ai_codex", "ai_claude"]),
  reviewerId: z.string().min(1).max(160),
  expectedAnswer: z.unknown(),
  uniquelyDefensible: z.boolean(),
  sufficientInformation: z.boolean(),
  ambiguityStatus: ambiguityStatusSchema,
  ambiguityEvidence: z.array(conciseEvidenceSchema).max(12),
  proposedRemediation: conciseEvidenceSchema.optional(),
  visualStatus: visualSemanticStatusSchema,
  visualEvidence: z.array(conciseEvidenceSchema).max(12),
  assessmentFit: assessmentFitSchema,
  assessmentFitEvidence: z.array(conciseEvidenceSchema).max(12),
  australianEnglishIssues: z.array(conciseEvidenceSchema).max(12),
}).strict().superRefine((result, context) => {
  if (result.ambiguityStatus !== "clear" && !result.proposedRemediation) {
    context.addIssue({ code: "custom", path: ["proposedRemediation"], message: "Non-clear ambiguity requires a proposed remediation." });
  }
  if (result.ambiguityStatus === "clear" && (!result.uniquelyDefensible || !result.sufficientInformation)) {
    context.addIssue({ code: "custom", path: ["ambiguityStatus"], message: "A clear item must be sufficient and uniquely defensible." });
  }
});

export const comparisonReviewResultSchema = z.object({
  candidateContentHash: z.string().regex(/^[a-f0-9]{64}$/),
  blindSolveHash: z.string().regex(/^[a-f0-9]{64}$/),
  declaredAnswerAgreement: z.boolean(),
  answerComparisonEvidence: z.array(conciseEvidenceSchema).min(1).max(12),
  explanationQuality: explanationQualitySchema,
  explanationEvidence: z.array(conciseEvidenceSchema).min(1).max(12),
  outcome: comparisonOutcomeSchema,
  issueCodes: z.array(z.string().regex(/^[a-z0-9_]+$/)).max(40),
}).strict().superRefine((result, context) => {
  const mustBlock = !result.declaredAnswerAgreement || result.explanationQuality !== "good";
  if (mustBlock && result.outcome === "pass") {
    context.addIssue({ code: "custom", path: ["outcome"], message: "Answer disagreement or inadequate explanation cannot pass." });
  }
});

export type BlindSolveResult = z.infer<typeof blindSolveResultSchema>;
export type ComparisonReviewResult = z.infer<typeof comparisonReviewResultSchema>;

export function qualityEvidenceAllowsAutomaticApproval(blind: BlindSolveResult, comparison: ComparisonReviewResult): boolean {
  return blind.candidateContentHash === comparison.candidateContentHash &&
    comparison.blindSolveHash === canonicalContentHash(blind) &&
    blind.ambiguityStatus === "clear" && blind.uniquelyDefensible && blind.sufficientInformation &&
    blind.visualStatus === "supported" && blind.assessmentFit === "appropriate" &&
    blind.australianEnglishIssues.length === 0 && comparison.declaredAnswerAgreement &&
    comparison.explanationQuality === "good" && comparison.outcome === "pass";
}
