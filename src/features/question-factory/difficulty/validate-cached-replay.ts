/**
 * Binds a cached `difficulty_review_passed` replay to the evidence it
 * claims to rest on. A lifecycle state alone must never authorise
 * returning a stored difficulty report as-is — this module independently
 * re-proves the candidate's own current identity/content/blueprint
 * binding, the estimator-version tag, and the report's own recomputed
 * fingerprint.
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, no repository
 * access. Never throws on malformed input; every failure mode becomes a
 * structured `DifficultyIssue` instead.
 */
import { parseCandidateProvenance } from "../validation";
import { DIFFICULTY_ESTIMATOR_VERSION } from "./estimate-difficulty";
import { computeDifficultyFingerprint } from "./evidence";
import type { DifficultyIssue, QuestionFactoryCandidate } from "./types";
import type { StoredDifficultyReport } from "./orchestrate-difficulty-review";

export interface CachedDifficultyReplayContext {
  readonly blueprintHash?: string;
}

export type CachedDifficultyReplayValidationOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly DifficultyIssue[] };

function issue(path: string, message: string): DifficultyIssue {
  return { code: "difficulty_replay_drift_detected", path, message, severity: "error" };
}

export function validateCachedDifficultyReplay(
  candidate: QuestionFactoryCandidate,
  difficultyReport: StoredDifficultyReport | undefined,
  context: CachedDifficultyReplayContext,
): CachedDifficultyReplayValidationOutcome {
  const issues: DifficultyIssue[] = [];

  if (candidate.state !== "difficulty_review_passed") {
    issues.push(issue("candidate.state", `Candidate lifecycle state is '${candidate.state}', not 'difficulty_review_passed'.`));
  }

  const currentBlueprintHash = context.blueprintHash;
  const blueprintHashVerified = typeof currentBlueprintHash === "string" && currentBlueprintHash.trim().length > 0;
  if (!blueprintHashVerified) {
    issues.push({
      code: "blueprint_binding_unresolved",
      path: "context.blueprintHash",
      message: "No verified bound-blueprint hash was supplied for this cached-replay check — the candidate's current blueprint binding cannot be confirmed, so the cached report must not be replayed.",
      severity: "error",
    });
  }

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  if (!provenanceOutcome.ok) {
    issues.push(issue("candidate.provenance", "Candidate provenance no longer parses against the schema difficulty review attested."));
    return { ok: false, issues };
  }
  const { revision: candidateRevision, contentHash: candidateContentHash, candidateId } = provenanceOutcome.data;
  if (candidateId !== candidate.candidateId) {
    issues.push(issue("candidate.provenance.candidateId", `Record is stored under candidateId '${candidate.candidateId}' but its provenance declares '${candidateId}'.`));
  }

  if (difficultyReport === undefined) {
    issues.push(issue("difficultyReport", "No difficulty report exists for a candidate stored as 'difficulty_review_passed'."));
    return { ok: false, issues };
  }

  const evidence = difficultyReport.result.evidence;

  if (difficultyReport.candidateId !== candidate.candidateId) {
    issues.push(issue("difficultyReport.candidateId", `Stored difficulty report belongs to candidate '${difficultyReport.candidateId}', not '${candidate.candidateId}'.`));
  }
  if (evidence.candidateId !== candidate.candidateId) {
    issues.push(issue("difficultyReport.evidence.candidateId", `Difficulty evidence belongs to candidate '${evidence.candidateId}', not '${candidate.candidateId}'.`));
  }
  if (difficultyReport.result.status !== "passed" || evidence.outcome !== "passed") {
    issues.push(issue("difficultyReport.result.status", `Stored difficulty report outcome is '${difficultyReport.result.status}', inconsistent with a candidate stored as 'difficulty_review_passed'.`));
  }
  if (evidence.candidateRevision !== candidateRevision) {
    issues.push(issue("difficultyReport.evidence.candidateRevision", `Difficulty evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${candidateRevision}.`));
  }
  if (evidence.candidateContentHash !== candidateContentHash) {
    issues.push(issue("difficultyReport.evidence.candidateContentHash", "Difficulty evidence content hash no longer matches the candidate's current content hash."));
  }
  if (!blueprintHashVerified || evidence.blueprintHash !== currentBlueprintHash) {
    issues.push(issue("difficultyReport.evidence.blueprintHash", "Difficulty evidence blueprint hash does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match)."));
  }
  if (evidence.checkerVersion !== DIFFICULTY_ESTIMATOR_VERSION) {
    issues.push(issue("difficultyReport.evidence.checkerVersion", "Difficulty evidence was produced under an estimator version that is no longer current."));
  }

  const recomputedFingerprint = computeDifficultyFingerprint({
    candidateId: evidence.candidateId,
    candidateRevision: evidence.candidateRevision,
    candidateContentHash: evidence.candidateContentHash,
    blueprintHash: evidence.blueprintHash,
    checkerVersion: evidence.checkerVersion,
    declaredDifficulty: evidence.declaredDifficulty,
    estimatedDifficulty: evidence.estimatedDifficulty,
    estimateConfidence: evidence.estimateConfidence,
    deviation: evidence.deviation,
    signals: evidence.signals,
    issueSummary: evidence.issueSummary,
    outcome: evidence.outcome,
  });
  if (recomputedFingerprint !== evidence.difficultyFingerprint) {
    issues.push(issue("difficultyReport.evidence.difficultyFingerprint", "Recomputed difficulty fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with."));
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
