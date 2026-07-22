/**
 * The single pure entry point for correctness verification. Deterministic
 * and side-effect free — no I/O, no wall-clock reads (`context.verifiedAt`
 * is supplied by the caller), no randomness. Never performs semantic AI
 * review, originality review, difficulty estimation, staging, or
 * publication; never parses the explanation as a source of truth (only as
 * supporting evidence — see `explanation-consistency.ts`).
 *
 * Reuses the exact trust-boundary re-parse and production-schema
 * realisation the structural-validation gate already performs
 * (`parseCandidateProvenance`, `parseCandidateQuestion`,
 * `checkAgainstProductionSchema`) rather than re-declaring a second parse
 * of the same untrusted `candidate.provenance`/`candidate.question` blobs,
 * and reuses the real scoring engine (`scoreQuestion`) rather than a
 * second scoring implementation.
 */
import { scoreQuestion } from "@/features/exam-engine/scoring/score-question";
import type { Question } from "@/schemas/question.schema";

import { FACTORY_VERSIONS } from "../config";
import {
  checkAgainstProductionSchema,
  computeStructuralValidationFingerprint,
  parseCandidateProvenance,
  parseCandidateQuestion,
  STRUCTURAL_VALIDATOR_VERSION,
} from "../validation";
import {
  buildDeclaredResponse,
  buildResponseFromDerivedValue,
  representDeclaredAnswer,
  representDerivedValue,
} from "./canonical-response";
import { deriveIndependentAnswer } from "./derive-answer";
import type { DerivedValue } from "./derived-value";
import { boundMessage, buildCorrectnessEvidence } from "./evidence";
import { checkExplanationConsistency } from "./explanation-consistency";
import { fractionFromFiniteNumber, fractionToDisplayString, fractionWithinTolerance } from "./numeric";
import type {
  CorrectnessCapability,
  CorrectnessVerificationContext,
  CorrectnessVerificationIssue,
  CorrectnessVerificationIssueCode,
  CorrectnessVerificationResult,
  QuestionFactoryCandidate,
  ScoringOutcomeSummary,
} from "./types";

function issue(
  code: CorrectnessVerificationIssueCode,
  path: string,
  message: string,
  severity: "error" | "review_required",
): CorrectnessVerificationIssue {
  return { code, path, message: boundMessage(message).message, severity };
}

/**
 * Distinguishes which of the two `scoreQuestion()` invocations threw —
 * scoring the derived response or scoring the declared response — via a
 * bounded, stable `path`, and never lets the exception's raw message or
 * stack trace reach persisted evidence. `scoreQuestion` is the real exam
 * scoring engine (out of this gate's control): an unhandled throw here
 * must never abort verification or certify a candidate; it must always
 * surface as a deterministic `scoring_engine_error` issue instead.
 */
function safeScoreQuestion(
  question: Question,
  response: Parameters<typeof scoreQuestion>[1],
  invocation: "derived_response" | "declared_response",
):
  | { readonly ok: true; readonly score: ReturnType<typeof scoreQuestion> }
  | { readonly ok: false; readonly issue: CorrectnessVerificationIssue } {
  try {
    return { ok: true, score: scoreQuestion(question, response) };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      issue: issue(
        "scoring_engine_error",
        `scoring.${invocation}`,
        `The scoring engine threw while scoring the ${invocation === "derived_response" ? "independently derived" : "declared"} response: ${rawMessage}`,
        "error",
      ),
    };
  }
}

function summariseScoring(score: {
  readonly status: "correct" | "incorrect" | "manual_review" | "unanswered";
  readonly awardedMarks: number;
  readonly availableMarks: number;
}): ScoringOutcomeSummary {
  return {
    status: score.status,
    awardedMarks: score.awardedMarks,
    availableMarks: score.availableMarks,
    fullMarks: score.status === "correct" && score.awardedMarks === score.availableMarks && score.availableMarks > 0,
  };
}

