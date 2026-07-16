import { blueprintSchema } from "../blueprints";
import { FACTORY_THRESHOLDS, FACTORY_VERSIONS, normaliseIdentity } from "../config";
import { candidateQuestionSchema } from "../ingestion/candidate-question";
import { hashJson, type CandidateProvenance } from "../provenance";
import type { FactoryRepository } from "../storage";
import { parseCandidateProvenance } from "../validation";
import {
  checkRevisionBlueprintCompatibility,
  describeRevisionBlueprintMismatches,
} from "./blueprint-compatibility";
import { mintRevisionCandidateId } from "./identity";
import { reviseIngestionInputSchema, type ReviseIngestionInput, type ReviseOutcome } from "./types";

const REVISION_ADAPTER_VERSION = "1";
/** Fixed — there is no separate revision-prompt template in Mission 3C: `questions:revise` takes already-authored corrected content directly. */
const REVISION_PROMPT_VERSION = "revision-v1";
/** Bounded retry after losing an optimistic-concurrency race on the *parent's* successor-slot claim — mirrors `review-ingest.ts`'s identical `MAX_APPEND_CONTENTION_RETRIES` (Mission 3B P1-2), never an unbounded retry loop. */
const MAX_CLAIM_CONTENTION_RETRIES = 1;

function readStringField(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

/** `id` is minted fresh per candidate (never trusted from caller-declared content — same discipline `manual-ingestion/ingest.ts` uses), so it must be excluded before comparing two candidates' content for material equivalence. */
function stripId(value: unknown): unknown {
  if (typeof value !== "object" || value === null) return value;
  const rest = { ...(value as Record<string, unknown>) };
  delete rest.id;
  return rest;
}

/**
 * `hashJson` over every content-bearing field of `ReviseIngestionInput`
 * except `requestedAt` — mirrors `review-ingest.ts`'s
 * `computeReviewResultFingerprint` exactly, for the same reason: this
 * answers "is a resubmission under the same `revisionRequestId` literally
 * the same request, or a changed one" — a narrower idempotency-only
 * question than the stored `contentHash`, and (Mission 3C) is stamped
 * directly onto the *parent's* `supersededBy` claim rather than kept in a
 * separate index.
 */
function computeRevisionFingerprint(input: ReviseIngestionInput): string {
  return hashJson({
    parentCandidateId: input.parentCandidateId,
    parentContentHash: input.parentContentHash,
    parentRevision: input.parentRevision,
    parentBlueprintHash: input.parentBlueprintHash,
    revisedContent: input.revisedContent,
    authorModel: input.authorModel,
    revisionNotes: input.revisionNotes,
  });
}

interface ParentReadResult {
  readonly record: Record<string, unknown>;
  readonly provenance: CandidateProvenance;
}

type ParentReadOutcome =
  | { readonly ok: true; readonly data: ParentReadResult }
  | {
      readonly ok: false;
      readonly issueCode: "unknown_parent_candidate" | "invalid_revision_source_state" | "repository_error";
      readonly message: string;
    };

/** Reads and validates the parent candidate's current lifecycle state/shape — shared by the fresh-claim path and the post-conflict re-read. */
async function readEligibleParent(parentCandidateId: string, repository: FactoryRepository): Promise<ParentReadOutcome> {
  const raw = await repository.read("review-queue", parentCandidateId);
  if (raw === undefined) {
    return { ok: false, issueCode: "unknown_parent_candidate", message: `No candidate '${parentCandidateId}' found in review-queue.` };
  }
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, issueCode: "repository_error", message: "Stored parent candidate record is not an object." };
  }
  const record = raw as Record<string, unknown>;
  const state = readStringField(record, "state") ?? "";
  if (state !== "needs_revision") {
    return {
      ok: false,
      issueCode: "invalid_revision_source_state",
      message: `Candidate '${parentCandidateId}' is at lifecycle state '${state || "unknown"}', not eligible for revision (must be 'needs_revision').`,
    };
  }

  const provenanceOutcome = parseCandidateProvenance(record.provenance);
  if (!provenanceOutcome.ok) {
    return { ok: false, issueCode: "repository_error", message: "Parent candidate does not parse against the required provenance schema." };
  }

  return { ok: true, data: { record, provenance: provenanceOutcome.data } };
}

