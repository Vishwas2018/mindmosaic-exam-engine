/**
 * Mission 3D governed-authority remediation. The sole production path able
 * to persist an `sr-*` semantic-completion evidence record. Deliberately
 * not exported from `review/index.ts` (this codebase's public barrel for
 * this feature) — imported only by `orchestrate-semantic-review.ts`, in
 * the same directory, the one governed composition root entitled to mint
 * semantic-completion evidence.
 *
 * Mints its own `GovernedWriteCapability` for the `sr-` family at the
 * point of use (see `storage/governed-write-capability.ts`) and presents
 * it to `repository.create()`, which refuses the write outright for any
 * caller that omits it (`storage/fs-factory-repository.ts`). Retains the
 * same append-only, fingerprint-based replay discipline every other
 * evidence write in this codebase already follows.
 */
import { GovernedWriteCapability } from "../storage/governed-write-capability";
import type { FactoryRepository } from "../storage";
import { buildSemanticCompletionEvidence, buildSemanticCompletionReportId, type SemanticCompletionEvidence, type SemanticCompletionEvidenceInput } from "./semantic-completion-evidence";

const SEMANTIC_COMPLETION_EVIDENCE_FAMILY = "sr-" as const;

export type WriteSemanticCompletionEvidenceOutcome =
  | { readonly ok: true; readonly alreadyPresent: boolean }
  | { readonly ok: false; readonly message: string };

export async function writeSemanticCompletionEvidence(
  repository: FactoryRepository,
  input: SemanticCompletionEvidenceInput,
): Promise<WriteSemanticCompletionEvidenceOutcome> {
  const evidence = buildSemanticCompletionEvidence(input);
  const reportId = buildSemanticCompletionReportId(input.candidateId);

  const existing = (await repository.read("reports", reportId)) as SemanticCompletionEvidence | undefined;
  if (existing !== undefined) {
    if (existing.semanticCompletionFingerprint === evidence.semanticCompletionFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different semantic-completion evidence record already exists for candidate '${evidence.candidateId}' — its fingerprint no longer matches, indicating a genuine conflict rather than a safe retry.`,
    };
  }

  const capability = GovernedWriteCapability.issue(SEMANTIC_COMPLETION_EVIDENCE_FAMILY);
  const createResult = await repository.create("reports", reportId, evidence, capability);
  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, alreadyPresent: false };
}
