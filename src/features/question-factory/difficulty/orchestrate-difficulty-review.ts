import { createHash } from "node:crypto";

import { FACTORY_THRESHOLDS } from "../config";
import {
  buildOriginalityReportId,
  computeCurrentOriginalityCorpusFingerprint,
  validateCachedOriginalityReplay,
  type StoredOriginalityReport,
} from "../originality";
import { hashJson } from "../provenance";
import { resolveBoundBlueprint } from "../shared/bound-blueprint";
import type { FactoryCompartment, FactoryRepository } from "../storage";
import { compartmentForState } from "../storage";
import { parseCandidateProvenance } from "../validation";
import { applyTransition, decideGateFailureOutcome, type CandidateState } from "../workflow";
import type { DifficultyEvidence, DifficultyIssue, DifficultyIssueCode, DifficultyResult, DifficultyVerificationContext, QuestionFactoryCandidate } from "./types";
import { validateCachedDifficultyReplay } from "./validate-cached-replay";
import { verifyCandidateDifficulty } from "./verify-candidate-difficulty";

/** Distinct id namespace from every other gate's report key (`sv-`, `cv-`, `og-`). */
export function buildDifficultyReportId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `df-${digest}`;
}

export interface StoredDifficultyReport {
  readonly candidateId: string;
  readonly result: DifficultyResult;
}

export interface OrchestrateDifficultyReviewOptions {
  /** Caller-supplied, ISO 8601 — the orchestration layer owns the wall-clock read, never the pure verifier. */
  readonly validatedAt: string;
}

export type DifficultyOrchestrationOutcome =
  | { readonly outcome: "passed"; readonly candidateId: string; readonly evidence: DifficultyEvidence; readonly replayed: boolean }
  | { readonly outcome: "needs_revision"; readonly candidateId: string; readonly issues: readonly DifficultyIssue[]; readonly evidence: DifficultyEvidence; readonly replayed: boolean }
  | { readonly outcome: "rejected"; readonly candidateId: string; readonly issues: readonly DifficultyIssue[]; readonly evidence: DifficultyEvidence; readonly replayed: boolean }
  | { readonly outcome: "quarantined"; readonly candidateId: string; readonly issues: readonly DifficultyIssue[]; readonly evidence: DifficultyEvidence; readonly replayed: boolean }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | { readonly outcome: "invalid_lifecycle_state"; readonly candidateId: string; readonly actualState: string }
  | { readonly outcome: "replay_integrity_failure"; readonly candidateId: string; readonly issues: readonly DifficultyIssue[] }
  | { readonly outcome: "upstream_evidence_invalid"; readonly candidateId: string; readonly issues: readonly DifficultyIssue[] }
  | { readonly outcome: "blueprint_unresolved"; readonly candidateId: string; readonly kind: "missing" | "invalid"; readonly message: string }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Mission 3D audit remediation (P1-1). Difficulty's own upstream-evidence
 * check reuses `validateCachedOriginalityReplay` **verbatim** rather than
 * re-declaring a near-duplicate validator: verifying "is this originality
 * evidence still trustworthy" is exactly what that function already does
 * for originality's own cached-replay path, and the check is identical
 * regardless of which gate is asking — the same candidate/content/corpus/
 * version/outcome facts must hold either way. Its `OriginalityIssue[]`
 * result is adapted into `DifficultyIssue[]` under one umbrella code
 * (`difficulty_upstream_evidence_invalid`), since the two catalogues are
 * distinct closed unions.
 */
function mapToDifficultyIssues(originalityIssues: readonly { readonly path: string; readonly message: string; readonly severity: "error" | "review_required" }[]): readonly DifficultyIssue[] {
  const code: DifficultyIssueCode = "difficulty_upstream_evidence_invalid";
  return originalityIssues.map((issue) => ({ code, path: `upstreamOriginalityEvidence.${issue.path}`, message: issue.message, severity: issue.severity }));
}

/**
 * Builds the final outcome record from a result **and an already-decided
 * lifecycle target** — never re-derives the target via
 * `decideGateFailureOutcome` with a fabricated `revisionCount` here, since
 * that could disagree with whatever target was actually computed (with
 * the real revision count) and persisted at the call site. Mirrors
 * `originality/orchestrate-originality-review.ts`'s `finalOutcomeFrom`
 * exactly, for the same reason (this gate's `mismatch` outcome is also
 * `soft_fail`, hence revision-count-sensitive).
 */
