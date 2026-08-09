/**
 * Mission 3D third audit remediation. Authenticates a stored `sr-*`
 * semantic-completion evidence record against a candidate's *current*
 * identity and *freshly recomputed* semantic classification — never
 * trusting the classification/completion path an evidence record declares
 * about itself, and never trusting lifecycle state (`semantic_review_passed`)
 * as any kind of substitute. Used by `originality/validate-upstream-correctness-evidence.ts`
 * before originality accepts a candidate's semantic review as genuinely
 * complete, covering both completion paths uniformly: `deterministic_skip`
 * (deterministically-computable content, previously completely
 * unevidenced) and `independent_review` (content requiring a genuine,
 * chain-verified independent reviewer record at the production-confidence
 * threshold).
 *
 * Pure and side-effect-free: no I/O, no wall-clock read, never throws on a
 * malformed/corrupted stored record — every failure mode becomes a
 * structured `SemanticCompletionProblem` instead, collected rather than
 * short-circuited after the first.
 */
import { FACTORY_THRESHOLDS } from "../config";
import type { NormalisedIdentity } from "../config";
import { isProductionGradeIndependentReview, verifyReviewChain, type ReviewRecord } from "../provenance";
import type { SemanticClassification } from "../workflow";
import {
  computeSemanticCompletionFingerprint,
  type SemanticCompletionEvidence,
} from "./semantic-completion-evidence";

export type SemanticCompletionProblemKind =
  | "missing"
  | "malformed"
  | "wrong_candidate"
  | "stale_binding"
  | "classification_mismatch"
  | "path_mismatch"
  | "independent_evidence_missing"
  | "tampered_fingerprint";

export interface SemanticCompletionProblem {
  readonly kind: SemanticCompletionProblemKind;
  readonly path: string;
  readonly message: string;
}

export interface SemanticCompletionBindingFacts {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  /** The candidate's *current*, already-verified (non-empty) bound-blueprint hash — `undefined`/empty is never vacuously matched. */
  readonly blueprintHash?: string;
  /** Freshly recomputed from the candidate's *current* question content via `classifySemanticCategory` — never read from the evidence record itself. */
  readonly semanticClassification: SemanticClassification;
  readonly generatorIdentity: NormalisedIdentity;
  /** The candidate's current, full `provenance.reviewRecords` chain. */
  readonly reviewRecords: readonly ReviewRecord[];
}

export type SemanticCompletionBindingOutcome =
  | { readonly ok: true; readonly evidence: SemanticCompletionEvidence }
  | { readonly ok: false; readonly problems: readonly SemanticCompletionProblem[] };

function isWellShapedSemanticCompletionEvidence(evidence: SemanticCompletionEvidence): boolean {
  const record = evidence as unknown as Record<string, unknown>;
  return (
    typeof record.candidateId === "string" &&
    typeof record.candidateRevision === "number" &&
    typeof record.candidateContentHash === "string" &&
    typeof record.blueprintHash === "string" &&
    typeof record.semanticClassification === "string" &&
    typeof record.completionPath === "string" &&
    typeof record.semanticCompletionFingerprint === "string"
  );
}

