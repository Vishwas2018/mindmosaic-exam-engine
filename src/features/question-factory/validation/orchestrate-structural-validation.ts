import { createHash } from "node:crypto";

import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import type { FactoryRepository, MoveResult } from "../storage";
import { compartmentForState } from "../storage";
import { applyTransition, decideGateFailureOutcome, type CandidateState } from "../workflow";
import { validateCandidateStructure } from "./validate-candidate-structure";
import type {
  QuestionFactoryCandidate,
  StructuralValidationEvidence,
  StructuralValidationIssue,
  StructuralValidationResult,
} from "./types";

/**
 * Deterministic, id-only (no content-dependent) report key, distinct from
 * `candidateId` itself so it can never collide with a real candidate id in
 * the shared `reports` compartment namespace. Not content-addressed —
 * unlike `mintCandidateId`, this key must stay stable across repeated
 * validation attempts against the *same* candidate so a retry finds the
 * same report rather than minting a new one.
 */
function buildReportId(candidateId: string): string {
  const digest = createHash("sha256").update(candidateId, "utf8").digest("hex").slice(0, 40);
  return `sv-${digest}`;
}

interface StoredStructuralValidationReport {
  readonly candidateId: string;
  readonly result: StructuralValidationResult;
}

export interface ExpectedCandidateBinding {
  readonly contentHash?: string;
  readonly revision?: number;
  readonly blueprintId?: string;
}

export interface OrchestrateStructuralValidationOptions {
  /** Caller-supplied, ISO 8601 — the orchestration layer owns the wall-clock read, never the pure validator. */
  readonly validatedAt: string;
  /** What the caller already knew about this candidate from an earlier read, if any — forwarded into staleness checks. */
  readonly expected?: ExpectedCandidateBinding;
}

export type StructuralValidationOrchestrationOutcome =
  | {
      readonly outcome: "passed";
      readonly candidateId: string;
      readonly evidence: StructuralValidationEvidence;
      readonly replayed: boolean;
    }
  | {
      readonly outcome: "rejected";
      readonly candidateId: string;
      readonly issues: readonly StructuralValidationIssue[];
      readonly evidence: StructuralValidationEvidence;
      readonly replayed: boolean;
    }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | { readonly outcome: "not_generated"; readonly candidateId: string; readonly actualState: string }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

function replayOutcome(
  candidateId: string,
  report: StoredStructuralValidationReport,
): StructuralValidationOrchestrationOutcome {
  if (report.result.status === "passed") {
    return { outcome: "passed", candidateId, evidence: report.result.evidence, replayed: true };
  }
  return {
    outcome: "rejected",
    candidateId,
    issues: report.result.issues,
    evidence: report.result.evidence,
    replayed: true,
  };
}

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Writes the evidence report if absent; if a report already exists for
 * this candidate, treats a matching `evidenceHash` as a safe no-op replay
 * and a differing one as a genuine conflict (the stored candidate must
 * have changed between attempts) rather than silently overwriting —
 * mirroring the read-before-write replay discipline `ingestLegacyQuestions`
 * already uses for the `generated` compartment.
 */
