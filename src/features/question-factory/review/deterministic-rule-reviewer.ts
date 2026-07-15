import type { Question } from "@/schemas/question.schema";

import { normaliseIdentityOrThrow } from "../config";
import { altTextLeaksAnswer, findUnsafeMarkupFields } from "../ingestion/safety";
import { computeReviewResultHash } from "./review-result-hash";
import type { ReviewContext, ReviewOutcome, Reviewer } from "./types";

/** Sentinel used where no real external review-prompt pack was issued (this reviewer never consumes one). */
const NOT_APPLICABLE_PROMPT_TAG = "n-a-deterministic-rule-reviewer" as const;

/**
 * Fixed, versioned, data-independent check catalogue — never a runtime
 * execution trace — mirroring `STRUCTURAL_VALIDATION_CHECK_GROUPS` /
 * `CORRECTNESS_CHECK_CATALOGUE`'s "configured catalogue, not a trace"
 * contract.
 */
export const DETERMINISTIC_REVIEW_CHECKS = [
  "unsafe_markup",
  "alt_text_leakage",
  "non_australian_spelling",
  "rubric_or_explanation_completeness",
  "answer_explanation_consistency",
] as const;
export type DeterministicReviewCheck = (typeof DETERMINISTIC_REVIEW_CHECKS)[number];

export const DETERMINISTIC_RULE_REVIEWER_VERSION = "v1" as const;

/**
 * Small, deterministic denylist of common American-English spellings
 * whose Australian equivalent differs (`docs/CONTENT_RULES.md`'s en-AU
 * requirement). Rule-based, no judgement call: a literal, reproducible
 * substring test, per contract §7 ("Australian English issues (US
 * spelling patterns)"). Intentionally small and explicit rather than a
 * general `-or`/`-ize` heuristic, which would false-positive on
 * legitimate words (e.g. "prize", "size").
 */
const US_SPELLING_PATTERNS: readonly RegExp[] = [
  /\bcolor(s|ed|ing)?\b/i,
  /\bfavorite(s)?\b/i,
  /\bcenter(s|ed|ing)?\b/i,
  /\btheater(s)?\b/i,
  /\bgray\b/i,
  /\borganize(s|d|r)?\b/i,
  /\brecognize(s|d)?\b/i,
  /\bapologize(s|d)?\b/i,
  /\banalyze(s|d)?\b/i,
  /\baluminum\b/i,
  /\bmath\b/i,
];

interface CheckFinding {
  readonly check: DeterministicReviewCheck;
  readonly finding: string;
  readonly blocking: boolean;
}

function checkUnsafeMarkup(question: Question): CheckFinding | undefined {
  const flagged = findUnsafeMarkupFields({
    prompt: question.prompt,
    explanation: question.explanation,
    stimulusBody: question.stimulus?.body,
    stimulusTitle: question.stimulus?.title,
  });
  if (flagged.length === 0) return undefined;
  return {
    check: "unsafe_markup",
    finding: `Unsafe raw/executable markup detected in field(s): ${flagged.join(", ")}.`,
    blocking: true,
  };
}

function deriveAnswerTexts(question: Question): readonly string[] {
  const key = question.answerKey;
  const optionText = (optionId: string): string | undefined =>
    question.options.find((option) => option.id === optionId)?.text;

  switch (key.kind) {
    case "single_option": {
      const text = optionText(key.optionId);
      return text ? [text] : [];
    }
    case "multiple_options":
      return key.optionIds.map(optionText).filter((text): text is string => text !== undefined);
    case "number":
      return [String(key.value)];
    case "text":
      return key.acceptableAnswers;
    case "boolean":
      return [String(key.value)];
    case "fill_blank":
      return key.blanks.flatMap((blank) => blank.acceptedAnswers);
    case "dropdown":
      return key.fields.map((field) => field.correctOptionId);
    default:
      return [];
  }
}

function checkAltTextLeakage(question: Question, answerTexts: readonly string[]): CheckFinding | undefined {
  if (answerTexts.length === 0) return undefined;
  const leaking = question.visuals.filter((visual) => altTextLeaksAnswer(visual.altText, answerTexts));
  if (leaking.length === 0) return undefined;
  return {
    check: "alt_text_leakage",
    finding: `Visual(s) ${leaking.map((visual) => visual.id).join(", ")} alt text appears to reveal the correct answer.`,
    blocking: true,
  };
}

function checkNonAustralianSpelling(question: Question): CheckFinding | undefined {
  const text = [question.prompt, question.explanation, question.stimulus?.body, question.stimulus?.title]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
  const matches = US_SPELLING_PATTERNS.filter((pattern) => pattern.test(text));
  if (matches.length === 0) return undefined;
  return {
    check: "non_australian_spelling",
    finding: `Content contains ${matches.length} US-spelling pattern(s) inconsistent with the en-AU requirement.`,
    blocking: false,
  };
}

/**
 * Bounded completeness check for open-ended content: `manual_review_writing`
 * candidates (essay / manual-answer-key short answer) need a
 * non-trivially-short explanation to serve as marking guidance. A cheap
 * length threshold, not a rubric-quality judgement.
 */
const MIN_RUBRIC_EXPLANATION_LENGTH = 15;

