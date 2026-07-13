import { describe, expect, it } from "vitest";

import { evaluateExpression, extractArithmeticExpression } from "@/features/question-factory/correctness/arithmetic-expression";
import { fractionToDisplayString } from "@/features/question-factory/correctness/numeric";

describe("evaluateExpression", () => {
  it("evaluates addition, subtraction, multiplication and division with correct precedence", () => {
    expect(fractionToDisplayString(mustEval("2 + 3 * 4"))).toBe("14");
    expect(fractionToDisplayString(mustEval("(2 + 3) * 4"))).toBe("20");
    expect(fractionToDisplayString(mustEval("90 - 37"))).toBe("53");
    expect(fractionToDisplayString(mustEval("84 / 4"))).toBe("21");
  });

  it("normalises alternate multiply/divide glyphs", () => {
    expect(fractionToDisplayString(mustEval("6 x 7"))).toBe("42");
    expect(fractionToDisplayString(mustEval("6 × 7"))).toBe("42");
    expect(fractionToDisplayString(mustEval("12 ÷ 4"))).toBe("3");
  });

  it("evaluates exact decimal arithmetic", () => {
    expect(fractionToDisplayString(mustEval("12.5 + 3.25"))).toBe("63/4");
  });

  it("reports division by zero as a structured failure, never NaN/Infinity", () => {
    const outcome = evaluateExpression("10 / 0");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("division_by_zero");
  });

  it("reports invalid syntax as a structured failure", () => {
    const outcome = evaluateExpression("2 + + 3 *");
    expect(outcome.ok).toBe(false);
  });

  function mustEval(expression: string) {
    const outcome = evaluateExpression(expression);
    if (!outcome.ok) throw new Error(`expected ${expression} to evaluate`);
    return outcome.value;
  }
});

describe("extractArithmeticExpression", () => {
  it("extracts the single machine-parseable expression from a prompt", () => {
    const outcome = extractArithmeticExpression("What is 23 + 48?");
    expect(outcome.ok).toBe(true);
    if (outcome.ok) expect(fractionToDisplayString(outcome.value)).toBe("71");
  });

  it("reports not_found when the prompt implies a calculation without a literal expression", () => {
    const outcome = extractArithmeticExpression("Sam has some apples and gives some away. How many are left?");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("not_found");
  });

  it("reports ambiguous when more than one distinct expression is present", () => {
    const outcome = extractArithmeticExpression("Is 2 + 2 the same as 3 + 3?");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("ambiguous");
  });

  it("never matches a bare number with no operator", () => {
    const outcome = extractArithmeticExpression("There are 15 students in the class.");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("not_found");
  });
});
