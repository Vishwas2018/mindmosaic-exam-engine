import { FACTORY_THRESHOLDS } from "../config";
import { buildCorrectnessReportId, type StoredCorrectnessVerificationReport } from "../correctness";
import { buildDifficultyReportId, type StoredDifficultyReport } from "../difficulty";
import { buildOriginalityReportId, type StoredOriginalityReport } from "../originality";
import { isProductionGradeIndependentReview, type CandidateProvenance } from "../provenance";
import type { FactoryRepository } from "../storage";
import { buildStructuralValidationReportId, type StoredStructuralValidationReport } from "../validation";

/**
 * P0-A. Full upstream-gate verification for the two lifecycle hops that
 * move content towards learners: `difficulty_review_passed -> staged`
 * (`orchestrateStaging`) and `staged -> published` (`publishCandidate` via
 * `checkPublicationEligibility`).
 *
 * **The defect this closes.** Both hops previously verified only a subset of
 * the five gates — staging re-checked difficulty alone, publication
 * re-checked originality and difficulty alone — and otherwise trusted the
 * candidate's `state` field (`difficulty_review_passed`) as a proxy for
 * every earlier gate having genuinely passed. It is not one. The 2026-07-30
 * post-hoc audit (`docs/reports/publication-288-posthoc-audit.md`) found 132
 * of 288 published questions holding a correctness report with status
 * `review_required` — the gate explicitly stating it could not establish
 * correctness and that independent semantic review was required — with no
 * such review anywhere, alongside a perfectly valid `passed` difficulty
 * report. Both hops waved them through because neither ever looked at
 * correctness.
 *
 * **Why `review_required` is not simply refused.** It is a legitimate,
 * expected correctness outcome for `semantic_objective` /
 * `manual_review_writing` content — see
 * `orchestrate-correctness-verification.ts`'s
 * `passed_pending_semantic_review` doc comment: such a candidate rightly
 * advances to `correctness_check_passed`, and "the semantic-review gate is
 * the only gate entitled to establish correctness for this content".
 * Refusing `review_required` outright would permanently block every reading
 * and language-conventions question — exactly the content the semantic gate
 * exists to adjudicate. So the rule enforced here is the precise one:
 * `review_required` advances **only** when the review chain carries
 * production-grade independent semantic review evidence bound to the
 * candidate's current content hash and revision. Correctness must be
 * established by *someone*; `review_required` alone establishes nothing.
 *
 * Every gate is re-verified against the candidate's *current* content hash
 * and revision, in the same "recompute, never trust a stored status label"
 * spirit as the individual gate orchestrators.
 */
export type GateName = "structural" | "correctness" | "semantic" | "originality" | "difficulty";

export interface GateChainFailure {
  readonly gate: GateName;
  readonly path: string;
  readonly message: string;
}

export type GateChainVerificationResult =
  | {
      readonly ok: true;
      /**
       * True when correctness was established by independent semantic review
       * rather than deterministically by the correctness gate itself.
       */
      readonly correctnessEstablishedBySemanticReview: boolean;
      /**
       * Carried out of the verified originality/difficulty evidence so
       * publication can stamp the manifest without re-reading (and
       * re-trusting) the same two reports a second time.
       */
      readonly originalityFingerprint: string;
      readonly difficultyFingerprint: string;
    }
  | { readonly ok: false; readonly failures: readonly GateChainFailure[] };

export interface GateChainContext {
  readonly candidateId: string;
  readonly provenance: CandidateProvenance;
}

function failure(gate: GateName, path: string, message: string): GateChainFailure {
  return { gate, path, message };
}

interface MinimalReport {
  readonly candidateId?: string;
  readonly result?: { readonly status?: string; readonly evidence?: Record<string, unknown> };
}

/**
 * The binding half of every gate check: report exists, names this
 * candidate, and its evidence is bound to the candidate's current content
 * hash and revision. Status is checked by the caller, because correctness
 * accepts a second status the other three do not.
 */
function verifyReportBinding(
  gate: GateName,
  report: MinimalReport | undefined,
  reportPath: string,
  candidateId: string,
  provenance: CandidateProvenance,
): GateChainFailure | undefined {
  if (report === undefined) {
    return failure(gate, reportPath, `No ${gate}-gate report exists for this candidate.`);
  }
  if (report.candidateId !== candidateId) {
    return failure(gate, reportPath, `${gate}-gate report belongs to candidate '${String(report.candidateId)}'.`);
  }
  const evidence = report.result?.evidence;
  if (evidence === undefined) {
    return failure(gate, `${reportPath}.result.evidence`, `${gate}-gate report carries no evidence block.`);
  }
  if (evidence.candidateId !== candidateId) {
    return failure(gate, `${reportPath}.result.evidence.candidateId`, `${gate}-gate evidence names a different candidate.`);
  }
  if (evidence.candidateContentHash !== provenance.contentHash) {
    return failure(
      gate,
      `${reportPath}.result.evidence.candidateContentHash`,
      `${gate}-gate evidence is bound to a different content hash — the candidate changed after the gate ran.`,
    );
  }
  if (evidence.candidateRevision !== provenance.revision) {
    return failure(
      gate,
      `${reportPath}.result.evidence.candidateRevision`,
      `${gate}-gate evidence is bound to revision ${String(evidence.candidateRevision)}, not the candidate's current revision ${provenance.revision}.`,
    );
  }
  return undefined;
}

/** The three gates whose only acceptable status is an explicit `passed`. */
function verifyStrictPassGate(
  gate: GateName,
  report: MinimalReport | undefined,
  reportPath: string,
  candidateId: string,
  provenance: CandidateProvenance,
): GateChainFailure | undefined {
  const binding = verifyReportBinding(gate, report, reportPath, candidateId, provenance);
  if (binding !== undefined) return binding;
  const status = report!.result?.status;
  if (status !== "passed") {
    return failure(
      gate,
      `${reportPath}.result.status`,
      `${gate}-gate report status is '${String(status)}', not 'passed'; only an explicit pass advances a candidate.`,
    );
  }
  return undefined;
}

