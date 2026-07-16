import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import type { RevisionIssueCode } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";

export type { SupersessionClaim } from "../provenance";

/**
 * `questions:revise`'s input contract (Mission 3C plan §7a). Deliberately
 * its own schema, not an extension of `manual-ingestion`'s
 * `ManualIngestionRunRequest` — see `revision/revise.ts`'s class doc for
 * the six concrete reasons revision and initial ingestion are not the same
 * shape. `revisionRequestId` is a client-supplied idempotency key, mirroring
 * `reviewIngestionInputSchema.reviewId` (Mission 3B). `parentContentHash`/
 * `parentRevision`/`parentBlueprintHash` are the caller's declared belief
 * about the parent's current state, re-checked against the parent's actual
 * stored values before anything is mutated (`stale_revision_parent`/
 * `revision_blueprint_mismatch`).
 */
export const reviseIngestionInputSchema = z.object({
  revisionRequestId: factoryIdentifierSchema,
  parentCandidateId: factoryIdentifierSchema,
  parentContentHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  parentRevision: z.number().int().nonnegative(),
  parentBlueprintHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH),
  /** The full corrected candidate question JSON — parsed/validated downstream by structural validation, never here. */
  revisedContent: z.unknown(),
  /** Raw declared identity string, resolved through the existing `normaliseIdentity` alias table — never trusted as already-normalised. */
  authorModel: z.string().trim().min(1).max(FACTORY_LIMITS.IDENTITY_MODEL_ID_MAX_LENGTH),
  revisionNotes: z
    .array(z.string().trim().min(1).max(FACTORY_LIMITS.REVIEW_MAX_FINDING_LENGTH))
    .max(FACTORY_LIMITS.MAX_REVISION_NOTES)
    .optional(),
  /** ISO 8601 — excluded from `revisionFingerprint` so a retry that only differs by wall-clock time always matches. */
  requestedAt: z.iso.datetime(),
});

export type ReviseIngestionInput = z.infer<typeof reviseIngestionInputSchema>;

export type ReviseOutcome =
  | {
      readonly status: "accepted";
      readonly parentCandidateId: string;
      readonly candidateId: string;
      readonly revisionRequestId: string;
      readonly revision: number;
      readonly replayed: boolean;
    }
  | { readonly status: "rejected"; readonly issueCode: RevisionIssueCode; readonly message: string };
