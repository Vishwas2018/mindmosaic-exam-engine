import { questionBank } from "@/content/questions/question-bank";

import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import type { FactoryRepository } from "../storage";
import { parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { applyTransition } from "../workflow";
import { buildPublishedQuestion } from "./build-published-question";
import { checkPublicationEligibility } from "./eligibility";
import type { PublicationIssue, PublicationManifest, PublicationOutcome } from "./types";

export interface OrchestratePublicationOptions {
  /** Caller-supplied, ISO 8601 — the orchestration layer owns the wall-clock read, never a pure helper. */
  readonly publishedAt: string;
  /**
   * Production ids to additionally treat as taken, beyond the curated
   * `questionBank` (checked automatically). Exists so a caller publishing
   * a whole batch in one pass can reserve ids across the batch without a
   * repository round-trip per candidate, and so tests can simulate a
   * collision deterministically.
   */
  readonly additionalReservedIds?: ReadonlySet<string>;
}

function issue(code: PublicationIssue["code"], path: string, message: string): PublicationIssue {
  return { code, path, message };
}

async function locateCandidateState(candidateId: string, repository: FactoryRepository): Promise<string> {
  const generated = await repository.read("generated", candidateId);
  if (generated !== undefined) return "generated";
  const reviewQueue = await repository.read("review-queue", candidateId);
  if (typeof reviewQueue === "object" && reviewQueue !== null) {
    const state = (reviewQueue as Record<string, unknown>).state;
    if (typeof state === "string" && state.length > 0) return state;
    return "review-queue";
  }
  return "not_found";
}

/**
 * Lifecycle orchestration for the publication step (`staged -> published`)
 * — the second, final half of the previously-missing Mission 3E wiring.
 * This is the only function in the codebase permitted to write into the
 * `published-manifests` compartment or to assert `status: "published"` on
 * a `Question`.
 *
 * **Only a candidate physically found in the `staged` compartment can
 * ever reach the success path.** Nothing outside `orchestrateStaging`'s
 * own re-verified move ever populates `staged` (see that module's doc
 * comment), and `orchestrateStaging` itself refuses to move anything that
 * is not genuinely at `difficulty_review_passed` with a fresh, passing
 * difficulty report. A candidate anywhere else in the workspace —
 * `generated`, `review-queue` at any earlier gate, `rejected/*`,
 * `quarantined` — is refused here with `outcome: "not_staged"`, never
 * silently promoted. This is the concrete mechanism behind the
 * requirement that an unapproved / staged-only item cannot be published.
 *
 * Idempotent: a second call for an already-published candidate (matching
 * content hash) replays the existing manifest rather than erroring or
 * duplicating; a second call with *different* staged content under the
 * same candidate id is refused as a collision, never silently
 * overwritten.
 */
export async function orchestratePublication(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestratePublicationOptions,
): Promise<PublicationOutcome> {
  const existingManifest = (await repository.read("published-manifests", candidateId)) as
    | PublicationManifest
    | undefined;

  const stagedRaw = await repository.read("staged", candidateId);
  if (stagedRaw === undefined) {
    if (existingManifest !== undefined) {
      // Content already left the workspace on a prior successful publish
      // (see `orchestrateStaging`/this function's "content leaves the
      // workspace" contract) — a safe replay, not a new not-staged case.
      return { outcome: "published", candidateId, manifest: existingManifest, replayed: true };
    }
    const foundState = await locateCandidateState(candidateId, repository);
    return { outcome: "not_staged", candidateId, foundState };
  }

  if (typeof stagedRaw !== "object" || stagedRaw === null) {
    return { outcome: "repository_error", candidateId, message: "Stored 'staged' record is not an object." };
  }
  const record = stagedRaw as Record<string, unknown>;

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  const questionOutcome = parseCandidateQuestion(record.question);
  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    return {
      outcome: "ineligible",
      candidateId,
      issues: [
        issue(
          "publication_upstream_evidence_invalid",
          "record",
          "The staged record's provenance/question no longer parse against their schemas.",
        ),
      ],
    };
  }
  const provenance = provenanceOutcome.data;
  const question = questionOutcome.data;

  if (existingManifest !== undefined) {
    if (existingManifest.contentHash === provenance.contentHash) {
      return { outcome: "published", candidateId, manifest: existingManifest, replayed: true };
    }
    return {
      outcome: "collision",
      candidateId,
      issues: [
        issue(
          "publication_id_reused_with_different_content",
          "candidateId",
          "A different publication manifest already exists for this candidate id.",
        ),
      ],
    };
  }

  const eligibility = await checkPublicationEligibility({ candidateId, question, provenance }, repository);
  if (!eligibility.ok) {
    return { outcome: "ineligible", candidateId, issues: eligibility.issues };
  }

  const transition = applyTransition("staged", "published", {
    revisionCount: provenance.revision,
    maxRevisions: FACTORY_THRESHOLDS.MAX_REVISIONS,
  });
  if (!transition.ok) {
    return {
      outcome: "ineligible",
      candidateId,
      issues: [issue("publication_upstream_evidence_invalid", "state", transition.message)],
    };
  }

  const built = buildPublishedQuestion(question);
  if (!built.ok) {
    return {
      outcome: "ineligible",
      candidateId,
      issues: built.issues.map((message) => issue("publication_upstream_evidence_invalid", "question", message)),
    };
  }

  const reservedIds = new Set<string>([
    ...questionBank.map((entry) => entry.id),
    ...(options.additionalReservedIds ?? []),
  ]);
  if (reservedIds.has(built.question.id)) {
    return {
      outcome: "collision",
      candidateId,
      issues: [
        issue(
          "publication_production_id_collision",
          "question.id",
          `Production id '${built.question.id}' is already in use by an existing production question.`,
        ),
      ],
    };
  }

  const manifestFacts = {
    candidateId,
    questionId: built.question.id,
    contentHash: provenance.contentHash,
    revision: provenance.revision,
    blueprintId: provenance.blueprintId,
    batchId: provenance.batchId,
    generatorAdapter: provenance.generatorAdapter,
    originalityFingerprint: eligibility.originalityFingerprint,
    difficultyFingerprint: eligibility.difficultyFingerprint,
    publishedAt: options.publishedAt,
    question: built.question,
  };
  const manifest: PublicationManifest = { ...manifestFacts, manifestFingerprint: hashJson(manifestFacts) };

  // Content leaves the factory workspace on publish — only the manifest
  // remains, per `storage/state-compartment-mapping.ts`'s documented
  // `published` contract ("published has no workspace compartment"). This
  // must happen *before* the manifest is created: `FactoryRepository.create`
  // enforces candidate-id uniqueness workspace-wide ("one canonical
  // location per candidate at a time"), so the `staged` record and a
  // `published-manifests` record under the same id can never coexist —
  // attempting to create the manifest first would always fail with
  // "already exists in compartment 'staged'".
  await repository.remove("staged", candidateId);

  const createResult = await repository.create("published-manifests", candidateId, manifest);
  if (!createResult.ok) {
    // Lost a race against a concurrent publish of the same candidate (both
    // observed the staged record and both removed it) — whichever landed
    // first is authoritative; trust it only if its content genuinely
    // matches what this call was about to publish, mirroring every other
    // orchestrator's fingerprint-based replay idiom.
    const raced = (await repository.read("published-manifests", candidateId)) as PublicationManifest | undefined;
    if (raced !== undefined && raced.contentHash === provenance.contentHash) {
      return { outcome: "published", candidateId, manifest: raced, replayed: true };
    }
    return { outcome: "repository_error", candidateId, message: createResult.message };
  }

  return { outcome: "published", candidateId, manifest, replayed: false };
}
