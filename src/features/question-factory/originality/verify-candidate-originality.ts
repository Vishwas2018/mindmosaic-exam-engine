/**
 * The single pure entry point for originality verification. Deterministic
 * and side-effect free — no I/O, no wall-clock reads (`context.validatedAt`
 * is supplied by the caller), no randomness. Never performs correctness
 * verification, semantic AI review, difficulty estimation, staging, or
 * publication.
 *
 * Reuses the exact trust-boundary re-parse every other gate in this
 * pipeline already performs (`parseCandidateProvenance`,
 * `parseCandidateQuestion`) rather than re-declaring a second parse of
 * the same untrusted `candidate.provenance`/`candidate.question` blobs.
 *
 * Scope statement (Mission 3D plan §4a, required verbatim here and on
 * `OriginalityEvidence`): this is duplicate/near-duplicate detection
 * within the factory's own corpus only; it is not a copyright-infringement
 * check against NAPLAN/ICAS/commercial material, and the existing human
 * editorial checklist (`docs/CONTENT_RULES.md`) remains required and is
 * not superseded by this gate.
 */
import { FACTORY_THRESHOLDS } from "../config";
import { hashJson } from "../provenance";
import { parseCandidateProvenance, parseCandidateQuestion } from "../validation";
import { boundMessage, buildOriginalityEvidence } from "./evidence";
import { computeSimilarity, extractComparableText, normaliseComparableText, tokenise } from "./similarity";
import type {
  OriginalityClassification,
  OriginalityIssue,
  OriginalityIssueCode,
  OriginalityMatch,
  OriginalityResult,
  OriginalityVerificationContext,
  QuestionFactoryCandidate,
} from "./types";

const MAX_NEAREST_MATCHES = 5;

function issue(code: OriginalityIssueCode, path: string, message: string): OriginalityIssue {
  return { code, path, message: boundMessage(message).message, severity: "error" };
}

function classify(topSimilarity: number): OriginalityClassification {
  if (topSimilarity >= 1) return "exact_duplicate";
  if (topSimilarity >= FACTORY_THRESHOLDS.NEAR_DUPLICATE_SIMILARITY) return "substantive_duplicate";
  if (topSimilarity >= FACTORY_THRESHOLDS.STRUCTURALLY_SIMILAR_SIMILARITY) return "structurally_similar";
  return "distinct";
}

function issueCodeFor(classification: OriginalityClassification): OriginalityIssueCode {
  switch (classification) {
    case "exact_duplicate":
      return "originality_exact_duplicate";
    case "substantive_duplicate":
      return "originality_near_duplicate";
    case "structurally_similar":
      return "originality_structurally_similar";
    case "distinct":
      throw new Error("classify() never returns 'distinct' on a failing path.");
  }
}

export function verifyCandidateOriginality(
  candidate: QuestionFactoryCandidate,
  context: OriginalityVerificationContext,
): OriginalityResult {
  const sortedComparedIds = [...context.corpus.map((entry) => entry.id)].sort();
  const corpusScope = {
    source: "production_bank" as const,
    comparedIds: sortedComparedIds,
    corpusFingerprint: hashJson(sortedComparedIds),
  };

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  const questionOutcome = parseCandidateQuestion(candidate.question);

  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    // Defensive: a candidate this far into the pipeline has already passed
    // structural validation's own re-parse of the same blobs. Per the
    // governance principle every gate in this mission follows — "cannot
    // compute" always routes to quarantined, never passed or a fabricated
    // failure — this is treated as insufficient deterministic evidence,
    // not silently ignored.
    const evidence = buildOriginalityEvidence({
      candidateId: candidate.candidateId,
      candidateRevision: 0,
      candidateContentHash: "",
      blueprintHash: context.blueprintHash,
      corpusScope,
      nearestMatches: [],
      classification: "distinct",
      validatedAt: context.validatedAt,
      issues: [issue("originality_comparison_failed", "candidate", "Candidate provenance or question no longer parses against its trust-boundary schema; originality cannot be computed.")],
      outcome: "quarantined",
    });
    return { status: "quarantined", issues: [...evidence.issues], evidence };
  }

  const provenance = provenanceOutcome.data;
  const question = questionOutcome.data;
  const candidateComparableText = extractComparableText(question);
  const candidateTokens = tokenise(normaliseComparableText(candidateComparableText));

  if (candidateTokens.length === 0) {
    const evidence = buildOriginalityEvidence({
      candidateId: candidate.candidateId,
      candidateRevision: provenance.revision,
      candidateContentHash: provenance.contentHash,
      blueprintHash: context.blueprintHash,
      corpusScope,
      nearestMatches: [],
      classification: "distinct",
      validatedAt: context.validatedAt,
      issues: [
        issue(
          "originality_comparison_failed",
          "question",
          "Candidate's comparable text (prompt + stimulus + options) normalises to zero tokens; originality cannot be computed.",
        ),
      ],
      outcome: "quarantined",
    });
    return { status: "quarantined", issues: [...evidence.issues], evidence };
  }

  const scored: OriginalityMatch[] = context.corpus
    .map((entry) => ({ matchedId: entry.id, similarityScore: computeSimilarity(candidateComparableText, entry.comparableText) }))
    .sort((a, b) => b.similarityScore - a.similarityScore || a.matchedId.localeCompare(b.matchedId));
  const nearestMatches = scored.slice(0, MAX_NEAREST_MATCHES);
  const topSimilarity = scored.length > 0 ? scored[0].similarityScore : 0;
  const classification = classify(topSimilarity);

  if (classification === "distinct") {
    const evidence = buildOriginalityEvidence({
      candidateId: candidate.candidateId,
      candidateRevision: provenance.revision,
      candidateContentHash: provenance.contentHash,
      blueprintHash: context.blueprintHash,
      corpusScope,
      nearestMatches,
      classification,
      validatedAt: context.validatedAt,
      issues: [],
      outcome: "passed",
    });
    return { status: "passed", classification: "distinct", evidence };
  }

  const failIssue = issue(
    issueCodeFor(classification),
    "question",
    `Candidate's nearest-match similarity (${topSimilarity.toFixed(4)}, against '${nearestMatches[0]?.matchedId ?? "unknown"}') is classified '${classification}'.`,
  );
  const evidence = buildOriginalityEvidence({
    candidateId: candidate.candidateId,
    candidateRevision: provenance.revision,
    candidateContentHash: provenance.contentHash,
    blueprintHash: context.blueprintHash,
    corpusScope,
    nearestMatches,
    classification,
    validatedAt: context.validatedAt,
    issues: [failIssue],
    outcome: "failed",
  });
  return { status: "failed", classification, issues: [failIssue], evidence };
}
