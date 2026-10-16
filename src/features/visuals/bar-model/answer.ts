/** Browser-safe exact answer mapping shared by the bank and correctness gate. */
import type { Question } from "@/schemas/question.schema";
import { parseNumericToken } from "@/features/question-factory/correctness/fraction-decimal";
import {
  fractionToDisplayString,
  fractionsEqual,
  makeFraction,
  NumericDerivationError,
} from "@/features/question-factory/correctness/numeric";
import type { DerivationOutcome } from "@/features/question-factory/correctness/derive-answer";

import { validateBarModelVisual } from "./pipeline";

function failure(
  reason: "ambiguous" | "cannot_derive",
  issueCode: "ambiguous_visual_data" | "unable_to_derive_answer" | "numeric_overflow",
  message: string,
): DerivationOutcome {
  return { ok: false, reason, issueCode, message };
}

/** Bar-model targets are authoritative structured data, before any prompt heuristic. */
export function deriveBarModelAnswer(question: Question): DerivationOutcome {
  const visuals = question.visuals.filter((visual) => visual.type === "bar_model");
  if (visuals.length === 0) return { ok: false, reason: "not_applicable" };
  if (visuals.length !== 1) {
    return failure("ambiguous", "ambiguous_visual_data", "Exactly one bar_model visual is required to identify the answer target.");
  }
  // The pipeline parses untrusted shape, then runs solveBarModel with the
  // visual's descriptive text so malformed models and answer leaks fail closed.
  const validation = validateBarModelVisual(visuals[0]);
  if (!validation.ok || !validation.solution?.target) {
    return failure("cannot_derive", "unable_to_derive_answer", `Invalid bar_model: ${validation.errorCodes.join(", ")}.`);
  }
  try {
    const target = validation.solution.target;
    const value = makeFraction(BigInt(target.numerator), BigInt(target.denominator));
    const representation = fractionToDisplayString(value);
    if (question.answerKey.kind === "number") {
      return { ok: true, category: "bar_model", value: { kind: "number", value }, representation };
    }
    if (question.answerKey.kind !== "single_option") {
      return failure("cannot_derive", "unable_to_derive_answer", "bar_model supports numeric and single-option answers only.");
    }
    const matching = question.options.filter((option) => {
      const parsed = parseNumericToken(option.text);
      return parsed !== undefined && fractionsEqual(parsed, value);
    });
    if (matching.length !== 1) {
      return failure("cannot_derive", "unable_to_derive_answer", "bar_model target must match exactly one numeric option.");
    }
    return { ok: true, category: "bar_model", value: { kind: "single_option", optionId: matching[0].id }, representation };
  } catch (error) {
    if (error instanceof NumericDerivationError) return failure("cannot_derive", error.code === "numeric_overflow" ? "numeric_overflow" : "unable_to_derive_answer", error.message);
    throw error;
  }
}

