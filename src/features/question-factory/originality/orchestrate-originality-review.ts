import { createHash } from "node:crypto";

import { questionBank } from "@/content/questions/question-bank";

import { buildCorrectnessReportId, type StoredCorrectnessVerificationReport } from "../correctness";
import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import { resolveBoundBlueprint } from "../shared/bound-blueprint";
import type { FactoryCompartment, FactoryRepository } from "../storage";
import { compartmentForState } from "../storage";
import { parseCandidateProvenance } from "../validation";
import { applyTransition, decideGateFailureOutcome, type CandidateState } from "../workflow";
import { extractComparableText } from "./similarity";
import type { OriginalityEvidence, OriginalityIssue, OriginalityResult, OriginalityVerificationContext, QuestionFactoryCandidate } from "./types";
import { validateCachedOriginalityReplay } from "./validate-cached-replay";
import { validateUpstreamCorrectnessEvidence } from "./validate-upstream-correctness-evidence";
import { verifyCandidateOriginality } from "./verify-candidate-originality";

/**
 * Distinct id namespace from every other gate's report key (`sv-`, `cv-`)
 * so reports can never collide in the shared `reports` compartment.
 */
export function buildOriginalityReportId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `og-${digest}`;
}

export interface StoredOriginalityReport {
  readonly candidateId: string;
  readonly result: OriginalityResult;
}

export interface OrchestrateOriginalityReviewOptions {
  /** Caller-supplied, ISO 8601 — the orchestration layer owns the wall-clock read, never the pure verifier. */
  readonly validatedAt: string;
}

