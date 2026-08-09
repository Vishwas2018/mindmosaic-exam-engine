import { FACTORY_THRESHOLDS } from "../config";
import { identitiesAreIndependent, type NormalisedIdentity } from "../config/identity-normalisation";
import {
  hashJson,
  isProductionGradeIndependentReview,
  type CandidateProvenance,
  type ReviewRecord,
} from "../provenance";
import { resolveBoundBlueprint } from "../shared/bound-blueprint";
import type { FactoryCompartment, FactoryRepository } from "../storage";
import { compartmentForState } from "../storage";
import { checkAgainstProductionSchema, parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { applyTransition, classifySemanticCategory, decideGateFailureOutcome } from "../workflow";
import { writeSemanticCompletionEvidence } from "./governed-semantic-evidence-writer";

/**
 * Scans a candidate's full, chain-verified review history and asks: does
 * *any* record in it qualify as production-grade independent evidence?
 * Reuses `isProductionGradeIndependentReview` per-record rather than
 * reimplementing its chain-verification/independence/confidence/
 * ambiguity checks.
 *
 * **`expectedTerminalReviewHash` honesty note.** Here it is derived from
 * the same `chain` array being tested (`chain[chain.length - 1].reviewHash`),
 * because this function's only caller reads the whole chain fresh, once,
 * from trusted storage within a single call — there is no separate,
 * independently-captured terminal-hash value available to compare
 * against. That means `isProductionGradeIndependentReview`'s "is the
 * presented chain the one the caller actually expects, not a truncated
 * substitute" check is a no-op *for this specific call site* (it always
 * compares a value to itself); what this function still genuinely
 * enforces is per-record chain-internal integrity (`verifyReviewChain`),
 * that the claimed `reviewHash` is actually present in the chain and
 * belongs to *this* candidate (never a hash borrowed from elsewhere), and
 * the real independence/confidence/evidence/ambiguity checks. A future
 * caller that obtains `chain` and an expected terminal hash from two
 * genuinely different sources (e.g. a chain re-read after some elapsed
 * time, checked against a hash captured earlier) would get the full
 * substitution-detection benefit this parameter was designed for; this
 * one does not need it, because there is no such window here.
 */
/**
 * Mission 3D third audit remediation: extracted from
 * `hasIndependentReviewerRecordAtThreshold` (which now delegates here) so
 * the fresh-pass path below can stamp *which specific chain record*
 * satisfied the threshold onto the durable `sr-*` semantic-completion
 * evidence it mints — never just a boolean. Same scan, same qualification
 * rule, unchanged behaviour.
 */
function findIndependentReviewerRecordAtThreshold(
  generatorIdentity: NormalisedIdentity,
  chain: readonly ReviewRecord[],
  current: { readonly candidateId: string; readonly contentHash: string; readonly blueprintHash: string; readonly revision: number },
): ReviewRecord | undefined {
  if (chain.length === 0) return undefined;
  const expectedTerminalReviewHash = chain[chain.length - 1]!.reviewHash;
  return chain.find((record) =>
    isProductionGradeIndependentReview(
      generatorIdentity,
      { chain, reviewHash: record.reviewHash, expectedTerminalReviewHash },
      {
        candidateId: current.candidateId,
        contentHash: current.contentHash,
        blueprintHash: current.blueprintHash,
        revision: current.revision,
      },
      FACTORY_THRESHOLDS.PRODUCTION_REVIEW_CONFIDENCE,
    ),
  );
}

function hasIndependentReviewerRecordAtThreshold(
  generatorIdentity: NormalisedIdentity,
  chain: readonly ReviewRecord[],
  current: { readonly candidateId: string; readonly contentHash: string; readonly blueprintHash: string; readonly revision: number },
): boolean {
  return findIndependentReviewerRecordAtThreshold(generatorIdentity, chain, current) !== undefined;
}

export type SemanticReviewOrchestrationOutcome =
  | { readonly outcome: "passed"; readonly candidateId: string; readonly replayed: boolean }
  | { readonly outcome: "quarantined"; readonly candidateId: string; readonly reason: string }
  | { readonly outcome: "needs_revision"; readonly candidateId: string }
  | { readonly outcome: "rejected"; readonly candidateId: string }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | { readonly outcome: "invalid_lifecycle_state"; readonly candidateId: string; readonly actualState: string }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Attempts the `correctness_check_passed -> semantic_review_passed`
 * transition (contract §3, §7) for one candidate, using whatever
 * `provenance.reviewRecords` chain is *already stored* on it at call
 * time. Never appends a review itself — `review-ingest.ts` appends
 * first, then calls this; a `deterministically_computable` candidate can
 * legitimately reach `semantic_review_passed` through this same function
 * with an empty chain, since `canAdvanceToSemanticReviewPassed` does not
 * require independent evidence for that classification.
 *
 * Idempotent/replay-safe: a candidate already at `semantic_review_passed`
 * or a terminal failure state is read directly and reported without any
 * further mutation attempt.
 */
export async function attemptSemanticReviewTransition(
  candidateId: string,
  repository: FactoryRepository,
): Promise<SemanticReviewOrchestrationOutcome> {
  const raw = await repository.read("review-queue", candidateId);
  if (raw === undefined) {
    // Not in review-queue: either never existed, or already moved to a
    // terminal destination this gate can produce (rejected/semantic,
    // quarantined). The full record (including its reviewRecords chain)
    // survives verbatim at its new location, so there is no separate
    // cached-report replay path to maintain here.
    // Mutually exclusive compartments (a candidate lives in at most one),
    // so both reads are independent and safe to issue concurrently.
    const [rejectedRaw, quarantinedRaw] = await Promise.all([
      repository.read("rejected/semantic", candidateId),
      repository.read("quarantined", candidateId),
    ]);
    const terminalRaw = rejectedRaw ?? quarantinedRaw;
    if (terminalRaw !== undefined) {
      const terminalRecord = terminalRaw as Record<string, unknown>;
      const state = readStringField(terminalRecord, "state") ?? "unknown";
      return state === "rejected"
        ? { outcome: "rejected", candidateId }
        : { outcome: "quarantined", candidateId, reason: "previously_quarantined" };
    }
    return { outcome: "not_found", candidateId };
  }

  if (typeof raw !== "object" || raw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'review-queue' record is not an object." };
  }
  const record = raw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";

  if (state === "semantic_review_passed") {
    return { outcome: "passed", candidateId, replayed: true };
  }
  if (state === "needs_revision") {
    return { outcome: "needs_revision", candidateId };
  }
  if (state !== "correctness_check_passed") {
    return { outcome: "invalid_lifecycle_state", candidateId, actualState: state.length > 0 ? state : "unknown" };
  }

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    return {
      outcome: "repository_error",
      candidateId,
      message: "Candidate no longer parses against the schemas structural validation attested.",
    };
  }
  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    return {
      outcome: "repository_error",
      candidateId,
      message: "Candidate question no longer satisfies the production schema despite passed structural evidence.",
    };
  }
  const provenance: CandidateProvenance = provenanceOutcome.data;

  // Mission 3B blueprint remediation: the bound blueprint must resolve and
  // verify before this gate evaluates evidence or attempts any transition.
  // Previously a missing/unreadable/invalid blueprint silently produced an
  // *empty-string* hash here, which could never match any chain record's
  // (schema-required, non-empty) evidence-binding hash — so the gate
  // proceeded to "no independent evidence" and **moved the candidate to
  // quarantine** on the basis of an unverifiable blueprint binding. Now an
  // unresolvable blueprint is a deterministic, typed refusal: no evidence
  // evaluation, no lifecycle transition, no compartment movement.
  const blueprintResolution = await resolveBoundBlueprint(provenance.blueprintId, repository);
  if (!blueprintResolution.ok) {
    return {
      outcome: "repository_error",
      candidateId,
      message: `Candidate '${candidateId}' declares bound blueprint '${provenance.blueprintId}', which could not be resolved (${blueprintResolution.kind}): ${blueprintResolution.message}`,
    };
  }
  const blueprintHash = blueprintResolution.blueprintHash;

  const semanticClassification = classifySemanticCategory(productionSchemaOutcome.question);
  const evidenceAvailable = hasIndependentReviewerRecordAtThreshold(provenance.generatorAdapter.identity, provenance.reviewRecords, {
    candidateId,
    contentHash: provenance.contentHash,
    blueprintHash,
    revision: provenance.revision,
  });

  const transition = applyTransition("correctness_check_passed", "semantic_review_passed", {
    revisionCount: provenance.revision,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
    semanticReviewGate: {
      semanticClassification,
      hasIndependentReviewerRecordAtThreshold: evidenceAvailable,
    },
  });

  if (!transition.ok) {
    // The only failure this gate's own gate function can produce is
    // "missing independent evidence" (contract §3: "there is nothing to
    // revise yet, only a missing review" — always quarantined, never
    // needs_revision, regardless of whether no review was ever ingested
    // or an ingested review merely fell short of the threshold; the
    // implemented `canAdvanceToSemanticReviewPassed`/`applyTransition`
    // API gives no signal to distinguish those two sub-cases further).
    const destination = decideGateFailureOutcome({
      severity: "uncertain",
      revisionCount: provenance.revision,
      maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
    });
    if (destination !== "quarantined") {
      return { outcome: "repository_error", candidateId, message: `Unexpected gate-failure destination '${destination}'.` };
    }
    const moveResult = await repository.move(candidateId, "review-queue", "quarantined");
    if (!moveResult.ok) {
      return { outcome: "repository_error", candidateId, message: moveResult.message };
    }
    return { outcome: "quarantined", candidateId, reason: transition.reason };
  }

  const destinationCompartment: FactoryCompartment | undefined = compartmentForState("semantic_review_passed");
  if (destinationCompartment === undefined) {
    return { outcome: "repository_error", candidateId, message: "No storage compartment defined for 'semantic_review_passed'." };
  }

  // Mission 3D third audit remediation: mint the durable sr-* evidence for
  // *this exact pass* before the lifecycle transition itself is persisted
  // below — the same report-before-transition ordering discipline
  // `orchestrate-correctness-verification.ts` uses for its own attestation,
  // for the same crash-convergence reason. A crash between this write and
  // the transition write below leaves the candidate still at
  // `correctness_check_passed`; a retry re-enters this function, recomputes
  // the identical classification/evidence-availability facts, finds the
  // sr-* record already present (fingerprint match, safe no-op), and only
  // the transition write is retried.
  const completionPath: "deterministic_skip" | "independent_review" =
    semanticClassification === "deterministically_computable" ? "deterministic_skip" : "independent_review";
  const satisfyingReviewRecord =
    completionPath === "independent_review"
      ? findIndependentReviewerRecordAtThreshold(provenance.generatorAdapter.identity, provenance.reviewRecords, {
          candidateId,
          contentHash: provenance.contentHash,
          blueprintHash,
          revision: provenance.revision,
        })
      : undefined;
  const evidenceWriteOutcome = await writeSemanticCompletionEvidence(repository, {
    candidateId,
    candidateRevision: provenance.revision,
    candidateContentHash: provenance.contentHash,
    blueprintHash,
    semanticClassification,
    completionPath,
    ...(satisfyingReviewRecord !== undefined ? { satisfyingReviewHash: satisfyingReviewRecord.reviewHash } : {}),
    completedAt: new Date().toISOString(),
  });
  if (!evidenceWriteOutcome.ok) {
    return { outcome: "repository_error", candidateId, message: evidenceWriteOutcome.message };
  }

  if (destinationCompartment === "review-queue") {
    const updatedRecord: Record<string, unknown> = { ...record, state: "semantic_review_passed" };
    const updateResult = await repository.update("review-queue", candidateId, updatedRecord, {
      expectedContentHash: hashJson(record),
    });
    if (!updateResult.ok) {
      return { outcome: "repository_error", candidateId, message: updateResult.message };
    }
    return { outcome: "passed", candidateId, replayed: updateResult.replayed };
  }

  const moveResult = await repository.move(candidateId, "review-queue", destinationCompartment);
  if (!moveResult.ok) {
    return { outcome: "repository_error", candidateId, message: moveResult.message };
  }
  return { outcome: "passed", candidateId, replayed: moveResult.replayed };
}

/** Exported for direct testing of the chain-scan policy in isolation from the full orchestrator. */
export { hasIndependentReviewerRecordAtThreshold };

/** Small, local re-export so callers of this module never need a second import path for the independence check semantic review relies on. */
export { identitiesAreIndependent };
