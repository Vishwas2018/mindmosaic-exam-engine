import {
  checkCandidateIdBinding,
  checkContentHashBinding,
  checkDonorTrustFields,
  checkLifecycleState,
  checkSourcePath,
  checkStaleness,
  checkVersions,
  parseCandidateProvenance,
  parseCandidateQuestion,
} from "./candidate-checks";
import { checkAnswerLeakageInAltText, checkUnsafeMarkup } from "./content-safety-checks";
import { buildEvidence } from "./evidence";
import { checkAgainstProductionSchema } from "./production-schema-check";
import { checkRegistryMembership } from "./registry-checks";
import { checkScoringCompatibility } from "./scoring-compatibility-check";
import { checkTaxonomy } from "./taxonomy-checks";
import type {
  QuestionFactoryCandidate,
  StructuralValidationContext,
  StructuralValidationIssue,
  StructuralValidationResult,
} from "./types";

function bestEffortNumber(raw: unknown, key: string): number {
  if (typeof raw !== "object" || raw === null) return 0;
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function bestEffortString(raw: unknown, key: string): string {
  if (typeof raw !== "object" || raw === null) return "unavailable";
  const value = (raw as Record<string, unknown>)[key];
  return typeof value === "string" && value.length > 0 ? value : "unavailable";
}

/**
 * The single pure entry point for structural validation. Deterministic and
 * side-effect free — no I/O, no wall-clock reads (`context.validatedAt` is
 * supplied by the caller), no randomness, no repository access. Never
 * claims correctness, originality, semantic quality, difficulty accuracy,
 * staging eligibility, or publication eligibility: only that the candidate
 * is structurally well-formed against the authoritative MindMosaic
 * contracts (production question schema, renderer/visual registries,
 * taxonomy registry, scoring contracts).
 *
 * Every check group runs unconditionally where its prerequisites hold, and
 * every issue found is collected (this is not a fail-fast validator) so a
 * caller always sees the complete picture in one pass. Repository lifecycle
 * movement is deliberately not performed here — see
 * `orchestrate-structural-validation.ts` for the transactional repository
 * move this pure result feeds into.
 */
export function validateCandidateStructure(
  candidate: QuestionFactoryCandidate,
  context: StructuralValidationContext,
): StructuralValidationResult {
  const issues: StructuralValidationIssue[] = [];

  issues.push(...checkLifecycleState(candidate.state));
  issues.push(...checkDonorTrustFields(candidate.question));

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  if (!provenanceOutcome.ok) issues.push(...provenanceOutcome.issues);

  const questionOutcome = parseCandidateQuestion(candidate.question);
  if (!questionOutcome.ok) issues.push(...questionOutcome.issues);

  if (provenanceOutcome.ok) {
    issues.push(...checkCandidateIdBinding(candidate.candidateId, provenanceOutcome.data));
    issues.push(...checkVersions(provenanceOutcome.data));
    issues.push(...checkStaleness(provenanceOutcome.data, context));
    issues.push(...checkSourcePath(candidate.ingestion?.sourcePath));
  }

  if (provenanceOutcome.ok && questionOutcome.ok) {
    issues.push(...checkContentHashBinding(questionOutcome.data, provenanceOutcome.data));
  }

  if (questionOutcome.ok) {
    issues.push(...checkTaxonomy(questionOutcome.data));
    issues.push(...checkRegistryMembership(questionOutcome.data));
    issues.push(...checkUnsafeMarkup(questionOutcome.data));
    issues.push(...checkAnswerLeakageInAltText(questionOutcome.data));

    const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
    if (productionSchemaOutcome.ok) {
      issues.push(...checkScoringCompatibility(productionSchemaOutcome.question));
    } else {
      issues.push(...productionSchemaOutcome.issues);
    }
  }

  const candidateRevision = provenanceOutcome.ok
    ? provenanceOutcome.data.revision
    : bestEffortNumber(candidate.provenance, "revision");
  const candidateContentHash = provenanceOutcome.ok
    ? provenanceOutcome.data.contentHash
    : bestEffortString(candidate.provenance, "contentHash");

  const evidence = buildEvidence({
    candidateId: candidate.candidateId,
    candidateRevision,
    candidateContentHash,
    ...(context.blueprintHash !== undefined ? { blueprintHash: context.blueprintHash } : {}),
    validatedAt: context.validatedAt,
    issues,
  });

  if (issues.length === 0) {
    return { status: "passed", evidence };
  }
  return { status: "failed", issues, evidence };
}