interface ComparisonOutcome {
  readonly matches: boolean;
  readonly message: string;
}

/** Compares an independently derived value against the declared answer key — the same shape, the same semantics, never a re-derivation of the key itself. */
function compareDerivedToDeclared(question: Question, derived: DerivedValue): ComparisonOutcome {
  const key = question.answerKey;

  if (derived.kind === "number") {
    if (key.kind !== "number") {
      return { matches: false, message: `Derived a numeric value but the answer key kind is '${key.kind}'.` };
    }
    const declared = fractionFromFiniteNumber(key.value);
    const tolerance = fractionFromFiniteNumber(key.tolerance);
    const matches = fractionWithinTolerance(derived.value, declared, tolerance);
    return {
      matches,
      message: matches
        ? ""
        : `Independently derived value ${fractionToDisplayString(derived.value)} disagrees with declared answer ${key.value} (tolerance ${key.tolerance}).`,
    };
  }

  if (derived.kind === "boolean") {
    if (key.kind !== "boolean") {
      return { matches: false, message: `Derived a boolean value but the answer key kind is '${key.kind}'.` };
    }
    const matches = derived.value === key.value;
    return { matches, message: matches ? "" : `Independently derived value ${derived.value} disagrees with declared answer ${key.value}.` };
  }

  if (derived.kind === "single_option") {
    if (key.kind !== "single_option") {
      return { matches: false, message: `Derived a single option but the answer key kind is '${key.kind}'.` };
    }
    const matches = derived.optionId === key.optionId;
    return {
      matches,
      message: matches ? "" : `Independently derived option '${derived.optionId}' disagrees with declared option '${key.optionId}'.`,
    };
  }

  if (derived.kind === "multiple_options") {
    if (key.kind !== "multiple_options") {
      return { matches: false, message: `Derived a multi-option set but the answer key kind is '${key.kind}'.` };
    }
    const derivedSet = new Set(derived.optionIds);
    const declaredSet = new Set(key.optionIds);
    const matches = derivedSet.size === declaredSet.size && [...declaredSet].every((id) => derivedSet.has(id));
    return { matches, message: matches ? "" : "Independently derived option set disagrees with the declared option set." };
  }

  if (derived.kind === "ordering") {
    if (key.kind !== "ordering") {
      return { matches: false, message: `Derived an ordering but the answer key kind is '${key.kind}'.` };
    }
    const matches =
      derived.optionIds.length === key.optionIds.length &&
      derived.optionIds.every((id, index) => id === key.optionIds[index]);
    return { matches, message: matches ? "" : "Independently derived order disagrees with the declared order." };
  }

  if (derived.kind === "matching") {
    if (key.kind !== "matching") {
      return { matches: false, message: `Derived a matching set but the answer key kind is '${key.kind}'.` };
    }
    const declaredMap = new Map(key.pairs.map((pair) => [pair.sourceId, pair.targetId]));
    const matches =
      derived.pairs.length === key.pairs.length &&
      derived.pairs.every((pair) => declaredMap.get(pair.sourceId) === pair.targetId);
    return { matches, message: matches ? "" : "Independently derived pairing disagrees with the declared pairing." };
  }

  if (derived.kind === "fill_blank") {
    if (key.kind !== "fill_blank") {
      return { matches: false, message: `Derived fill-blank values but the answer key kind is '${key.kind}'.` };
    }
    const matches = Object.entries(derived.values).every(([id, value]) => {
      const blank = key.blanks.find((entry) => entry.id === id);
      return (
        blank !== undefined &&
        blank.acceptedAnswers.some((accepted) => accepted.trim().toLocaleLowerCase("en-AU") === value.trim().toLocaleLowerCase("en-AU"))
      );
    });
    return { matches, message: matches ? "" : "Independently derived blank value disagrees with the declared accepted answers." };
  }

  if (key.kind !== "dropdown") {
    return { matches: false, message: `Derived dropdown values but the answer key kind is '${key.kind}'.` };
  }
  const matches = Object.entries(derived.values).every(([id, optionId]) => {
    const field = key.fields.find((entry) => entry.id === id);
    return field !== undefined && field.correctOptionId === optionId;
  });
  return { matches, message: matches ? "" : "Independently derived dropdown value disagrees with the declared correct option." };
}

