import { verifyUpstreamGateChain } from "../gate-chain";
import { hashJson } from "../provenance";
import type { FactoryRepository } from "../storage";
import { compartmentForState } from "../storage";
import { parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { applyTransition } from "../workflow";
import type { StagingIssueCode } from "../config";
import { FACTORY_THRESHOLDS } from "../config";

export interface StagingIssue {
  readonly code: StagingIssueCode;
  readonly path: string;
  readonly message: string;
}

export type StagingOutcome =
  | {
      readonly outcome: "staged";
      readonly candidateId: string;
      readonly contentHash: string;
      readonly revision: number;
      readonly replayed: boolean;
    }
  | { readonly outcome: "not_found"; readonly candidateId: string }
  | { readonly outcome: "invalid_lifecycle_state"; readonly candidateId: string; readonly actualState: string }
  | { readonly outcome: "upstream_evidence_invalid"; readonly candidateId: string; readonly issues: readonly StagingIssue[] }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function issue(code: StagingIssueCode, path: string, message: string): StagingIssue {
  return { code, path, message };
}

/**
 * Lifecycle orchestration for the staging step
 * (`difficulty_review_passed -> staged`) — the first half of the missing
 * Mission 3E wiring: previously the pipeline had a legal transition edge
 * for this hop (`workflow/transitions.ts`) but no code path that ever
 * exercised it, so every candidate that finished the five-gate pipeline
 * dead-ended at `difficulty_review_passed` forever.
 *
 * Before moving anything, this re-verifies the **entire** upstream gate
 * chain — structural, correctness (including the independent semantic
 * review that `review_required` correctness demands), originality and
 * difficulty — each bound to the candidate's *current* content hash and
 * revision, via `verifyUpstreamGateChain`. The candidate's stored `state`
 * field is never trusted as proof a real gate ran (mirrors every other gate
 * orchestrator's "recompute/verify, don't trust a bare field" discipline in
 * this codebase).
 *
 * P0-A: this originally verified the difficulty report *alone*, treating
 * `difficulty_review_passed` as a proxy for the four earlier gates. See
 * `gate-chain/verify-gate-chain.ts` for what that cost.
 */
export async function orchestrateStaging(
  candidateId: string,
  repository: FactoryRepository,
): Promise<StagingOutcome> {
  // Idempotent replay: already staged.
  const alreadyStagedRaw = await repository.read("staged", candidateId);
  if (typeof alreadyStagedRaw === "object" && alreadyStagedRaw !== null) {
    const record = alreadyStagedRaw as Record<string, unknown>;
    const provenanceOutcome = parseCandidateProvenance(record.provenance);
    return {
      outcome: "staged",
      candidateId,
      contentHash: provenanceOutcome.ok ? provenanceOutcome.data.contentHash : "",
      revision: provenanceOutcome.ok ? provenanceOutcome.data.revision : 0,
      replayed: true,
    };
  }

  const reviewQueueRaw = await repository.read("review-queue", candidateId);
  if (reviewQueueRaw === undefined) {
    return { outcome: "not_found", candidateId };
  }
  if (typeof reviewQueueRaw !== "object" || reviewQueueRaw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'review-queue' record is not an object." };
  }
  const record = reviewQueueRaw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";
  if (state !== "difficulty_review_passed") {
    return { outcome: "invalid_lifecycle_state", candidateId, actualState: state.length > 0 ? state : "unknown" };
  }

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  if (!provenanceOutcome.ok) {
    return {
      outcome: "upstream_evidence_invalid",
      candidateId,
      issues: [issue("staging_evidence_missing", "provenance", "Candidate provenance does not parse against the provenance schema.")],
    };
  }
  const provenance = provenanceOutcome.data;

  const questionOutcome = parseCandidateQuestion(record.question);
  if (!questionOutcome.ok) {
    return {
      outcome: "upstream_evidence_invalid",
      candidateId,
      issues: [issue("staging_evidence_missing", "question", "Candidate question does not parse against the candidate-question schema.")],
    };
  }
  if (hashJson(questionOutcome.data) !== provenance.contentHash) {
    return {
      outcome: "upstream_evidence_invalid",
      candidateId,
      issues: [
        issue(
          "staging_evidence_stale",
          "provenance.contentHash",
          "Stored content hash no longer matches the candidate's current question content.",
        ),
      ],
    };
  }

  // P0-A: every upstream gate is re-verified, not just difficulty. Staging
  // previously checked the difficulty report alone and trusted the
  // `difficulty_review_passed` state as proof the four earlier gates had
  // genuinely passed — the defect that let 132 `review_required`-correctness
  // candidates through to publication (see
  // `docs/reports/publication-288-posthoc-audit.md` and
  // `gate-chain/verify-gate-chain.ts`).
  const gateChain = await verifyUpstreamGateChain(
    { candidateId, provenance },
    repository,
  );
  if (!gateChain.ok) {
    return {
      outcome: "upstream_evidence_invalid",
      candidateId,
      issues: gateChain.failures.map((entry) =>
        issue("staging_upstream_evidence_invalid", entry.path, entry.message),
      ),
    };
  }

  const transition = applyTransition("difficulty_review_passed", "staged", {
    revisionCount: provenance.revision,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
  });
  if (!transition.ok) {
    return { outcome: "repository_error", candidateId, message: transition.message };
  }

  const destinationCompartment = compartmentForState("staged");
  if (!destinationCompartment) {
    return { outcome: "repository_error", candidateId, message: "No storage compartment is defined for lifecycle state 'staged'." };
  }

  const moveResult = await repository.move(candidateId, "review-queue", destinationCompartment);
  if (!moveResult.ok) {
    return { outcome: "repository_error", candidateId, message: moveResult.message };
  }

  // Best-effort state stamp: compartment membership in the single-purpose
  // `staged` compartment is itself authoritative (nothing else is ever
  // stored there — see `storage/compartments.ts`), matching this
  // codebase's existing precedent for a cross-compartment move into a
  // single-purpose destination (`orchestrate-difficulty-review.ts`'s move
  // into `rejected/difficulty`/`quarantined` does not stamp the `state`
  // field either). The stamp below is a readability nicety layered on
  // top, not a correctness dependency — nothing downstream trusts the
  // `state` field over the `staged` compartment itself.
  const stagedRecord = (await repository.read("staged", candidateId)) as Record<string, unknown> | undefined;
  if (stagedRecord !== undefined && readStringField(stagedRecord, "state") !== "staged") {
    try {
      await repository.update("staged", candidateId, { ...stagedRecord, state: "staged" }, { expectedContentHash: hashJson(stagedRecord) });
    } catch {
      // Non-fatal: the move itself already durably succeeded.
    }
  }

  return { outcome: "staged", candidateId, contentHash: provenance.contentHash, revision: provenance.revision, replayed: moveResult.replayed };
}