export function validateSemanticCompletionEvidence(
  facts: SemanticCompletionBindingFacts,
  evidence: SemanticCompletionEvidence | undefined,
): SemanticCompletionBindingOutcome {
  if (evidence === undefined) {
    return {
      ok: false,
      problems: [
        {
          kind: "missing",
          path: "semanticCompletionEvidence",
          message:
            "No semantic-completion evidence exists for this candidate — lifecycle state 'semantic_review_passed' alone never establishes that the governed semantic-review workflow actually ran, for either the deterministic-skip or independent-review completion path.",
        },
      ],
    };
  }

  if (!isWellShapedSemanticCompletionEvidence(evidence)) {
    return {
      ok: false,
      problems: [
        {
          kind: "malformed",
          path: "semanticCompletionEvidence",
          message: "Stored semantic-completion evidence is malformed (missing or wrongly-typed fields); it cannot be trusted as proof of a genuine governed semantic-review completion.",
        },
      ],
    };
  }

  const problems: SemanticCompletionProblem[] = [];
  const blueprintHashVerified = typeof facts.blueprintHash === "string" && facts.blueprintHash.trim().length > 0;

  if (evidence.candidateId !== facts.candidateId) {
    problems.push({
      kind: "wrong_candidate",
      path: "semanticCompletionEvidence.candidateId",
      message: `Stored semantic-completion evidence belongs to candidate '${evidence.candidateId}', not '${facts.candidateId}'.`,
    });
  }
  if (evidence.candidateRevision !== facts.candidateRevision) {
    problems.push({
      kind: "stale_binding",
      path: "semanticCompletionEvidence.candidateRevision",
      message: `Semantic-completion evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${facts.candidateRevision}.`,
    });
  }
  if (evidence.candidateContentHash !== facts.candidateContentHash) {
    problems.push({
      kind: "stale_binding",
      path: "semanticCompletionEvidence.candidateContentHash",
      message: "Semantic-completion evidence content hash no longer matches the candidate's current content hash.",
    });
  }
  if (!blueprintHashVerified || evidence.blueprintHash !== facts.blueprintHash) {
    problems.push({
      kind: "stale_binding",
      path: "semanticCompletionEvidence.blueprintHash",
      message: "Semantic-completion evidence blueprint hash does not strictly match the candidate's current verified blueprint hash (absent/empty hashes never match).",
    });
  }
  if (evidence.semanticClassification !== facts.semanticClassification) {
    problems.push({
      kind: "classification_mismatch",
      path: "semanticCompletionEvidence.semanticClassification",
      message: `Semantic-completion evidence declares classification '${evidence.semanticClassification}', but the candidate's current content freshly classifies as '${facts.semanticClassification}'.`,
    });
  }

  const expectedPath = facts.semanticClassification === "deterministically_computable" ? "deterministic_skip" : "independent_review";
  if (evidence.completionPath !== expectedPath) {
    problems.push({
      kind: "path_mismatch",
      path: "semanticCompletionEvidence.completionPath",
      message: `Semantic-completion evidence declares completion path '${evidence.completionPath}', but the candidate's current classification '${facts.semanticClassification}' requires '${expectedPath}'.`,
    });
  }

  if (expectedPath === "independent_review") {
    if (evidence.satisfyingReviewHash === undefined) {
      problems.push({
        kind: "independent_evidence_missing",
        path: "semanticCompletionEvidence.satisfyingReviewHash",
        message: "Independent-review completion evidence declares no satisfying review record.",
      });
    } else {
      const chainVerification = verifyReviewChain(facts.reviewRecords);
      const terminalHash = facts.reviewRecords.at(-1)?.reviewHash;
      const genuinelyQualifies =
        chainVerification.valid &&
        terminalHash !== undefined &&
        isProductionGradeIndependentReview(
          facts.generatorIdentity,
          { chain: facts.reviewRecords, reviewHash: evidence.satisfyingReviewHash, expectedTerminalReviewHash: terminalHash },
          {
            candidateId: facts.candidateId,
            contentHash: facts.candidateContentHash,
            blueprintHash: facts.blueprintHash ?? "",
            revision: facts.candidateRevision,
          },
          FACTORY_THRESHOLDS.PRODUCTION_REVIEW_CONFIDENCE,
        );
      if (!genuinelyQualifies) {
        problems.push({
          kind: "independent_evidence_missing",
          path: "semanticCompletionEvidence.satisfyingReviewHash",
          message: `Semantic-completion evidence's declared satisfying review record ('${evidence.satisfyingReviewHash}') is not, on independent re-verification of the candidate's current review chain, a genuine, sufficient, independent, chain-verified reviewer record at the production-confidence threshold.`,
        });
      }
    }
  }

  const recomputedFingerprint = computeSemanticCompletionFingerprint({
    candidateId: evidence.candidateId,
    candidateRevision: evidence.candidateRevision,
    candidateContentHash: evidence.candidateContentHash,
    blueprintHash: evidence.blueprintHash,
    semanticClassification: evidence.semanticClassification,
    completionPath: evidence.completionPath,
    satisfyingReviewHash: evidence.satisfyingReviewHash,
  });
  if (recomputedFingerprint !== evidence.semanticCompletionFingerprint) {
    problems.push({
      kind: "tampered_fingerprint",
      path: "semanticCompletionEvidence.semanticCompletionFingerprint",
      message: "Recomputed semantic-completion fingerprint does not match the stored value — the evidence's visible fields were edited after minting, or the fingerprint itself was tampered with.",
    });
  }

  return problems.length === 0 ? { ok: true, evidence } : { ok: false, problems };
}
