import { describe, expect, it } from "vitest";

import { CORRECTNESS_LIMITS } from "@/features/question-factory/config";
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

describe("evaluateExpression — resource bounds", () => {
  /** Pads a short, valid expression out to an exact character length with trailing whitespace (never counted as a token). */
  function padToLength(expression: string, targetLength: number): string {
    if (expression.length > targetLength) throw new Error("expression already exceeds target length");
    return expression + " ".repeat(targetLength - expression.length);
  }

  it("accepts an expression exactly at the supported character-length limit", () => {
    const expression = padToLength("1+1", CORRECTNESS_LIMITS.ARITHMETIC_MAX_EXPRESSION_LENGTH);
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(true);
  });

  it("rejects an expression one character over the supported length limit", () => {
    const expression = padToLength("1+1", CORRECTNESS_LIMITS.ARITHMETIC_MAX_EXPRESSION_LENGTH + 1);
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("resource_limit_exceeded");
  });

  it("rejects an expression whose token count exceeds the supported limit", () => {
    const terms = CORRECTNESS_LIMITS.ARITHMETIC_MAX_TOKEN_COUNT; // well over the token limit once joined by '+'
    const expression = Array.from({ length: terms }, () => "1").join("+");
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("resource_limit_exceeded");
  });

  it("accepts an expression with a token count safely under the supported limit", () => {
    const expression = Array.from({ length: 10 }, () => "1").join("+");
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(true);
  });

  it("rejects an expression with more operators than the supported limit", () => {
    const terms = CORRECTNESS_LIMITS.ARITHMETIC_MAX_OPERATOR_COUNT + 5;
    const expression = Array.from({ length: terms }, () => "1").join("+");
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("resource_limit_exceeded");
  });

  it("rejects a numeric literal over the supported length limit", () => {
    const hugeLiteral = "9".repeat(CORRECTNESS_LIMITS.ARITHMETIC_MAX_NUMERIC_LITERAL_LENGTH + 5);
    const outcome = evaluateExpression(`${hugeLiteral} + 1`);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("resource_limit_exceeded");
  });

  it("accepts a numeric literal safely under the supported length limit", () => {
    const outcome = evaluateExpression("12345 + 1");
    expect(outcome.ok).toBe(true);
  });

  it("rejects deeply nested parentheses beyond the supported depth, never a stack overflow", () => {
    const depth = CORRECTNESS_LIMITS.ARITHMETIC_MAX_PAREN_DEPTH + 20;
    const expression = "(".repeat(depth) + "1" + ")".repeat(depth);
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("resource_limit_exceeded");
  });

  it("accepts moderately nested parentheses within the supported depth", () => {
    const depth = 5;
    const expression = "(".repeat(depth) + "1" + ")".repeat(depth);
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(true);
  });

  it("rejects a long chain of unary minus operators beyond the supported depth, never a stack overflow", () => {
    const depth = CORRECTNESS_LIMITS.ARITHMETIC_MAX_PAREN_DEPTH + 20;
    const expression = `${"-".repeat(depth)}1 + 1`;
    const outcome = evaluateExpression(expression);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("resource_limit_exceeded");
  });

  it("still rejects division by zero as a structured failure once bounds are satisfied", () => {
    const outcome = evaluateExpression("(1 + 1) / 0");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("division_by_zero");
  });

  it("rejects trailing tokens after a complete expression", () => {
    const outcome = evaluateExpression("2 + 2 3");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("invalid_syntax");
  });

  it("rejects a malformed unary operator sequence", () => {
    const outcome = evaluateExpression("2 + * 3");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.reason).toBe("invalid_syntax");
  });

  it("still accepts a valid unary-minus and precedence expression", () => {
    expect(fractionToDisplayString(mustEvalTopLevel("-2 + 5"))).toBe("3");
    expect(fractionToDisplayString(mustEvalTopLevel("-(2 + 5)"))).toBe("-7");
  });

  function mustEvalTopLevel(expression: string) {
    const outcome = evaluateExpression(expression);
    if (!outcome.ok) throw new Error(`expected ${expression} to evaluate`);
    return outcome.value;
  }
});
