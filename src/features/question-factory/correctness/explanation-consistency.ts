/**
 * Explanation-consistency check: supporting evidence only, never the
 * source of truth. Deliberately narrow — it only flags an explicit final
 * numeric claim in the explanation text ("... = 71.") that disagrees with
 * the independently verified numeric answer. Equivalent wording,
 * abbreviated workings, and omitted optional detail are all "consistent"
 * by construction, since this check never asserts anything about
 * explanation quality beyond the one explicit claim it looks for.
 */
import type { Question } from "@/schemas/question.schema";

import type { DerivedValue } from "./derived-value";
import { fractionFromDecimalString, fractionsEqual, type Fraction } from "./numeric";

const EXPLANATION_FINAL_VALUE_PATTERN = /(?:=|is|equals)\s*(-?\d+(?:\.\d+)?)\s*\.?\s*$/i;

export interface ExplanationConsistencyOutcome {
  readonly consistent: boolean;
  readonly message?: string;
}

export function checkExplanationConsistency(
  question: Question,
  derived: DerivedValue,
): ExplanationConsistencyOutcome {
  if (derived.kind !== "number") return { consistent: true };

  const match = question.explanation.trim().match(EXPLANATION_FINAL_VALUE_PATTERN);
  if (!match) return { consistent: true };

  let claimed: Fraction;
  try {
    claimed = fractionFromDecimalString(match[1]);
  } catch {
    return { consistent: true };
  }

  if (fractionsEqual(claimed, derived.value)) return { consistent: true };
  return {
    consistent: false,
    message: `Explanation states a final value of '${match[1]}', which disagrees with the independently verified answer.`,
  };
}