/**
 * Exported purely for direct unit-testing: `essay`, `hotspot`, `drag_drop`,
 * and `label_diagram` cannot currently reach `verifyCandidateCorrectness`
 * end-to-end at all, because the shared `candidateQuestionSchema` this gate
 * correctly reuses (via `parseCandidateQuestion` — the same trust boundary
 * `validateCandidateStructure` already enforces) does not accept those
 * types (see `ingestion/mappings.ts`'s `HARVEST_SUPPORTED_QUESTION_TYPES`).
 * A candidate of one of those types cannot reach `structural_validation_passed`
 * today regardless of which gate is asked. This classification logic is
 * still correct and forward-compatible for whenever that adapter-level
 * restriction is lifted (out of Mission 2C's scope) — see the Mission 2C
 * report's "confirmed gaps" section.
 */
export function isSemanticCategory(question: Question): boolean {
  return (
    question.type === "essay" ||
    question.type === "reading_comprehension" ||
    question.answerKey.kind === "manual" ||
    (question.type === "short_answer" && question.answerKey.kind === "text") ||
    ((question.type === "fill_blank" || question.type === "dropdown") && question.metadata.subject !== "numeracy")
  );
}

export function isUnsupportedInteractionCategory(question: Question): boolean {
  return question.type === "drag_drop" || question.type === "hotspot" || question.type === "label_diagram";
}

