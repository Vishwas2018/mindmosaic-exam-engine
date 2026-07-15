import type { Question } from "@/schemas/question.schema";

import type { SemanticClassification } from "./states";

/**
 * Mirrors `correctness/verify-candidate-correctness.ts`'s
 * `isUnsupportedInteractionCategory` exactly. Deliberately duplicated
 * (not imported): `workflow/` is a foundational layer `correctness/`
 * itself depends on (via `applyTransition`/`decideGateFailureOutcome`),
 * so importing from `correctness/` here would introduce a real module
 * cycle (`workflow` -> `correctness` -> `validation` -> `workflow`).
 * `src/tests/unit/question-factory/workflow-semantic-classification.test.ts`
 * asserts this stays behaviourally identical to the correctness gate's
 * own copy, so the two can never silently drift — the same "duplicated
 * here, not imported, with a consistency test" pattern already used by
 * `generation/prompt-builder.ts`'s `STIMULUS_REQUIRED_QUESTION_TYPES`.
 */
function isUnsupportedInteractionCategory(question: Pick<Question, "type">): boolean {
  return question.type === "drag_drop" || question.type === "hotspot" || question.type === "label_diagram";
}

/**
 * PD-2 (Mission 3 prerequisite decisions): `SemanticClassification` is a
 * pure, deterministic, candidate-derived property — never blueprint-
 * declared, never self-declared by a generator or reviewer. It is a
 * strict three-way refinement of `correctness/`'s already-implemented,
 * already-audited two-way split (`isSemanticCategory` /
 * `isUnsupportedInteractionCategory`): every input this function accepts
 * is a structurally-valid `Question` (or the equivalent narrowed shape),
 * so classification only ever runs after structural validation has
 * already guaranteed `type`/`answerKey`/`metadata` are schema-valid.
 *
 * Total over the closed `(type, answerKey.kind, metadata.subject)` domain
 * — the `isUnsupportedInteractionCategory` branch and the final `default`
 * branch both fail closed to `manual_review_writing`, the strictest
 * bucket, never to `deterministically_computable`. This is the general
 * rule for any future question type or answer-key kind not explicitly
 * matched by an earlier branch: a new case must be added *above* the
 * fail-closed default, never assumed safe by omission.
 */
export function classifySemanticCategory(
  question: Pick<Question, "type" | "answerKey" | "metadata">,
): SemanticClassification {
  if (isUnsupportedInteractionCategory(question)) {
    // drag_drop / hotspot / label_diagram: currently unreachable in
    // practice (refused upstream by the correctness gate's "unsupported"
    // capability before ever reaching semantic review), but this value
    // exists for forward compatibility if that gap closes later — see
    // `isUnsupportedInteractionCategory`'s own doc comment.
    return "manual_review_writing";
  }

  if (
    question.type === "essay" ||
    question.type === "reading_comprehension" ||
    question.answerKey.kind === "manual"
  ) {
    return "manual_review_writing";
  }

  if (
    // Explicit `type === "short_answer"` guard (matching `correctness/`'s
    // own `isSemanticCategory` exactly), rather than testing
    // `answerKey.kind === "text"` alone: the production schema's
    // `compatibleAnswerKinds` map currently only permits `"text"` for
    // `short_answer` and `reading_comprehension` (the latter already
    // returned above), so the two conditions are equivalent today — but
    // asserting the type explicitly here means this function stays
    // correct even if that schema-level constraint is ever loosened,
    // rather than silently depending on an invariant enforced in an
    // unrelated file.
    (question.type === "short_answer" && question.answerKey.kind === "text") ||
    ((question.type === "fill_blank" || question.type === "dropdown") &&
      question.metadata.subject !== "numeracy")
  ) {
    return "semantic_objective";
  }

  return "deterministically_computable";
}