export type OriginalityOrchestrationOutcome =
  | { readonly outcome: "passed"; readonly candidateId: string; readonly evidence: OriginalityEvidence; readonly replayed: boolean }
  | { readonly outcome: "needs_revision"; readonly candidateId: string; readonly issues: readonly OriginalityIssue[]; readonly evidence: OriginalityEvidence; readonly replayed: boolean }
  | { readonly outcome: "rejected"; readonly candidateId: string; readonly issues: readonly OriginalityIssue[]; readonly evidence: OriginalityEvidence; readonly replayed: boolean }
  | { readonly outcome: "quarantined"; readonly candidateId: string; readonly issues: readonly OriginalityIssue[]; readonly evidence: OriginalityEvidence; readonly replayed: boolean }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | { readonly outcome: "invalid_lifecycle_state"; readonly candidateId: string; readonly actualState: string }
  | { readonly outcome: "replay_integrity_failure"; readonly candidateId: string; readonly issues: readonly OriginalityIssue[] }
  | { readonly outcome: "upstream_evidence_invalid"; readonly candidateId: string; readonly issues: readonly OriginalityIssue[] }
  | { readonly outcome: "blueprint_unresolved"; readonly candidateId: string; readonly kind: "missing" | "invalid"; readonly message: string }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * The single authoritative definition of "the corpus, for this candidate"
 * — production-bank ids, self-excluding `excludeCandidateId` (defensive:
 * a candidate is never actually a member of the published corpus, but if
 * its id ever collided with one, comparing it against itself would be
 * meaningless), sorted for determinism. Mission 3D audit remediation
 * (P2): both `computeCurrentOriginalityCorpusFingerprint` (used at
 * replay time) and `buildCorpus` (used at fresh-verification time, which
 * feeds `verify-candidate-originality.ts`'s own `corpusScope.corpusFingerprint`)
 * now derive from this exact same function, so the two can never
 * silently disagree about which ids the fingerprint covers — previously
 * `computeCurrentOriginalityCorpusFingerprint()` did not exclude the
 * candidate's own id while `buildCorpus()` did, so a candidate id
 * colliding with a real production-bank id caused a false
 * `originality_corpus_drift_detected` refusal on the very next replay
 * attempt, even with nothing changed.
 */
function corpusIds(excludeCandidateId: string): readonly string[] {
  return [...questionBank.filter((question) => question.id !== excludeCandidateId).map((question) => question.id)].sort();
}

/** The exact sorted id list `computeCurrentOriginalityCorpusFingerprint` hashes — exported so callers (real evidence builders, tests) can construct a `corpusScope` that is fingerprint-consistent by construction, never a hand-guessed duplicate of this logic. */
export function computeCurrentOriginalityCorpusIds(excludeCandidateId: string): readonly string[] {
  return corpusIds(excludeCandidateId);
}

/** `hashJson(corpusIds(excludeCandidateId))` — the corpus fingerprint every replay check binds against. Exported so `difficulty/`'s own upstream-evidence check (which reuses `validateCachedOriginalityReplay` verbatim) computes it identically. */
export function computeCurrentOriginalityCorpusFingerprint(excludeCandidateId: string): string {
  return hashJson(corpusIds(excludeCandidateId));
}

function buildCorpus(excludeCandidateId: string): readonly { readonly id: string; readonly comparableText: string }[] {
  return questionBank
    .filter((question) => question.id !== excludeCandidateId)
    .map((question) => ({ id: question.id, comparableText: extractComparableText(question) }));
}

function severityFor(result: Extract<OriginalityResult, { status: "failed" | "quarantined" }>): "hard_fail" | "soft_fail" | "uncertain" {
  if (result.status === "quarantined") return "uncertain";
  return result.classification === "structurally_similar" ? "soft_fail" : "hard_fail";
}

/**
 * Builds the final outcome record from a result **and an already-decided
 * lifecycle target** — never re-derives the target itself here. Re-deriving
 * via `decideGateFailureOutcome` with a fabricated `revisionCount` would
 * risk disagreeing with whatever target was actually computed (with the
 * real revision count) and persisted at the call site, which matters for
 * this gate's `soft_fail` severity (unlike every upstream gate, which is
 * never revision-count-sensitive). Every call site below supplies the
 * target it independently knows to be correct:
 * - Fresh verification: the exact `transitionTarget` just persisted.
 * - Cached `originality_review_passed` replay: always
 *   `"originality_review_passed"` (replay only ever validates a `"passed"`
 *   result).
 * - Terminal (moved-out) report replay: `needs_revision` never physically
 *   leaves `review-queue` (it maps to the same compartment), so a
 *   candidate found *not_found* can only have been `rejected` or
 *   `quarantined` — read directly off the stored result, never guessed.
 */
function finalOutcomeFrom(
  result: OriginalityResult,
  candidateId: string,
  replayed: boolean,
  target: "originality_review_passed" | "needs_revision" | "rejected" | "quarantined",
): OriginalityOrchestrationOutcome {
  if (target === "originality_review_passed" && result.status === "passed") {
    return { outcome: "passed", candidateId, evidence: result.evidence, replayed };
  }
  if (result.status === "passed") {
    // Defensive: a "passed" result paired with a non-passing target should
    // never occur given the call sites above, but never silently
    // misreport a pass as a failure destination either.
    return { outcome: "passed", candidateId, evidence: result.evidence, replayed };
  }
  if (target === "needs_revision") return { outcome: "needs_revision", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  if (target === "quarantined") return { outcome: "quarantined", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  return { outcome: "rejected", candidateId, issues: result.issues, evidence: result.evidence, replayed };
}

/** Terminal (moved-out) reconstruction: `needs_revision` never leaves `review-queue`, so only `rejected`/`quarantined` are possible here. */
function terminalTargetFrom(result: OriginalityResult): "rejected" | "quarantined" {
  return result.status === "quarantined" ? "quarantined" : "rejected";
}

async function attemptMove(
  repository: FactoryRepository,
  candidateId: string,
  destination: FactoryCompartment,
): Promise<{ readonly ok: true; readonly replayed: boolean } | { readonly ok: false; readonly message: string }> {
  try {
    const moveResult = await repository.move(candidateId, "review-queue", destination);
    if (!moveResult.ok) return { ok: false, message: moveResult.message };
    return { ok: true, replayed: moveResult.replayed };
  } catch (error) {
    return { ok: false, message: `Repository move failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

async function attemptUpdate(
  repository: FactoryRepository,
  candidateId: string,
  compartment: FactoryCompartment,
  updatedRecord: Record<string, unknown>,
  expectedContentHash: string,
): Promise<{ readonly ok: true; readonly replayed: boolean } | { readonly ok: false; readonly message: string }> {
  try {
    const updateResult = await repository.update(compartment, candidateId, updatedRecord, { expectedContentHash });
    if (!updateResult.ok) return { ok: false, message: updateResult.message };
    return { ok: true, replayed: updateResult.replayed };
  } catch (error) {
    return { ok: false, message: `Repository update failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

async function writeReportIfAbsent(
  repository: FactoryRepository,
  reportId: string,
  report: StoredOriginalityReport,
): Promise<{ readonly ok: true; readonly alreadyPresent: boolean } | { readonly ok: false; readonly message: string }> {
  const existing = (await repository.read("reports", reportId)) as StoredOriginalityReport | undefined;
  if (existing !== undefined) {
    if (existing.result.evidence.originalityFingerprint === report.result.evidence.originalityFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different originality report already exists for candidate '${report.candidateId}' — its originality fingerprint no longer matches the stored report, indicating the candidate or the production corpus genuinely changed between verification attempts.`,
    };
  }
  const createResult = await repository.create("reports", reportId, report);
  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, alreadyPresent: false };
}

/**
 * Lifecycle orchestration for the originality-review gate. Reads a
 * candidate physically stored in `review-queue`, resolves its bound
 * blueprint (fail-closed, for evidence binding only — see the plan's
 * §4a amendment), runs the pure `verifyCandidateOriginality` against the
 * live production corpus, and moves the candidate only when the
 * destination compartment differs from `review-queue`
 * (`originality_review_passed` and `needs_revision` both map there — see
 * `state-compartment-mapping.ts` — so those transitions persist via
 * `update()`, never `move()`).
 */
export async function orchestrateOriginalityReview(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateOriginalityReviewOptions,
): Promise<OriginalityOrchestrationOutcome> {
  const reportId = buildOriginalityReportId(candidateId);
  const reviewQueueRaw = await repository.read("review-queue", candidateId);

  if (reviewQueueRaw === undefined) {
    // Candidate already left review-queue (a prior rejected/quarantined
    // move completed — a passed candidate never leaves review-queue).
    // There is no live candidate content to re-verify against, so a
    // terminal stored report, if any, is the only source of truth left.
    const existingReport = (await repository.read("reports", reportId)) as StoredOriginalityReport | undefined;
    if (existingReport !== undefined && existingReport.candidateId === candidateId && existingReport.result.evidence.candidateId === candidateId) {
      return finalOutcomeFrom(existingReport.result, candidateId, true, terminalTargetFrom(existingReport.result));
    }
    return { outcome: "not_found", candidateId };
  }

  if (typeof reviewQueueRaw !== "object" || reviewQueueRaw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'review-queue' record is not an object." };
  }
  const record = reviewQueueRaw as Record<string, unknown>;
  const candidate: QuestionFactoryCandidate = {
    candidateId,
    state: readStringField(record, "state") ?? "",
    question: record.question,
    provenance: record.provenance,
  };

  if (candidate.state !== "semantic_review_passed" && candidate.state !== "originality_review_passed") {
    return { outcome: "invalid_lifecycle_state", candidateId, actualState: candidate.state.length > 0 ? candidate.state : "unknown" };
  }

  const rawProvenance = typeof candidate.provenance === "object" && candidate.provenance !== null ? (candidate.provenance as Record<string, unknown>) : undefined;
  const blueprintId = rawProvenance ? readStringField(rawProvenance, "blueprintId") : undefined;

  let blueprintHash: string | undefined;
  if (blueprintId !== undefined) {
    const blueprintResolution = await resolveBoundBlueprint(blueprintId, repository);
    if (!blueprintResolution.ok) {
      return {
        outcome: "blueprint_unresolved",
        candidateId,
        kind: blueprintResolution.kind,
        message: `Candidate '${candidateId}' declares bound blueprint '${blueprintId}', which could not be resolved (${blueprintResolution.kind}): ${blueprintResolution.message}`,
      };
    }
    blueprintHash = blueprintResolution.blueprintHash;
  }

  if (candidate.state === "originality_review_passed") {
    const existingReport = (await repository.read("reports", reportId)) as StoredOriginalityReport | undefined;
    const replayValidation = validateCachedOriginalityReplay(candidate, existingReport, {
      blueprintHash,
      currentCorpusFingerprint: computeCurrentOriginalityCorpusFingerprint(candidateId),
    });
    if (!replayValidation.ok) {
      return { outcome: "replay_integrity_failure", candidateId, issues: replayValidation.issues };
    }
    if (existingReport !== undefined) {
      return finalOutcomeFrom(existingReport.result, candidateId, true, "originality_review_passed");
    }
    return { outcome: "repository_error", candidateId, message: `Candidate '${candidateId}' is stored as 'originality_review_passed' but no originality report exists for it.` };
  }

  // candidate.state === "semantic_review_passed": fresh verification.
  //
  // Mission 3D audit remediation (P1-1): lifecycle state alone is never
  // sufficient proof that correctness and semantic review actually ran —
  // a candidate whose `state` field was written directly (bypassing
  // `orchestrateCorrectnessVerification`/`attemptSemanticReviewTransition`
  // entirely) must be refused here, before the pure verifier ever runs
  // and before any report is written or any transition attempted.
  const correctnessReport = (await repository.read("reports", buildCorrectnessReportId(candidateId))) as StoredCorrectnessVerificationReport | undefined;
  const upstreamEvidenceValidation = validateUpstreamCorrectnessEvidence(candidate, correctnessReport, { blueprintHash });
  if (!upstreamEvidenceValidation.ok) {
    return { outcome: "upstream_evidence_invalid", candidateId, issues: upstreamEvidenceValidation.issues };
  }

  const context: OriginalityVerificationContext = {
    validatedAt: options.validatedAt,
    corpus: buildCorpus(candidateId),
    ...(blueprintHash !== undefined ? { blueprintHash } : {}),
  };
  const result = verifyCandidateOriginality(candidate, context);

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  const revisionCount = provenanceOutcome.ok ? provenanceOutcome.data.revision : 0;

  const transitionTarget: CandidateState =
    result.status === "passed"
      ? "originality_review_passed"
      : result.status === "quarantined"
        ? "quarantined"
        : decideGateFailureOutcome({ severity: severityFor(result), revisionCount, maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS });

  const transition = applyTransition("semantic_review_passed", transitionTarget, { revisionCount, maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS });
  if (!transition.ok) {
    return { outcome: "repository_error", candidateId, message: transition.message };
  }

  const destinationCompartment = compartmentForState(transitionTarget, transitionTarget === "rejected" ? "originality" : undefined);
  if (!destinationCompartment) {
    return { outcome: "repository_error", candidateId, message: `No storage compartment is defined for lifecycle state '${transitionTarget}'.` };
  }

  const report: StoredOriginalityReport = { candidateId, result };
  const writeOutcome = await writeReportIfAbsent(repository, reportId, report);
  if (!writeOutcome.ok) {
    return { outcome: "repository_error", candidateId, message: writeOutcome.message };
  }

  let persistenceReplayed = false;
  if (destinationCompartment === "review-queue") {
    const updatedRecord: Record<string, unknown> = { ...record, state: transitionTarget };
    const updateOutcome = await attemptUpdate(repository, candidateId, "review-queue", updatedRecord, hashJson(record));
    if (!updateOutcome.ok) return { outcome: "repository_error", candidateId, message: updateOutcome.message };
    persistenceReplayed = updateOutcome.replayed;
  } else {
    const moveOutcome = await attemptMove(repository, candidateId, destinationCompartment);
    if (!moveOutcome.ok) return { outcome: "repository_error", candidateId, message: moveOutcome.message };
    persistenceReplayed = moveOutcome.replayed;
  }

  return finalOutcomeFrom(result, candidateId, writeOutcome.alreadyPresent || persistenceReplayed, transitionTarget as "originality_review_passed" | "needs_revision" | "rejected" | "quarantined");
}