export function verifyCandidateCorrectness(
  candidate: QuestionFactoryCandidate,
  context: CorrectnessVerificationContext,
): CorrectnessVerificationResult {
  const bindingIssues: CorrectnessVerificationIssue[] = [];

  const provenanceOutcome = parseCandidateProvenance(candidate.provenance);
  const questionOutcome = parseCandidateQuestion(candidate.question);

  if (context.structuralEvidence === undefined) {
    bindingIssues.push(
      issue("missing_structural_evidence", "structuralEvidence", "No structural-validation evidence was supplied for this candidate.", "error"),
    );
  } else {
    const evidence = context.structuralEvidence;
    if (evidence.candidateId !== candidate.candidateId) {
      bindingIssues.push(
        issue(
          "structural_evidence_mismatch",
          "structuralEvidence.candidateId",
          `Structural evidence belongs to candidate '${evidence.candidateId}', not '${candidate.candidateId}'.`,
          "error",
        ),
      );
    }
    if (evidence.outcome !== "passed") {
      bindingIssues.push(
        issue(
          "structural_evidence_mismatch",
          "structuralEvidence.outcome",
          `Structural evidence outcome is '${evidence.outcome}', not 'passed'.`,
          "error",
        ),
      );
    }
    if (provenanceOutcome.ok) {
      if (evidence.candidateRevision !== provenanceOutcome.data.revision) {
        bindingIssues.push(
          issue(
            "structural_evidence_mismatch",
            "structuralEvidence.candidateRevision",
            `Structural evidence recorded revision ${evidence.candidateRevision}, but the candidate is now at revision ${provenanceOutcome.data.revision}.`,
            "error",
          ),
        );
      }
      if (evidence.candidateContentHash !== provenanceOutcome.data.contentHash) {
        bindingIssues.push(
          issue(
            "structural_evidence_mismatch",
            "structuralEvidence.candidateContentHash",
            "Structural evidence content hash no longer matches the candidate's current content hash.",
            "error",
          ),
        );
      }
    }
    if (evidence.blueprintHash !== context.blueprintHash) {
      bindingIssues.push(
        issue(
          "structural_evidence_mismatch",
          "structuralEvidence.blueprintHash",
          "Structural evidence blueprint hash no longer matches the candidate's current blueprint.",
          "error",
        ),
      );
    }
    if (
      evidence.schemaVersion !== FACTORY_VERSIONS.SCHEMA_VERSION ||
      evidence.taxonomyVersion !== FACTORY_VERSIONS.TAXONOMY_VERSION ||
      evidence.validatorVersion !== STRUCTURAL_VALIDATOR_VERSION
    ) {
      bindingIssues.push(
        issue(
          "stale_structural_evidence",
          "structuralEvidence",
          "Structural evidence was produced under a schema/taxonomy/validator version that is no longer current.",
          "error",
        ),
      );
    }

    // Every field check above compares one visible attribute at a time; none
    // of them alone proves the report as a whole is internally consistent.
    // Recomputing `validationFingerprint` from the report's own stored
    // fields — the same authoritative algorithm the structural gate itself
    // used to mint it — catches any visible field edited without a
    // corresponding fingerprint update (or the fingerprint itself tampered
    // with), including fields no individual check above inspects at all
    // (`checksPerformed`, `issueSummary`). Reuses
    // `computeStructuralValidationFingerprint` rather than re-declaring the
    // hash shape, exactly like `validateCachedCorrectnessReplay` already
    // does for the cached-replay path.
    const recomputedStructuralFingerprint = computeStructuralValidationFingerprint({
      candidateId: evidence.candidateId,
      candidateRevision: evidence.candidateRevision,
      candidateContentHash: evidence.candidateContentHash,
      blueprintHash: evidence.blueprintHash,
      validatorVersion: evidence.validatorVersion,
      schemaVersion: evidence.schemaVersion,
      taxonomyVersion: evidence.taxonomyVersion,
      checksPerformed: evidence.checksPerformed,
      issueSummary: evidence.issueSummary,
      outcome: evidence.outcome,
    });
    if (recomputedStructuralFingerprint !== evidence.validationFingerprint) {
      bindingIssues.push(
        issue(
          "structural_evidence_mismatch",
          "structuralEvidence.validationFingerprint",
          "Recomputed structural-validation fingerprint does not match the stored value — the report's visible fields were edited without a corresponding fingerprint update, or the fingerprint itself was tampered with.",
          "error",
        ),
      );
    }
  }

  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    bindingIssues.push(
      issue(
        "structural_evidence_mismatch",
        "candidate",
        "Candidate no longer parses against the schemas structural validation attested; its content may have drifted since that gate ran.",
        "error",
      ),
    );
  }

  const candidateRevision = provenanceOutcome.ok ? provenanceOutcome.data.revision : 0;
  const candidateContentHash = provenanceOutcome.ok ? provenanceOutcome.data.contentHash : "unavailable";
  const structuralEvidenceFingerprint = context.structuralEvidence?.validationFingerprint;

  const baseEvidenceInput = {
    candidateId: candidate.candidateId,
    candidateRevision,
    candidateContentHash,
    ...(context.blueprintHash !== undefined ? { blueprintHash: context.blueprintHash } : {}),
    ...(structuralEvidenceFingerprint !== undefined ? { structuralEvidenceFingerprint } : {}),
    verifiedAt: context.verifiedAt,
  };

  if (bindingIssues.length > 0) {
    const evidenceRecord = buildCorrectnessEvidence({
      ...baseEvidenceInput,
      capability: "unsupported",
      issues: bindingIssues,
      outcome: "failed",
    });
    return { status: "failed", capability: "unsupported", issues: bindingIssues, evidence: evidenceRecord };
  }

  if (!provenanceOutcome.ok || !questionOutcome.ok) {
    throw new Error("unreachable: binding issues must be non-empty when provenance/question parsing fails");
  }

  const productionSchemaOutcome = checkAgainstProductionSchema(questionOutcome.data);
  if (!productionSchemaOutcome.ok) {
    const issues = [
      issue(
        "structural_evidence_mismatch",
        "question",
        "Candidate question no longer satisfies the production schema despite passed structural evidence.",
        "error",
      ),
    ];
    const evidenceRecord = buildCorrectnessEvidence({ ...baseEvidenceInput, capability: "unsupported", issues, outcome: "failed" });
    return { status: "failed", capability: "unsupported", issues, evidence: evidenceRecord };
  }
  const question = productionSchemaOutcome.question;

  if (isUnsupportedInteractionCategory(question)) {
    const issues = [
      issue(
        "unsupported_correctness_category",
        "question.type",
        `Question type '${question.type}' has no deterministic or independently-verifiable check implemented in this gate.`,
        "error",
      ),
    ];
    const evidenceRecord = buildCorrectnessEvidence({ ...baseEvidenceInput, capability: "unsupported", issues, outcome: "failed" });
    return { status: "failed", capability: "unsupported", issues, evidence: evidenceRecord };
  }

  const isManual = question.answerKey.kind === "manual";
  const isSemantic = isSemanticCategory(question);

  let capability: CorrectnessCapability;
  let deterministicCategory: string | undefined;
  let derivedValue: DerivedValue | undefined;
  let derivedRepresentation: string | undefined;
  let derivationFailureIssue: CorrectnessVerificationIssue | undefined;

  if (isSemantic) {
    capability = "requires_independent_semantic_review";
  } else {
    // `workingSteps` is candidate-only metadata (never on the production
    // `question.schema.ts` realisation `question` itself was built from —
    // see `production-schema-check.ts`'s synthetic mapping), so it is
    // threaded through from the candidate's own parsed shape rather than
    // read off `question`. Only `attemptMultistep` (registered last in
    // `DERIVATION_METHODS`) consults it; every other method ignores it.
    const derivation = deriveIndependentAnswer(question, questionOutcome.data.workingSteps);
    if (derivation.ok) {
      capability = "deterministically_verifiable";
      deterministicCategory = derivation.category;
      derivedValue = derivation.value;
      derivedRepresentation = derivation.representation;
    } else {
      capability = "structurally_scoreable_only";
      derivationFailureIssue = issue(
        derivation.issueCode ?? "unable_to_derive_answer",
        "question",
        derivation.message ?? "No deterministic derivation method could resolve this question.",
        "review_required",
      );
    }
  }

  let declaredScoring: ScoringOutcomeSummary | undefined;
  let declaredRepresentation: string | undefined;
  const declaredIssues: CorrectnessVerificationIssue[] = [];

  if (!isManual) {
    const declaredResponse = buildDeclaredResponse(question);
    declaredRepresentation = representDeclaredAnswer(question);
    const scoringOutcome = safeScoreQuestion(question, declaredResponse, "declared_response");
    if (!scoringOutcome.ok) {
      declaredIssues.push(scoringOutcome.issue);
    } else {
      declaredScoring = summariseScoring(scoringOutcome.score);
      if (!declaredScoring.fullMarks) {
        declaredIssues.push(
          issue(
            "canonical_response_not_full_marks",
            "answerKey",
            `The declared answer key does not score full marks through the real scoring engine (status '${scoringOutcome.score.status}', ${scoringOutcome.score.awardedMarks}/${scoringOutcome.score.availableMarks}).`,
            "error",
          ),
        );
      }
    }
  }

  if (declaredIssues.length > 0) {
    const evidenceRecord = buildCorrectnessEvidence({
      ...baseEvidenceInput,
      capability,
      ...(deterministicCategory !== undefined ? { deterministicCategory } : {}),
      ...(declaredRepresentation !== undefined
        ? { declaredAnswer: { method: "declared", representation: declaredRepresentation } }
        : {}),
      ...(declaredScoring !== undefined ? { declaredScoring } : {}),
      issues: declaredIssues,
      outcome: "failed",
    });
    return { status: "failed", capability, issues: declaredIssues, evidence: evidenceRecord };
  }

  if (capability === "requires_independent_semantic_review") {
    const issues = [
      issue(
        "semantic_review_required",
        "question.type",
        `Question type '${question.type}' (or its manual/text answer key) requires independent semantic review; deterministic correctness cannot be established.`,
        "review_required",
      ),
    ];
    const evidenceRecord = buildCorrectnessEvidence({
      ...baseEvidenceInput,
      capability,
      ...(declaredRepresentation !== undefined
        ? { declaredAnswer: { method: "declared", representation: declaredRepresentation } }
        : {}),
      ...(declaredScoring !== undefined ? { declaredScoring } : {}),
      issues,
      outcome: "review_required",
    });
    return { status: "review_required", capability, issues, evidence: evidenceRecord };
  }

  if (capability === "structurally_scoreable_only") {
    const issues = derivationFailureIssue ? [derivationFailureIssue] : [];
    const evidenceRecord = buildCorrectnessEvidence({
      ...baseEvidenceInput,
      capability,
      ...(declaredRepresentation !== undefined
        ? { declaredAnswer: { method: "declared", representation: declaredRepresentation } }
        : {}),
      ...(declaredScoring !== undefined ? { declaredScoring } : {}),
      issues,
      outcome: "review_required",
    });
    return { status: "review_required", capability, issues, evidence: evidenceRecord };
  }

  // capability === "deterministically_verifiable"
  const derived = derivedValue as DerivedValue;
  const comparisonIssues: CorrectnessVerificationIssue[] = [];

  const comparison = compareDerivedToDeclared(question, derived);
  if (!comparison.matches) {
    comparisonIssues.push(issue("declared_answer_mismatch", "answerKey", comparison.message, "error"));
  }

  const derivedResponse = buildResponseFromDerivedValue(derived);
  const derivedScoringOutcome = safeScoreQuestion(question, derivedResponse, "derived_response");
  let derivedScoring: ScoringOutcomeSummary | undefined;
  if (!derivedScoringOutcome.ok) {
    comparisonIssues.push(derivedScoringOutcome.issue);
  } else {
    derivedScoring = summariseScoring(derivedScoringOutcome.score);
    if (!derivedScoring.fullMarks) {
      comparisonIssues.push(
        issue(
          "derived_response_not_full_marks",
          "answerKey",
          `The independently derived response does not score full marks (status '${derivedScoringOutcome.score.status}', ${derivedScoringOutcome.score.awardedMarks}/${derivedScoringOutcome.score.availableMarks}).`,
          "error",
        ),
      );
    }
  }

  const explanationOutcome = checkExplanationConsistency(question, derived);
  if (!explanationOutcome.consistent) {
    comparisonIssues.push(
      issue(
        "explanation_contradiction",
        "question.explanation",
        explanationOutcome.message ?? "Explanation contradicts the independently verified answer.",
        "error",
      ),
    );
  }

  const outcome: "passed" | "failed" = comparisonIssues.length === 0 ? "passed" : "failed";
  const evidenceRecord = buildCorrectnessEvidence({
    ...baseEvidenceInput,
    capability,
    ...(deterministicCategory !== undefined ? { deterministicCategory } : {}),
    ...(declaredRepresentation !== undefined
      ? { declaredAnswer: { method: "declared", representation: declaredRepresentation } }
      : {}),
    derivedAnswer: {
      method: deterministicCategory ?? "unknown",
      representation: derivedRepresentation ?? representDerivedValue(derived),
    },
    ...(declaredScoring !== undefined ? { declaredScoring } : {}),
    ...(derivedScoring !== undefined ? { derivedScoring } : {}),
    issues: comparisonIssues,
    outcome,
  });

  if (outcome === "passed") {
    return { status: "passed", capability: "deterministically_verifiable", evidence: evidenceRecord };
  }
  return { status: "failed", capability, issues: comparisonIssues, evidence: evidenceRecord };
}