async function writeReportIfAbsent(
  repository: FactoryRepository,
  reportId: string,
  report: StoredStructuralValidationReport,
): Promise<{ readonly ok: true; readonly alreadyPresent: boolean } | { readonly ok: false; readonly message: string }> {
  const existing = (await repository.read("reports", reportId)) as StoredStructuralValidationReport | undefined;
  if (existing !== undefined) {
    if (existing.result.evidence.evidenceHash === report.result.evidence.evidenceHash) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different structural-validation report already exists for candidate '${report.candidateId}' — the stored candidate changed between validation attempts.`,
    };
  }
  const createResult = await repository.create("reports", reportId, report);
  if (!createResult.ok) {
    return { ok: false, message: createResult.message };
  }
  return { ok: true, alreadyPresent: false };
}

/**
 * Lifecycle orchestration for the structural-validation gate: reads a
 * `generated` candidate, confirms it still matches whatever the caller
 * already knew about it, runs the pure `validateCandidateStructure`, and
 * transactionally moves the candidate through `FactoryRepository.move()` —
 * to `structural_validation_passed` (compartment `review-queue`) on pass,
 * or to `rejected` (compartment `rejected/structural`) on failure.
 * Evidence is stored as a separate report record (compartment `reports`,
 * keyed by a deterministic id derived from `candidateId`) rather than
 * mutated into the candidate record itself: `FactoryRepository.move()`
 * relocates a candidate's existing bytes unchanged (it is not an update
 * operation), so evidence storage and candidate relocation are
 * deliberately two records, not one.
 *
 * Idempotent and replay-safe: a second call against a candidate this
 * function already moved out of `generated` finds the stored report and
 * returns the same outcome without re-validating, re-moving, or writing a
 * duplicate report. Never transitions a candidate past
 * `structural_validation_passed` — later gates (correctness, semantic,
 * originality, difficulty, staging, publication) are out of scope for this
 * function entirely, by construction: it only ever calls `applyTransition`
 * with `to` fixed to `structural_validation_passed` or `rejected`.
 */
export async function orchestrateStructuralValidation(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateStructuralValidationOptions,
): Promise<StructuralValidationOrchestrationOutcome> {
  const reportId = buildReportId(candidateId);

  const generatedRaw = await repository.read("generated", candidateId);
  if (generatedRaw === undefined) {
    const existingReport = (await repository.read("reports", reportId)) as
      | StoredStructuralValidationReport
      | undefined;
    if (existingReport !== undefined) {
      return replayOutcome(candidateId, existingReport);
    }
    return { outcome: "not_found", candidateId };
  }

  if (typeof generatedRaw !== "object" || generatedRaw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'generated' record is not an object." };
  }
  const record = generatedRaw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";
  if (state !== "generated") {
    return { outcome: "not_generated", candidateId, actualState: state.length > 0 ? state : "unknown" };
  }

  const rawIngestion = record.ingestion;
  const ingestion =
    typeof rawIngestion === "object" && rawIngestion !== null
      ? { sourcePath: readStringField(rawIngestion as Record<string, unknown>, "sourcePath") }
      : undefined;

  const candidate: QuestionFactoryCandidate = {
    candidateId,
    state,
    question: record.question,
    provenance: record.provenance,
    ...(ingestion ? { ingestion } : {}),
  };

  const rawProvenance =
    typeof candidate.provenance === "object" && candidate.provenance !== null
      ? (candidate.provenance as Record<string, unknown>)
      : undefined;
  const blueprintId = rawProvenance ? readStringField(rawProvenance, "blueprintId") : undefined;

  let blueprintHash: string | undefined;
  if (blueprintId !== undefined) {
    const blueprintRecord = await repository.read("blueprints", blueprintId);
    if (blueprintRecord !== undefined) {
      blueprintHash = hashJson(blueprintRecord);
    }
  }

  const result = validateCandidateStructure(candidate, {
    validatedAt: options.validatedAt,
    ...(options.expected?.contentHash !== undefined
      ? { expectedContentHash: options.expected.contentHash }
      : {}),
    ...(options.expected?.revision !== undefined ? { expectedRevision: options.expected.revision } : {}),
    ...(options.expected?.blueprintId !== undefined
      ? { expectedBlueprintId: options.expected.blueprintId }
      : {}),
    ...(blueprintHash !== undefined ? { blueprintHash } : {}),
  });

  // Structural validation is a set of deterministic, literal checks with no
  // "cannot decide" outcome, so every failure here is unambiguous —
  // `hard_fail`, never `soft_fail`/`uncertain`. `decideGateFailureOutcome`
  // is still consulted (rather than hard-coding `"rejected"`) so this gate
  // stays on the shared governance policy path if that ever changes.
  const transitionTarget: CandidateState =
    result.status === "passed"
      ? "structural_validation_passed"
      : decideGateFailureOutcome({
          severity: "hard_fail",
          revisionCount: result.evidence.candidateRevision,
          maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
        });

  const transition = applyTransition("generated", transitionTarget, {
    revisionCount: result.evidence.candidateRevision,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
  });
  if (!transition.ok) {
    return { outcome: "repository_error", candidateId, message: transition.message };
  }

  const destinationCompartment = compartmentForState(
    transitionTarget,
    transitionTarget === "rejected" ? "structural" : undefined,
  );
  if (!destinationCompartment) {
    return {
      outcome: "repository_error",
      candidateId,
      message: `No storage compartment is defined for lifecycle state '${transitionTarget}'.`,
    };
  }

  const report: StoredStructuralValidationReport = { candidateId, result };
  const reportOutcome = await writeReportIfAbsent(repository, reportId, report);
  if (!reportOutcome.ok) {
    return { outcome: "repository_error", candidateId, message: reportOutcome.message };
  }

  let moveResult: MoveResult;
  try {
    moveResult = await repository.move(candidateId, "generated", destinationCompartment);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { outcome: "repository_error", candidateId, message: `Repository move failed: ${message}` };
  }
  if (!moveResult.ok) {
    return { outcome: "repository_error", candidateId, message: moveResult.message };
  }

  const replayed = reportOutcome.alreadyPresent || moveResult.replayed;
  if (result.status === "passed") {
    return { outcome: "passed", candidateId, evidence: result.evidence, replayed };
  }
  return { outcome: "rejected", candidateId, issues: result.issues, evidence: result.evidence, replayed };
}