function finalOutcomeFrom(
  result: DifficultyResult,
  candidateId: string,
  replayed: boolean,
  target: "difficulty_review_passed" | "needs_revision" | "rejected" | "quarantined",
): DifficultyOrchestrationOutcome {
  if (result.status === "passed") return { outcome: "passed", candidateId, evidence: result.evidence, replayed };
  if (target === "needs_revision") return { outcome: "needs_revision", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  if (target === "quarantined") return { outcome: "quarantined", candidateId, issues: result.issues, evidence: result.evidence, replayed };
  return { outcome: "rejected", candidateId, issues: result.issues, evidence: result.evidence, replayed };
}

/** Terminal (moved-out) reconstruction: `needs_revision` never leaves `review-queue`, so only `rejected`/`quarantined` are possible here. */
function terminalTargetFrom(result: DifficultyResult): "rejected" | "quarantined" {
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
  report: StoredDifficultyReport,
): Promise<{ readonly ok: true; readonly alreadyPresent: boolean } | { readonly ok: false; readonly message: string }> {
  const existing = (await repository.read("reports", reportId)) as StoredDifficultyReport | undefined;
  if (existing !== undefined) {
    if (existing.result.evidence.difficultyFingerprint === report.result.evidence.difficultyFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different difficulty report already exists for candidate '${report.candidateId}' — its difficulty fingerprint no longer matches the stored report, indicating the candidate genuinely changed between verification attempts.`,
    };
  }
  const createResult = await repository.create("reports", reportId, report);
  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, alreadyPresent: false };
}

/**
 * Lifecycle orchestration for the difficulty-review gate. Reads a
 * candidate physically stored in `review-queue`, resolves its bound
 * blueprint (fail-closed — `declaredDifficulty` cannot exist without it,
 * unlike originality's optional binding), runs the pure
 * `verifyCandidateDifficulty`, and moves the candidate only when the
 * destination compartment differs from `review-queue`
 * (`difficulty_review_passed` and `needs_revision` both map there).
 */
export async function orchestrateDifficultyReview(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateDifficultyReviewOptions,
): Promise<DifficultyOrchestrationOutcome> {
  const reportId = buildDifficultyReportId(candidateId);
  const reviewQueueRaw = await repository.read("review-queue", candidateId);

  if (reviewQueueRaw === undefined) {
    const existingReport = (await repository.read("reports", reportId)) as StoredDifficultyReport | undefined;
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

  if (candidate.state !== "originality_review_passed" && candidate.state !== "difficulty_review_passed") {
    return { outcome: "invalid_lifecycle_state", candidateId, actualState: candidate.state.length > 0 ? candidate.state : "unknown" };
  }

  const rawProvenance = typeof candidate.provenance === "object" && candidate.provenance !== null ? (candidate.provenance as Record<string, unknown>) : undefined;
  const blueprintId = rawProvenance ? readStringField(rawProvenance, "blueprintId") : undefined;

  if (blueprintId === undefined) {
    return {
      outcome: "blueprint_unresolved",
      candidateId,
      kind: "missing",
      message: `Candidate '${candidateId}' declares no bound blueprint id; the difficulty gate cannot determine a declared difficulty to compare against.`,
    };
  }
  const blueprintResolution = await resolveBoundBlueprint(blueprintId, repository);
  if (!blueprintResolution.ok) {
    return {
      outcome: "blueprint_unresolved",
      candidateId,
      kind: blueprintResolution.kind,
      message: `Candidate '${candidateId}' declares bound blueprint '${blueprintId}', which could not be resolved (${blueprintResolution.kind}): ${blueprintResolution.message}`,
    };
  }
  const { blueprint, blueprintHash } = blueprintResolution;

  if (candidate.state === "difficulty_review_passed") {
    const existingReport = (await repository.read("reports", reportId)) as StoredDifficultyReport | undefined;
    const replayValidation = validateCachedDifficultyReplay(candidate, existingReport, { blueprintHash });
    if (!replayValidation.ok) {
      return { outcome: "replay_integrity_failure", candidateId, issues: replayValidation.issues };
    }
    if (existingReport !== undefined) {
      return finalOutcomeFrom(existingReport.result, candidateId, true, "difficulty_review_passed");
    }
    return { outcome: "repository_error", candidateId, message: `Candidate '${candidateId}' is stored as 'difficulty_review_passed' but no difficulty report exists for it.` };
  }

  // candidate.state === "originality_review_passed": fresh verification.
  //
  // Mission 3D audit remediation (P1-1): lifecycle state alone is never
  // sufficient proof that originality review actually ran — a candidate
  // whose `state` field was written directly (bypassing
  // `orchestrateOriginalityReview` entirely) must be refused here, before
  // the pure verifier ever runs and before any report is written or any
  // transition attempted. Reuses `validateCachedOriginalityReplay`
  // verbatim (see `mapToDifficultyIssues`'s doc comment).
  const originalityReport = (await repository.read("reports", buildOriginalityReportId(candidateId))) as StoredOriginalityReport | undefined;
  const upstreamEvidenceValidation = validateCachedOriginalityReplay(candidate, originalityReport, {
    blueprintHash,
    currentCorpusFingerprint: computeCurrentOriginalityCorpusFingerprint(candidateId),
  });
  if (!upstreamEvidenceValidation.ok) {
    return { outcome: "upstream_evidence_invalid", candidateId, issues: mapToDifficultyIssues(upstreamEvidenceValidation.issues) };
  }

  const context: DifficultyVerificationContext = { validatedAt: options.validatedAt, declaredDifficulty: blueprint.difficulty, blueprintHash };
  const result = verifyCandidateDifficulty(candidate, context);

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  const revisionCount = provenanceOutcome.ok ? provenanceOutcome.data.revision : 0;

  const transitionTarget: CandidateState =
    result.status === "passed"
      ? "difficulty_review_passed"
      : result.status === "quarantined"
        ? "quarantined"
        : decideGateFailureOutcome({ severity: "soft_fail", revisionCount, maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS });

  const transition = applyTransition("originality_review_passed", transitionTarget, { revisionCount, maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS });
  if (!transition.ok) {
    return { outcome: "repository_error", candidateId, message: transition.message };
  }

  const destinationCompartment = compartmentForState(transitionTarget, transitionTarget === "rejected" ? "difficulty" : undefined);
  if (!destinationCompartment) {
    return { outcome: "repository_error", candidateId, message: `No storage compartment is defined for lifecycle state '${transitionTarget}'.` };
  }

  const report: StoredDifficultyReport = { candidateId, result };
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

  return finalOutcomeFrom(result, candidateId, writeOutcome.alreadyPresent || persistenceReplayed, transitionTarget as "difficulty_review_passed" | "needs_revision" | "rejected" | "quarantined");
}
