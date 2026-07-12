import { scoreQuestion } from "@/features/exam-engine/scoring/score-question";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { AnswerKey, Question } from "@/schemas/question.schema";

import type { StructuralValidationIssue } from "./types";

function issue(
  code: StructuralValidationIssue["code"],
  path: string,
  message: string,
): StructuralValidationIssue {
  return { code, path, message, severity: "error" };
}

/**
 * Builds the canonical correct response straight from the declared answer
 * key, in the exact shape each scorer consumes (mirrors the equivalent
 * test-only helper at `src/tests/fixtures/canonical-response.ts`, which
 * this production module cannot import from). `manual` (essay/short-answer
 * rubric) has no deterministic "correct" response — it is always routed to
 * a human — so it returns `undefined` and is never scored here.
 */
function buildCanonicalResponse(answerKey: AnswerKey): CandidateAnswer | undefined {
  switch (answerKey.kind) {
    case "single_option":
      return answerKey.optionId;
    case "multiple_options":
      return [...answerKey.optionIds];
    case "number":
      return answerKey.value;
    case "text":
      return answerKey.acceptableAnswers[0];
    case "boolean":
      return answerKey.value;
    case "fill_blank":
      return Object.fromEntries(
        answerKey.blanks.map((blank) => [blank.id, blank.acceptedAnswers[0] as string]),
      );
    case "dropdown":
      return Object.fromEntries(answerKey.fields.map((field) => [field.id, field.correctOptionId]));
    case "matching":
      return Object.fromEntries(answerKey.pairs.map((pair) => [pair.sourceId, pair.targetId]));
    case "ordering":
      return [...answerKey.optionIds];
    case "hotspot":
      return [...answerKey.regionIds];
    case "drag_drop":
      return { ...answerKey.placements };
    case "manual":
      return undefined;
  }
}

/**
 * Confirms the candidate can be represented by the real scoring contracts:
 * builds the canonical correct response from its own answer key and
 * scores it with the actual `scoreQuestion` used at exam time, asserting
 * only that the shape round-trips to `status: "correct"` — a tautology by
 * construction whenever the answer key's ids resolve (already guaranteed
 * by `checkAgainstProductionSchema` running first), so this step's real
 * value is exercising `scoreQuestion` itself rather than re-deriving its
 * assumptions by hand. This is never a claim that the declared answer is
 * mathematically or semantically *correct* in the real-world sense — that
 * determination belongs to Mission 2C's correctness gate, not here.
 */
export function checkScoringCompatibility(question: Question): readonly StructuralValidationIssue[] {
  const canonicalResponse = buildCanonicalResponse(question.answerKey);
  if (canonicalResponse === undefined && question.answerKey.kind !== "manual") {
    return [
      issue(
        "scoring_representation_failed",
        "question.answerKey",
        "Could not construct a canonical response from this answer key.",
      ),
    ];
  }
  if (question.answerKey.kind === "manual") return [];

  try {
    const score = scoreQuestion(question, canonicalResponse);
    if (score.status !== "correct") {
      return [
        issue(
          "scoring_representation_failed",
          "question.answerKey",
          `Canonical response built from the answer key scored '${score.status}', not 'correct' — the answer key is not representable by the real scoring contract.`,
        ),
      ];
    }
    return [];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return [
      issue(
        "scoring_representation_failed",
        "question.answerKey",
        `Scoring the canonical response threw: ${message}`,
      ),
    ];
  }
}
