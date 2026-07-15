import type { Question } from "@/schemas/question.schema";

import type { NormalisedIdentity } from "../config";
import type { ReviewRecordDraft } from "../provenance";
import type { SemanticClassification } from "../workflow";

/**
 * Everything a `Reviewer` needs to review one candidate. Pure input — no
 * repository handle, no filesystem path, no clock read (`reviewedAt` is
 * supplied by the caller when it turns a `ReviewOutcome` into a stored
 * `ReviewRecordDraft`) — mirroring `CorrectnessVerificationContext`'s
 * "no I/O inside the pure function" contract.
 *
 * `question` is the already-trusted, already-parsed candidate content
 * (structural validation has already run by the time a candidate reaches
 * this gate) — deliberately not the raw `QuestionFactoryCandidate` shape
 * (`question: unknown`) that upstream storage/validation types use, since
 * a `Reviewer` should never have to re-establish that trust boundary
 * itself.
 */
export interface ReviewContext {
  readonly question: Question;
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;
  readonly semanticClassification: SemanticClassification;
  /** Caller-supplied wall-clock read (the orchestration layer owns it, never the pure reviewer — mirrors `CorrectnessVerificationContext.verifiedAt`). */
  readonly reviewedAt: string;
}

/**
 * `record`: the reviewer has something to say — a fully-formed draft,
 * ready for `appendReviewRecord` to chain (never self-assembled with
 * `previousReviewHash`/`reviewHash` filled in).
 *
 * `deferred`: the reviewer declines to emit any record at all — the
 * correct outcome for a rule-based reviewer that found nothing wrong on
 * `semantic_objective`/`manual_review_writing` content: it has no basis
 * to assert anything, and asserting `"passed"` would be exactly the
 * self-approval the contract forbids (§7).
 */
export type ReviewOutcome =
  | { readonly kind: "record"; readonly draft: ReviewRecordDraft }
  | { readonly kind: "deferred"; readonly reason: "requires_independent_review" };

/**
 * Provider-neutral reviewer contract (Mission 3B, contract §7).
 * Intentionally symmetrical with `QuestionGenerator`
 * (`generation/types.ts`): neither a generator nor a reviewer is aware
 * of, or trusted more because of, what class it is.
 *
 * `reviewerClass` is an implementation-side label only — it is never
 * persisted onto `ReviewRecord` and never itself grants or withholds
 * trust. Reviewer *independence* is decided exclusively by
 * `identitiesAreIndependent` over the normalised identity triple
 * (`config/identity-normalisation.ts`), the same way for every class.
 */
export interface Reviewer {
  readonly reviewerClass: "deterministic_rule" | "fixture" | "external_independent";
  readonly reviewerIdentity: NormalisedIdentity;
  readonly reviewerVersion: string;
  review(context: ReviewContext): Promise<ReviewOutcome>;
}
