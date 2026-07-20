import type { StoredDifficultyReport } from "../difficulty";
import { buildDifficultyReportId } from "../difficulty";
import type { StoredOriginalityReport } from "../originality";
import { buildOriginalityReportId } from "../originality";
import type { CandidateQuestion } from "../ingestion/candidate-question";
import type { CandidateProvenance } from "../provenance";
import { hashJson } from "../provenance";
import type { FactoryRepository } from "../storage";
import type { PublicationIssue } from "./types";

export interface PublicationEligibilityContext {
  readonly candidateId: string;
  readonly question: CandidateQuestion;
  readonly provenance: CandidateProvenance;
}

export type PublicationEligibilityResult =
  | { readonly ok: true; readonly originalityFingerprint: string; readonly difficultyFingerprint: string }
  | { readonly ok: false; readonly issues: readonly PublicationIssue[] };

function issue(code: PublicationIssue["code"], path: string, message: string): PublicationIssue {
  return { code, path, message };
}

/**
 * The publication gate's eligibility check — re-verified fresh at publish
 * time, never inferred from the candidate having once reached `staged`.
 * Every check here recomputes or re-reads governance evidence rather than
 * trusting a stored claim, per the codebase-wide "no report-only
 * transition" / "recompute fingerprints before trust" discipline every
 * other gate orchestrator already follows:
 *
 * 1. **Content-hash integrity** — the staged question content must still
 *    hash to the provenance-recorded `contentHash`; a mismatch means the
 *    record was edited after staging without going back through the
 *    gates, which is always refused.
 * 2. **No fixture-generated content in production** — `deterministic_fixture`
 *    candidates can legitimately reach `staged` (useful for pipeline/
 *    staging tests) but must never cross into `published`, per the
 *    Mission 3 contract's unconditional, non-configurable rule.
 * 3. **Originality gate still holds** — a `passed` originality report must
 *    exist, bound to this exact candidate id/content hash/revision. This
 *    is what keeps the anti-plagiarism/no-duplicate-content guarantee
 *    intact end-to-end through publication, not just up to the gate that
 *    first produced it.
 * 4. **Difficulty gate still holds** — same binding check, for the last
 *    gate before staging, so a staged candidate whose evidence has gone
 *    stale (e.g. a corpus/version drift between staging and publication)
 *    is caught here rather than silently trusted.
 */
export async function checkPublicationEligibility(
  context: PublicationEligibilityContext,
  repository: FactoryRepository,
): Promise<PublicationEligibilityResult> {
  const issues: PublicationIssue[] = [];
  const { candidateId, question, provenance } = context;

  if (hashJson(question) !== provenance.contentHash) {
    issues.push(
      issue(
        "publication_content_hash_mismatch",
        "provenance.contentHash",
        "Stored content hash no longer matches the staged candidate's question content.",
      ),
    );
  }

  if (provenance.generatorAdapter.class === "deterministic_fixture") {
    issues.push(
      issue(
        "publication_refused_fixture_generator",
        "provenance.generatorAdapter.class",
        "Deterministic-fixture-generated candidates can never be published to the production bank, regardless of lifecycle progress.",
      ),
    );
  }

  const originalityReport = (await repository.read("reports", buildOriginalityReportId(candidateId))) as
    | StoredOriginalityReport
    | undefined;
  const originalityEvidence = originalityReport?.result.evidence;
  const originalityValid =
    originalityReport !== undefined &&
    originalityReport.candidateId === candidateId &&
    originalityReport.result.status === "passed" &&
    originalityEvidence !== undefined &&
    originalityEvidence.candidateId === candidateId &&
    originalityEvidence.candidateContentHash === provenance.contentHash &&
    originalityEvidence.candidateRevision === provenance.revision;
  if (!originalityValid) {
    issues.push(
      issue(
        "publication_upstream_evidence_invalid",
        "reports.originality",
        "No passing originality-review evidence bound to this candidate's current content hash/revision was found.",
      ),
    );
  }

  const difficultyReport = (await repository.read("reports", buildDifficultyReportId(candidateId))) as
    | StoredDifficultyReport
    | undefined;
  const difficultyEvidence = difficultyReport?.result.evidence;
  const difficultyValid =
    difficultyReport !== undefined &&
    difficultyReport.candidateId === candidateId &&
    difficultyReport.result.status === "passed" &&
    difficultyEvidence !== undefined &&
    difficultyEvidence.candidateId === candidateId &&
    difficultyEvidence.candidateContentHash === provenance.contentHash &&
    difficultyEvidence.candidateRevision === provenance.revision;
  if (!difficultyValid) {
    issues.push(
      issue(
        "publication_upstream_evidence_invalid",
        "reports.difficulty",
        "No passing difficulty-review evidence bound to this candidate's current content hash/revision was found.",
      ),
    );
  }

  if (issues.length > 0) return { ok: false, issues };
  return {
    ok: true,
    originalityFingerprint: originalityEvidence!.originalityFingerprint,
    difficultyFingerprint: difficultyEvidence!.difficultyFingerprint,
  };
}