function checkRubricCompleteness(question: Question): CheckFinding | undefined {
  if (question.answerKey.kind !== "manual") return undefined;
  if (question.explanation.trim().length >= MIN_RUBRIC_EXPLANATION_LENGTH) return undefined;
  return {
    check: "rubric_or_explanation_completeness",
    finding: "Manual-answer-key content has no substantive marking guidance in its explanation field.",
    blocking: false,
  };
}

/**
 * Cheap string-overlap check only — explicitly not a substitute for
 * Mission 2C's full independent re-derivation (`correctness/`), which
 * already ran before semantic review and is the actual source of truth
 * for deterministic correctness. This only flags an explanation that
 * does not even literally mention the declared answer, a low-cost
 * sanity signal for reviewer attention.
 */
function checkAnswerExplanationConsistency(question: Question, answerTexts: readonly string[]): CheckFinding | undefined {
  const nonEmptyAnswerTexts = answerTexts.filter((text) => text.trim().length >= 1);
  if (nonEmptyAnswerTexts.length === 0) return undefined;
  const explanation = question.explanation.toLowerCase();
  const mentioned = nonEmptyAnswerTexts.some((text) => explanation.includes(text.trim().toLowerCase()));
  if (mentioned) return undefined;
  return {
    check: "answer_explanation_consistency",
    finding: "Explanation text does not literally mention the declared answer — worth a reviewer's attention (not a re-derivation).",
    blocking: false,
  };
}

function runChecks(question: Question): readonly CheckFinding[] {
  // Computed once and shared: both checks below need the same literal
  // answer-text representation, and deriving it involves a small scan
  // over the answer key / options — no reason to repeat it per check.
  const answerTexts = deriveAnswerTexts(question);
  return [
    checkUnsafeMarkup(question),
    checkAltTextLeakage(question, answerTexts),
    checkNonAustralianSpelling(question),
    checkRubricCompleteness(question),
    checkAnswerExplanationConsistency(question, answerTexts),
  ].filter((finding): finding is CheckFinding => finding !== undefined);
}

/**
 * Rule-based, deterministic semantic-safety reviewer (contract §7). Never
 * performs semantic judgement — every check is a literal, reproducible
 * test, the same input always produces the same finding set.
 *
 * **Authority boundary (contract §7, enforced here, not just by
 * convention):** may emit `result: "passed"` only for
 * `deterministically_computable` content, where deterministic safety
 * checks are already sufficient (per `canAdvanceToSemanticReviewPassed`).
 * For `semantic_objective`/`manual_review_writing` content, this reviewer
 * either defers entirely (nothing to flag — never fabricates a "passed"
 * as if it had reviewed the semantic content) or emits a record capped to
 * `"warning"`/`"failed"`, never `"passed"`.
 */
export class DeterministicRuleReviewer implements Reviewer {
  readonly reviewerClass = "deterministic_rule" as const;
  readonly reviewerIdentity = normaliseIdentityOrThrow("deterministic-fixture-generator");
  readonly reviewerVersion = DETERMINISTIC_RULE_REVIEWER_VERSION;

  async review(context: ReviewContext): Promise<ReviewOutcome> {
    const findings = runChecks(context.question);
    const hasBlocking = findings.some((finding) => finding.blocking);
    const hasAny = findings.length > 0;

    if (context.semanticClassification !== "deterministically_computable" && !hasAny) {
      return { kind: "deferred", reason: "requires_independent_review" };
    }

    const result = hasBlocking
      ? "failed"
      : context.semanticClassification === "deterministically_computable"
        ? hasAny
          ? "warning"
          : "passed"
        : "warning";
    const confidence = hasBlocking || !hasAny ? 1 : 0.5;
    const findingMessages =
      findings.length > 0 ? findings.map((finding) => finding.finding) : ["No deterministic safety issues detected."];
    const evidenceReferences = findings.map((finding) => `check:${finding.check}`);

    // Defensive, code-level assertion of the contract §7 authority
    // boundary: this branch is unreachable given the logic above (a
    // non-deterministically_computable classification can only reach
    // "warning" or "failed" here), but is asserted explicitly rather than
    // only relied upon by construction — the exact "reject any
    // deterministic-reviewer output that claims otherwise" requirement.
    if (result === "passed" && context.semanticClassification !== "deterministically_computable") {
      throw new Error(
        `Invariant violated: a deterministic reviewer must never emit 'passed' for semantic classification '${context.semanticClassification}'.`,
      );
    }

    return {
      kind: "record",
      draft: {
        candidateId: context.candidateId,
        stage: "correctness_check_passed",
        reviewerIdentity: this.reviewerIdentity,
        reviewerVersion: this.reviewerVersion,
        result,
        confidence,
        findings: findingMessages,
        evidenceReferences,
        ambiguityStatus: "none",
        reviewedAt: context.reviewedAt,
        reviewPromptVersion: NOT_APPLICABLE_PROMPT_TAG,
        reviewPromptHash: NOT_APPLICABLE_PROMPT_TAG,
        evidenceBinding: {
          candidateContentHash: context.candidateContentHash,
          blueprintHash: context.blueprintHash,
          candidateRevision: context.candidateRevision,
          reviewResultHash: computeReviewResultHash({
            result,
            confidence,
            findings: findingMessages,
            evidenceReferences,
            ambiguityStatus: "none",
          }),
          semanticClassification: context.semanticClassification,
        },
      },
    };
  }
}
