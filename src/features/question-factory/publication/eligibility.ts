import { verifyFirstPartyAmcAttestation } from "../correctness/amc-attestation";
import { computeSolver, solverAnswerError } from "../correctness/solver-verification";
import { verifyUpstreamGateChain } from "../gate-chain";
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
  | {
      readonly ok: true;
      readonly originalityFingerprint: string;
      readonly difficultyFingerprint: string;
      /** How correctness was established — stamped onto the manifest by P0-B. */
      readonly correctnessEstablishedBySemanticReview: boolean;
    }
  | { readonly ok: false; readonly issues: readonly PublicationIssue[] };

function issue(code: PublicationIssue["code"], path: string, message: string): PublicationIssue {
  return { code, path, message };
}

/**
 * Extracts the primary numeric token from an option or text string.
 * Handles negative signs, currency symbols, thousands separators (commas),
 * decimals, and extracts only the first numeric token to prevent digit
 * concatenation (e.g. "2 hours 30 minutes" -> 2, not 230).
 */
// Legacy display parser only. Never use this helper as correctness evidence.
export function parsePrimaryNumericToken(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/[-+]?(?:\$\s*)?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (!match) return null;
  const cleaned = match[0].replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
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
 * 3. **The whole upstream gate chain still holds** — `verifyUpstreamGateChain`
 *    re-checks structural, correctness, semantic (where correctness could
 *    not be established deterministically), originality and difficulty,
 *    each bound to this exact candidate id/content hash/revision. This is
 *    what keeps the anti-plagiarism, correctness and calibration guarantees
 *    intact end-to-end *through* publication rather than only up to the gate
 *    that first produced each one, and catches evidence that has gone stale
 *    between staging and publication (e.g. a corpus/version drift).
 *
 * P0-A: checks 3 and 4 were originally originality and difficulty *only*,
 * which is how 132 questions whose correctness report said `review_required`
 * reached learners. See `gate-chain/verify-gate-chain.ts` and
 * `docs/reports/publication-288-posthoc-audit.md`.
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

  if (question.metadata.subject === "amc_mathematics") {
    const attested = verifyFirstPartyAmcAttestation(question, provenance.contentHash);
    if (!attested.ok) issues.push(issue("publication_solver_verification_failed", "amc_attestation", attested.message));
  }
  if (question.solverParams !== undefined) {
    const computed = computeSolver(question.solverParams);
    const error = computed.ok ? solverAnswerError(question, computed.value) : computed.error;
    if (error) issues.push(issue("publication_solver_verification_failed", "solverParams", error));
  }

  const gateChain = await verifyUpstreamGateChain({ candidateId, provenance }, repository);
  if (!gateChain.ok) {
    for (const entry of gateChain.failures) {
      issues.push(issue("publication_upstream_evidence_invalid", entry.path, entry.message));
    }
  }

  if (issues.length > 0 || !gateChain.ok) return { ok: false, issues };
  return {
    ok: true,
    originalityFingerprint: gateChain.originalityFingerprint,
    difficultyFingerprint: gateChain.difficultyFingerprint,
    correctnessEstablishedBySemanticReview: gateChain.correctnessEstablishedBySemanticReview,
  };
}