type ClaimResolution =
  | { readonly kind: "claim_fresh" }
  | { readonly kind: "replay_child"; readonly candidateId: string }
  | { readonly kind: "request_conflict" }
  | { readonly kind: "parent_conflict" };

/**
 * Mission 3C: resolves the parent's `supersededBy` claim **from the parent
 * record itself** — never a separate sidecar index, directly applying the
 * Mission 3B P1-2 lesson (`review-ingest.ts`'s `resolveIdempotency`) to the
 * revision-conflict problem. A parent with no claim yet is fresh; a claim
 * matching both `revisionRequestId` and `revisionFingerprint` is this
 * exact request replaying; a claim matching `revisionRequestId` with a
 * *different* fingerprint is a genuine request conflict; a claim under a
 * *different* `revisionRequestId` at all is a parent conflict — refused
 * regardless of whether the content happens to coincide, because
 * canonicality is decided by which request was accepted, not by content
 * equality (no first-wins lookup without full evidence verification, no
 * implicit branching revision graph).
 */
function resolveClaim(provenance: CandidateProvenance, revisionRequestId: string, freshFingerprint: string): ClaimResolution {
  const existing = provenance.supersededBy;
  if (existing === undefined) return { kind: "claim_fresh" };
  if (existing.revisionRequestId !== revisionRequestId) return { kind: "parent_conflict" };
  return existing.revisionFingerprint === freshFingerprint
    ? { kind: "replay_child", candidateId: existing.candidateId }
    : { kind: "request_conflict" };
}

/**
 * `questions:revise`'s core logic (Mission 3C plan §7a): validates an
 * already-JSON-parsed revision request, checks every binding field against
 * the parent's *current* stored state, resolves the parent's
 * `supersededBy` claim (evidence-verified optimistic concurrency — at most
 * one canonical successor per parent, ever), and creates the revised
 * candidate as a brand-new record entering at `generated` with zero
 * inherited evidence. Every rejection path performs no mutation
 * whatsoever — no parent claim, no child record, no lifecycle change.
 *
 * **Why a dedicated module, not an extension of `manual-ingestion/`.**
 * Initial candidate creation and revision of governed evidence have
 * materially different identity semantics (fresh vs. parent-derived id),
 * parent binding (none vs. mandatory), stale-input checks (none vs.
 * `stale_revision_parent`), provenance requirements (`revision: 0` vs.
 * `revision = parent.revision + 1` plus the `supersededBy` claim
 * protocol), replay rules (content-hash-keyed only vs. a client-supplied
 * `revisionRequestId` + fingerprint pair), and lifecycle prerequisites
 * (none vs. `needs_revision` only) — conflating them into one CLI's flag
 * surface would make each harder to reason about and audit independently.
 * `manual-ingestion/` and `questions:ingest` are untouched by this module.
 *
 * **Crash window between claiming the parent's successor slot and
 * creating the child.** Self-healing, not corruption: a retry under the
 * *same* `revisionRequestId`/content lands on `resolveClaim`'s
 * `replay_child` branch and proceeds straight to child creation, which is
 * itself idempotent via `FactoryRepository.create()`'s existing
 * duplicate-content replay. A *different* request arriving in that same
 * window is correctly refused with `revision_parent_conflict` — the claim
 * alone is authoritative, never the child's mere existence.
 */
export async function ingestRevision(rawInput: unknown, repository: FactoryRepository): Promise<ReviseOutcome> {
  const parsed = reviseIngestionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      status: "rejected",
      issueCode: "malformed_revision_request",
      message: `Revision request failed schema validation: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`,
    };
  }
  const input = parsed.data;
  if (typeof input.revisedContent !== "object" || input.revisedContent === null) {
    return { status: "rejected", issueCode: "malformed_revision_request", message: "revisedContent must be a JSON object." };
  }
  const freshFingerprint = computeRevisionFingerprint(input);

  return attemptRevision(input, freshFingerprint, repository, MAX_CLAIM_CONTENTION_RETRIES);
}

