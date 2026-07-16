/**
 * The single pure entry point for difficulty verification. Deterministic
 * and side-effect free — no I/O, no wall-clock reads (`context.validatedAt`
 * is supplied by the caller), no randomness. Never performs correctness
 * verification, semantic AI review, originality comparison, staging, or
 * publication. Never trusts `candidate.question.metadata.difficulty` (the
 * author's own claim) — `context.declaredDifficulty` is always the
 * orchestrator's already-resolved bound-blueprint value; see the Mission
 * 3D plan §4b.
 *
 * Reuses the exact trust-boundary re-parse every other gate in this
 * pipeline already performs (`parseCandidateProvenance`,
 * `parseCandidateQuestion`) rather than re-declaring a second parse of
 * the same untrusted `candidate.provenance`/`candidate.question` blobs.
 */
import { FACTORY_THRESHOLDS } from "../config";
import { parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { computeDifficultyDeviation, estimateDifficulty } from "./estimate-difficulty";
import { boundMessage, buildDifficultyEvidence } from "./evidence";
import type { DifficultyIssue, DifficultyIssueCode, DifficultyResult, DifficultyVerificationContext, QuestionFactoryCandidate } from "./types";

function issue(code: DifficultyIssueCode, path: string, message: string): DifficultyIssue {
  return { code, path, message: boundMessage(message).message, severity: "error" };
}

export function verifyCandidateDifficulty(
  candidate: QuestionFactoryCandidate,
  context: DifficultyVerificationContext,
): DifficultyResult {
  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  const questionOutcome = parseCandidateQuestion(candidate.question);

  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    // Defensive: a candidate this far into the pipeline has already passed
    // structural validation's own re-parse of the same blobs. Per the
    // governance principle every gate in this mission follows — "cannot
    // compute" always routes to quarantined, never passed.
    const evidence = buildDifficultyEvidence({
      candidateId: candidate.candidateId,
      candidateRevision: 0,
      candidateContentHash: "",
      blueprintHash: context.blueprintHash,
      declaredDifficulty: context.declaredDifficulty,
      estimatedDifficulty: context.declaredDifficulty,
      estimateConfidence: 0,
      deviation: 0,
      signals: { wordCount: 0, readingLoadScore: 0, vocabularyComplexityScore: 0, reasoningStepScore: 0 },
      validatedAt: context.validatedAt,
      issues: [issue("difficulty_estimation_failed", "candidate", "Candidate provenance or question no longer parses against its trust-boundary schema; difficulty cannot be estimated.")],
      outcome: "quarantined",
    });
    return { status: "quarantined", outcome: "insufficient_evidence", issues: [...evidence.issues], evidence };
  }

  const provenance = provenanceOutcome.data;
  const question = questionOutcome.data;

  const estimate = estimateDifficulty({
    prompt: question.prompt,
    stimulusBody: question.stimulus?.body,
    optionTexts: question.options.map((option) => option.text),
    explanation: question.explanation,
  });
  const deviation = computeDifficultyDeviation(estimate.estimatedDifficulty, context.declaredDifficulty);

  const baseEvidenceInput = {
    candidateId: candidate.candidateId,
    candidateRevision: provenance.revision,
    candidateContentHash: provenance.contentHash,
    blueprintHash: context.blueprintHash,
    declaredDifficulty: context.declaredDifficulty,
    estimatedDifficulty: estimate.estimatedDifficulty,
    estimateConfidence: estimate.estimateConfidence,
    deviation,
    signals: estimate.signals,
    validatedAt: context.validatedAt,
  };

  if (estimate.estimateConfidence < FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE) {
    const failIssue = issue(
      "difficulty_estimate_low_confidence",
      "question",
      `Difficulty-estimate confidence (${estimate.estimateConfidence.toFixed(4)}) is below the minimum (${FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE}); the candidate's extractable text is too sparse to estimate difficulty.`,
    );
    const evidence = buildDifficultyEvidence({ ...baseEvidenceInput, issues: [failIssue], outcome: "quarantined" });
    return { status: "quarantined", outcome: "insufficient_evidence", issues: [failIssue], evidence };
  }

  if (deviation > FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE) {
    const failIssue = issue(
      "difficulty_deviation_exceeded",
      "question",
      `Estimated difficulty '${estimate.estimatedDifficulty}' deviates from declared difficulty '${context.declaredDifficulty}' by ${deviation.toFixed(4)}, exceeding the tolerance of ${FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE}.`,
    );
    const evidence = buildDifficultyEvidence({ ...baseEvidenceInput, issues: [failIssue], outcome: "failed" });
    return { status: "failed", outcome: "mismatch", issues: [failIssue], evidence };
  }

  const evidence = buildDifficultyEvidence({ ...baseEvidenceInput, issues: [], outcome: "passed" });
  return { status: "passed", outcome: "confirmed", evidence };
}
