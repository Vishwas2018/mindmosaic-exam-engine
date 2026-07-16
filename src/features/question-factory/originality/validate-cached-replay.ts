/**
 * Binds a cached `originality_review_passed` replay to the evidence it
 * claims to rest on. A lifecycle state alone must never authorise
 * returning a stored originality report as-is — this module independently
 * re-proves every fact that report's validity depends on: the candidate's
 * own current identity/content/blueprint binding, the *current* production
 * corpus's fingerprint (the corpus-drift case — Mission 3D plan §5b, the
 * single most novel design point in this mission), both comparison-logic
 * version tags, and the report's own recomputed fingerprint.
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, no repository
 * access — every value this function reasons about is supplied by the
 * caller, which already read/computed them as part of the same
 * orchestration call. Never throws on malformed input; every failure mode
 * becomes a structured `OriginalityIssue` instead.
 */
import { parseCandidateProvenance } from "../validation";
import { computeOriginalityFingerprint } from "./evidence";
import { ORIGINALITY_CHECKER_VERSION, ORIGINALITY_NORMALISATION_VERSION } from "./similarity";
import type { OriginalityIssue, QuestionFactoryCandidate } from "./types";
import type { StoredOriginalityReport } from "./orchestrate-originality-review";

export interface CachedOriginalityReplayContext {
  /**
   * The candidate's *current*, freshly-resolved bound-blueprint hash
   * (never trusted as `undefined`-means-"no blueprint expected" — see the
   * guard below). Mirrors `correctness/validate-cached-replay.ts`'s
   * `CachedReplayContext.blueprintHash` contract exactly.
   */
  readonly blueprintHash?: string;
  /** `hashJson([...currentProductionBankIds].sort())`, computed by the orchestrator from the live corpus. */
  readonly currentCorpusFingerprint: string;
}

export type CachedOriginalityReplayValidationOutcome =
  | { readonly ok: true }
  | { readonly ok: false; readonly issues: readonly OriginalityIssue[] };

function issue(path: string, message: string): OriginalityIssue {
  return { code: "originality_corpus_drift_detected", path, message, severity: "error" };
}

export function validateCachedOriginalityReplay(
  candidate: QuestionFactoryCandidate,
  originalityReport: StoredOriginalityReport | undefined,
  context: CachedOriginalityReplayContext,
): CachedOriginalityReplayValidationOutcome {
  const issues: OriginalityIssue[] = [];

  if (candidate.state !== "originality_review_passed") {
    issues.push(issue("candidate.state", `Candidate lifecycle state is '${candidate.state}', not 'originality_review_passed'.`));
  }

  // Same "verified, non-empty" guard `correctness/validate-cached-replay.ts`
  // enforces: absent/empty hashes never vacuously match each other.
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
    issues.push(issue("candidate.provenance", "Candidate provenance no longer parses against the schema originality review attested."));
    return { ok: false, issues };
  }
  const { revision: candidateRevision, contentHash: candidateContentHash, candidateId } = provenanceOutcome.data;
  if (candidateId !== candidate.candidateId) {
    issues.push(issue("candidate.provenance.candidateId", `Record is stored under candidateId '${candidate.candidateId}' but its provenance declares '${candidateId}'.`));
  }

  if (originalityReport === undefined) {
    issues.push(issue("originalityReport", "No originality report exists for a candidate stored as 'originality_review_passed'."));
    return { ok: false, issues };
  }

  const evidence = originalityReport.result.evidence;

  if (originalityReport.candidateId !== candidate.candidateId) {
    issues.push(issue("originalityReport.candidateId", `Stored originality report belongs to candidate '${originalityReport.candidateId}', not '${candidate.candidateId}'.`));
  }
  if (evidence.candidateId !== candidate.candidateId) {
    issues.push(issue("originalityReport.evidence.candidateId", `Originality evidence belongs to candidate '${evidence.candidateId}', not '${candidate.candidateId}'.`));
  }
  if (originalityReport.result.status !== "passed" || evidence.outcome !== "passed") {
    issues.push(issue("originalityReport.result.status", `Stored originality report outcome is '${originalityReport.result.status}', inconsistent with a candidate stored as 'originality_review_passed'.`));
  }
  if (evidence.candidateRevision !== candidateRevision) {
    issues.push(issue("originalityReport.evidence.candidateRevision", `Originality evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${candidateRevision}.`));
  }
  if (evidence.candidateContentHash !== candidateContentHash) {
    issues.push(issue("originalityReport.evidence.candidateContentHash", "Originality evidence content hash no longer matches the candidate's current content hash."));
  }
  if (!blueprintHashVerified || evidence.blueprintHash !== currentBlueprintHash) {
    issues.push(issue("originalityReport.evidence.blueprintHash", "Originality evidence blueprint hash does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match)."));
  }

  // The corpus-drift check (Mission 3D plan §5b): if the production bank
  // has changed since this report was written — a question added,
  // removed, or its id changed — the sorted-id-list fingerprint changes
  // deterministically, and the cached "distinct" verdict can no longer be
  // trusted (a newly-published question could now be the nearest match).
  if (evidence.corpusScope.corpusFingerprint !== context.currentCorpusFingerprint) {
    issues.push(issue("originalityReport.evidence.corpusScope.corpusFingerprint", "The production corpus has changed since this report was computed (corpus fingerprint mismatch) — the cached originality verdict may no longer be valid and must not be replayed."));
  }
  if (evidence.checkerVersion !== ORIGINALITY_CHECKER_VERSION) {
    issues.push(issue("originalityReport.evidence.checkerVersion", "Originality evidence was produced under a comparison-algorithm version that is no longer current."));
  }
  if (evidence.normalisationVersion !== ORIGINALITY_NORMALISATION_VERSION) {
    issues.push(issue("originalityReport.evidence.normalisationVersion", "Originality evidence was produced under a text-normalisation version that is no longer current."));
  }

  const recomputedFingerprint = computeOriginalityFingerprint({
    candidateId: evidence.candidateId,
    candidateRevision: evidence.candidateRevision,
    candidateContentHash: evidence.candidateContentHash,
    blueprintHash: evidence.blueprintHash,
    checkerVersion: evidence.checkerVersion,
    normalisationVersion: evidence.normalisationVersion,
    corpusScope: evidence.corpusScope,
    nearestMatches: evidence.nearestMatches,
    classification: evidence.classification,
    issueSummary: evidence.issueSummary,
    outcome: evidence.outcome,
  });
  if (recomputedFingerprint !== evidence.originalityFingerprint) {
    issues.push(issue("originalityReport.evidence.originalityFingerprint", "Recomputed originality fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with."));
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
