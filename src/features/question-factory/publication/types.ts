import type { Question } from "@/schemas/question.schema";

import type { PublicationIssueCode } from "../config";
import type { GeneratorAdapter, ReviewRecord } from "../provenance";
import type { ChainOrigin, CorrectnessBasis, RecoveredReviewEvidence } from "./manifest-schema";

export interface PublicationIssue {
  readonly code: PublicationIssueCode;
  readonly path: string;
  readonly message: string;
}

/**
 * The durable, tracked record `orchestratePublication` writes into the
 * `published-manifests` compartment on a successful publish. It carries
 * enough of the candidate's provenance/fingerprint trail to answer "why
 * was this allowed into the bank" without re-deriving it from the
 * (now-deleted, per the `staged` compartment's "content leaves the
 * workspace" contract) staged record — the embedded `question` is the
 * exact, already-schema-validated object that was written into the
 * assembled production bank.
 */
export interface PublicationManifest {
  readonly candidateId: string;
  readonly questionId: string;
  readonly contentHash: string;
  readonly revision: number;
  readonly blueprintId: string;
  readonly batchId: string;
  readonly generatorAdapter: GeneratorAdapter;
  readonly originalityFingerprint: string;
  readonly difficultyFingerprint: string;
  readonly publishedAt: string;
  readonly manifestFingerprint: string;
  readonly question: Question;

  /**
   * P0-B review-evidence fields. Absent on the 288 manifests published
   * 2026-07-30, which are legacy-era by definition (see
   * `manifest-schema.ts`).
   *
   * **Deliberately outside `manifestFingerprint`.** The fingerprint is
   * computed over the original fact set only, so (a) every pre-P0-B
   * manifest still recomputes to its stored value exactly as before, and
   * (b) append-only enrichment with explicitly *unverifiable* recovered
   * evidence can never alter a tamper-evidence value. Non-verifiable
   * evidence must not be able to move a number that means "verified".
   */
  readonly manifestSchemaVersion?: number;
  readonly chainOrigin?: ChainOrigin;
  readonly correctnessBasis?: CorrectnessBasis;
  readonly reviewChain?: readonly ReviewRecord[];
  readonly recoveredEvidence?: readonly RecoveredReviewEvidence[];
  readonly noChainRecovered?: true;
}

export type PublicationOutcome =
  | { readonly outcome: "published"; readonly candidateId: string; readonly manifest: PublicationManifest; readonly replayed: boolean }
  /**
   * The candidate is not physically present in the `staged` compartment
   * (and has no prior manifest) — the direct mechanism behind "an
   * unapproved / staged-only item cannot be published": nothing outside
   * `orchestrateStaging`'s own verified move ever populates `staged`, so
   * an item that has not passed the full gate chain up through
   * `difficulty_review_passed` and then a real staging step can never
   * reach this function's success path, however it is invoked.
   */
  | { readonly outcome: "not_staged"; readonly candidateId: string; readonly foundState: string }
  | { readonly outcome: "ineligible"; readonly candidateId: string; readonly issues: readonly PublicationIssue[] }
  | { readonly outcome: "collision"; readonly candidateId: string; readonly issues: readonly PublicationIssue[] }
  | { readonly outcome: "repository_error"; readonly candidateId: string; readonly message: string };