async function attemptRevision(
  input: ReviseIngestionInput,
  freshFingerprint: string,
  repository: FactoryRepository,
  retriesRemaining: number,
): Promise<ReviseOutcome> {
  const parentOutcome = await readEligibleParent(input.parentCandidateId, repository);
  if (!parentOutcome.ok) {
    return { status: "rejected", issueCode: parentOutcome.issueCode, message: parentOutcome.message };
  }
  const { record: parentRecord, provenance } = parentOutcome.data;

  // --- Binding checks against the parent's *current* stored state --------
  if (input.parentContentHash !== provenance.contentHash || input.parentRevision !== provenance.revision) {
    return {
      status: "rejected",
      issueCode: "stale_revision_parent",
      message: `Revision declares parent content hash/revision that no longer match candidate '${input.parentCandidateId}''s current stored state.`,
    };
  }

  let blueprintHash: string | undefined;
  const blueprintRecord = await repository.read("blueprints", provenance.blueprintId);
  if (blueprintRecord !== undefined) {
    blueprintHash = hashJson(blueprintRecord);
  }
  if (blueprintHash !== undefined && input.parentBlueprintHash !== blueprintHash) {
    return {
      status: "rejected",
      issueCode: "revision_blueprint_mismatch",
      message: `Revision's declared parentBlueprintHash does not match candidate '${input.parentCandidateId}''s current blueprint binding — a revision must target the exact same blueprint the parent's review findings were written against.`,
    };
  }

  // --- Blueprint-content compatibility: the hash check above only proves
  // the caller *referenced* the same blueprint record — it says nothing
  // about whether the revised content itself still conforms to that
  // blueprint's immutable cohort/subject/exam-style/skill/question-type
  // constraints. Checked here, before any mutation, so an incompatible
  // revision is refused before the parent is claimed or a child is
  // written — never left to structural validation, which only runs after
  // the child already exists at `generated`. ---
  const parsedBlueprint = blueprintRecord !== undefined ? blueprintSchema.safeParse(blueprintRecord) : undefined;
  if (parsedBlueprint?.success) {
    const mismatches = checkRevisionBlueprintCompatibility(input.revisedContent, parsedBlueprint.data);
    if (mismatches.length > 0) {
      return {
        status: "rejected",
        issueCode: "revision_blueprint_mismatch",
        message: `Revised content for candidate '${input.parentCandidateId}' is not compatible with the parent's bound blueprint '${provenance.blueprintId}': ${describeRevisionBlueprintMismatches(mismatches)}.`,
      };
    }
  }

  // --- Revision-limit check: a second, independent enforcement point,
  // fail closed as early as possible — `applyTransition`'s own check
  // (already implemented, Mission 1) still applies later in the pipeline
  // regardless. ---
  if (input.parentRevision + 1 > FACTORY_THRESHOLDS.MAX_REVISIONS) {
    return {
      status: "rejected",
      issueCode: "revision_limit_exhausted",
      message: `Candidate lineage rooted at '${input.parentCandidateId}' has already reached the revision limit (${FACTORY_THRESHOLDS.MAX_REVISIONS}).`,
    };
  }

  if (hashJson(stripId(input.revisedContent)) === hashJson(stripId(parentRecord.question))) {
    return {
      status: "rejected",
      issueCode: "revision_no_material_change",
      message: `Revised content for candidate '${input.parentCandidateId}' is not materially different from the parent's current content.`,
    };
  }

  const authorIdentity = normaliseIdentity(input.authorModel);
  if (!authorIdentity) {
    return {
      status: "rejected",
      issueCode: "unsupported_author_identity",
      message: `Declared author model '${input.authorModel}' does not resolve through the identity-alias table.`,
    };
  }

  // --- Parent-version-binding / supersession-claim resolution ------------
  const claimResolution = resolveClaim(provenance, input.revisionRequestId, freshFingerprint);
  if (claimResolution.kind === "request_conflict") {
    return {
      status: "rejected",
      issueCode: "revision_request_conflict",
      message: `Revision request '${input.revisionRequestId}' was already submitted for parent '${input.parentCandidateId}' with different content — use a new revisionRequestId for a genuinely different revision.`,
    };
  }
  if (claimResolution.kind === "parent_conflict") {
    return {
      status: "rejected",
      issueCode: "revision_parent_conflict",
      message: `Candidate '${input.parentCandidateId}' already has an accepted successor from a different revision request — only one canonical successor is permitted per parent version.`,
    };
  }

  const revisedContentHash = hashJson(input.revisedContent);
  let candidateId: string;
  if (claimResolution.kind === "replay_child") {
    candidateId = claimResolution.candidateId;
  } else {
    candidateId = mintRevisionCandidateId({
      parentCandidateId: input.parentCandidateId,
      revisionRequestId: input.revisionRequestId,
      revisedContentHash,
    });

    const updatedParentRecord: Record<string, unknown> = {
      ...parentRecord,
      provenance: {
        ...provenance,
        supersededBy: {
          candidateId,
          revisionRequestId: input.revisionRequestId,
          revisionFingerprint: freshFingerprint,
          claimedAt: new Date().toISOString(),
        },
      },
    };

    // The single durable write that claims this parent version's
    // successor slot — guarded by the exact content this attempt read
    // above, so a genuine out-of-band change is refused, never silently
    // overwritten.
    const claimResult = await repository.update("review-queue", input.parentCandidateId, updatedParentRecord, {
      expectedContentHash: hashJson(parentRecord),
    });

    if (!claimResult.ok) {
      if (claimResult.reason === "state_mismatch" && retriesRemaining > 0) {
        return attemptRevision(input, freshFingerprint, repository, retriesRemaining - 1);
      }
      return {
        status: "rejected",
        issueCode: "repository_error",
        message: `Failed to claim parent's successor slot: ${claimResult.message}`,
      };
    }
  }

  // --- Create the child: brand-new candidate, zero inherited evidence ----
  const withMintedId: Record<string, unknown> = { ...(input.revisedContent as Record<string, unknown>), id: candidateId };
  const preflightParse = candidateQuestionSchema.safeParse(withMintedId);
  const question: Record<string, unknown> = preflightParse.success
    ? (preflightParse.data as unknown as Record<string, unknown>)
    : withMintedId;
  const contentHash = hashJson(question);

  const childProvenance = {
    candidateId,
    blueprintId: provenance.blueprintId,
    batchId: provenance.batchId,
    // The revision request itself is the "run" that produced this
    // candidate — reusing its id directly here (both already validated
    // against the same `factoryIdentifierSchema` shape) makes the child's
    // own provenance a self-contained audit trail back to the exact
    // request that created it.
    pipelineRunId: input.revisionRequestId,
    revision: input.parentRevision + 1,
    generatedAt: input.requestedAt,
    generatorAdapter: { class: "manual_external" as const, identity: authorIdentity },
    generatorVersion: REVISION_ADAPTER_VERSION,
    promptVersion: REVISION_PROMPT_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    contentHash,
    parentCandidateId: input.parentCandidateId,
    reviewRecords: [],
  };

  const childRecord: Record<string, unknown> = {
    candidateId,
    state: "generated",
    question,
    provenance: childProvenance,
  };

  const createResult = await repository.create("generated", candidateId, childRecord);
  let childReplayed: boolean;
  if (!createResult.ok) {
    if (createResult.reason === "duplicate_candidate") {
      const existingChild = await repository.read("generated", candidateId);
      const existingProvenanceHash =
        typeof existingChild === "object" && existingChild !== null
          ? hashJson((existingChild as Record<string, unknown>).provenance)
          : undefined;
      if (existingProvenanceHash === hashJson(childProvenance)) {
        childReplayed = true;
      } else {
        return {
          status: "rejected",
          issueCode: "repository_error",
          message: `A different candidate record already exists at the deterministic revision id '${candidateId}' — refusing to overwrite.`,
        };
      }
    } else {
      return { status: "rejected", issueCode: "repository_error", message: `Failed to create revised candidate: ${createResult.message}` };
    }
  } else {
    childReplayed = false;
  }

  return {
    status: "accepted",
    parentCandidateId: input.parentCandidateId,
    candidateId,
    revisionRequestId: input.revisionRequestId,
    revision: childProvenance.revision,
    replayed: childReplayed,
  };
}