/**
 * Semantic review has no durable report file of its own — the only place
 * its evidence lives is the candidate's review chain
 * (`provenance.reviewRecords`). Delegates to
 * `isProductionGradeIndependentReview` rather than re-deriving weaker
 * checks, so a hand-assembled or detached record can never satisfy it: the
 * claimed record must sit inside a chain `verifyReviewChain` accepts, that
 * chain must end where the caller expects, and the reviewer must be
 * independent of the generator with an accepted result, sufficient
 * confidence, at least one evidence reference, no unresolved ambiguity, and
 * a still-valid binding.
 */
function verifySemanticGate(context: GateChainContext): GateChainFailure | undefined {
  const chain = context.provenance.reviewRecords;
  if (chain.length === 0) {
    return failure(
      "semantic",
      "provenance.reviewRecords",
      "Correctness was not established deterministically, so independent semantic review is required, but the candidate has an empty review chain.",
    );
  }

  const terminal = chain[chain.length - 1]!;
  const accepted = chain.some((record) =>
    isProductionGradeIndependentReview(
      context.provenance.generatorAdapter.identity,
      { chain, reviewHash: record.reviewHash, expectedTerminalReviewHash: terminal.reviewHash },
      {
        candidateId: context.candidateId,
        contentHash: context.provenance.contentHash,
        blueprintHash: record.evidenceBinding.blueprintHash,
        revision: context.provenance.revision,
      },
      FACTORY_THRESHOLDS.PRODUCTION_REVIEW_CONFIDENCE,
    ),
  );

  if (!accepted) {
    return failure(
      "semantic",
      "provenance.reviewRecords",
      "Correctness was not established deterministically, so independent semantic review is required, but no record in the review chain is production-grade independent evidence bound to the candidate's current content hash and revision.",
    );
  }
  return undefined;
}

export async function verifyUpstreamGateChain(
  context: GateChainContext,
  repository: FactoryRepository,
): Promise<GateChainVerificationResult> {
  const { candidateId, provenance } = context;
  const failures: GateChainFailure[] = [];

  const structural = (await repository.read("reports", buildStructuralValidationReportId(candidateId))) as
    | StoredStructuralValidationReport
    | undefined;
  const correctness = (await repository.read("reports", buildCorrectnessReportId(candidateId))) as
    | StoredCorrectnessVerificationReport
    | undefined;
  const originality = (await repository.read("reports", buildOriginalityReportId(candidateId))) as
    | StoredOriginalityReport
    | undefined;
  const difficulty = (await repository.read("reports", buildDifficultyReportId(candidateId))) as
    | StoredDifficultyReport
    | undefined;

  for (const [gate, report, path] of [
    ["structural", structural, "reports.structural"],
    ["originality", originality, "reports.originality"],
    ["difficulty", difficulty, "reports.difficulty"],
  ] as const) {
    const result = verifyStrictPassGate(gate, report as MinimalReport | undefined, path, candidateId, provenance);
    if (result !== undefined) failures.push(result);
  }

  // Correctness, plus the semantic requirement it may impose.
  let correctnessEstablishedBySemanticReview = false;
  const correctnessBinding = verifyReportBinding(
    "correctness",
    correctness as MinimalReport | undefined,
    "reports.correctness",
    candidateId,
    provenance,
  );
  if (correctnessBinding !== undefined) {
    failures.push(correctnessBinding);
  } else {
    const status = correctness!.result.status;
    const capability = (correctness!.result as { capability?: string }).capability;
    if (status === "passed") {
      // Deterministically established by the gate itself; no semantic
      // review is required (and none is expected to exist).
    } else if (status === "review_required" && capability === "requires_independent_semantic_review") {
      const semanticFailure = verifySemanticGate(context);
      if (semanticFailure !== undefined) failures.push(semanticFailure);
      else correctnessEstablishedBySemanticReview = true;
    } else {
      failures.push(
        failure(
          "correctness",
          "reports.correctness.result.status",
          `correctness-gate report status is '${String(status)}'${capability === undefined ? "" : ` (capability '${capability}')`}; correctness must be established either deterministically ('passed') or by independent semantic review ('review_required' with capability 'requires_independent_semantic_review').`,
        ),
      );
    }
  }

  if (failures.length > 0) return { ok: false, failures };

  // Both reports are known present, `passed`, and correctly bound by the
  // loop above; the fingerprints are read back defensively anyway so a
  // schema drift that dropped either field fails closed rather than
  // stamping `undefined` into a manifest.
  const originalityFingerprint = originality?.result.evidence?.originalityFingerprint;
  const difficultyFingerprint = difficulty?.result.evidence?.difficultyFingerprint;
  if (typeof originalityFingerprint !== "string" || originalityFingerprint.length === 0) {
    return {
      ok: false,
      failures: [
        failure(
          "originality",
          "reports.originality.result.evidence.originalityFingerprint",
          "Originality evidence carries no originality fingerprint.",
        ),
      ],
    };
  }
  if (typeof difficultyFingerprint !== "string" || difficultyFingerprint.length === 0) {
    return {
      ok: false,
      failures: [
        failure(
          "difficulty",
          "reports.difficulty.result.evidence.difficultyFingerprint",
          "Difficulty evidence carries no difficulty fingerprint.",
        ),
      ],
    };
  }

  return { ok: true, correctnessEstablishedBySemanticReview, originalityFingerprint, difficultyFingerprint };
}
