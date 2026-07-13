/**
 * A small, hand-rolled arithmetic expression parser and evaluator — never
 * `eval()`, never `Function(...)`. Supports `+ - * / ( )` with standard
 * precedence and unary minus, over exact `Fraction` arithmetic. Used to
 * independently recompute a machine-parseable expression found in a
 * candidate's prompt text, mirroring the "verify:<expr>=<expected>"
 * convention already established by `scripts/check-question-correctness.mts`
 * and the harvest's `checkAnswerCorrectness.mjs`.
 */
import {
  addFractions,
  divideFractions,
  type Fraction,
  fractionFromDecimalString,
  multiplyFractions,
  negateFraction,
  NumericDerivationError,
  subtractFractions,
} from "./numeric";

type TokenType = "number" | "op" | "lparen" | "rparen";
interface Token {
  readonly type: TokenType;
  readonly text: string;
}

const OPERATORS = new Set(["+", "-", "*", "/"]);

/** Normalises the common alternate glyphs a prompt might use for multiply/divide before tokenising. */
function normaliseOperatorGlyphs(text: string): string {
  return text.replace(/[×xX]/g, "*").replace(/÷/g, "/");
}

function tokenise(expression: string): readonly Token[] {
  const tokens: Token[] = [];
  const normalised = normaliseOperatorGlyphs(expression);
  let index = 0;
  while (index < normalised.length) {
    const char = normalised[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ type: "lparen", text: char });
      index += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "rparen", text: char });
      index += 1;
      continue;
    }
    if (OPERATORS.has(char)) {
      tokens.push({ type: "op", text: char });
      index += 1;
      continue;
    }
    if (/[0-9.]/.test(char)) {
      const start = index;
      while (index < normalised.length && /[0-9.]/.test(normalised[index])) {
        index += 1;
      }
      tokens.push({ type: "number", text: normalised.slice(start, index) });
      continue;
    }
    throw new NumericDerivationError(
      "invalid_fraction_representation",
      `Unrecognised character '${char}' in expression.`,
    );
  }
  return tokens;
}

class Parser {
  private position = 0;
  constructor(private readonly tokens: readonly Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private consume(): Token {
    const token = this.tokens[this.position];
    if (!token) {
      throw new NumericDerivationError(
        "invalid_fraction_representation",
        "Unexpected end of expression.",
      );
    }
    this.position += 1;
    return token;
  }

  parseExpression(): Fraction {
    let value = this.parseTerm();
    for (;;) {
      const next = this.peek();
      if (!next || next.type !== "op" || (next.text !== "+" && next.text !== "-")) break;
      this.consume();
      const rhs = this.parseTerm();
      value = next.text === "+" ? addFractions(value, rhs) : subtractFractions(value, rhs);
    }
    return value;
  }

  private parseTerm(): Fraction {
    let value = this.parseUnary();
    for (;;) {
      const next = this.peek();
      if (!next || next.type !== "op" || (next.text !== "*" && next.text !== "/")) break;
      this.consume();
      const rhs = this.parseUnary();
      value = next.text === "*" ? multiplyFractions(value, rhs) : divideFractions(value, rhs);
    }
    return value;
  }

  private parseUnary(): Fraction {
    const next = this.peek();
    if (next && next.type === "op" && next.text === "-") {
      this.consume();
      return negateFraction(this.parseUnary());
    }
    if (next && next.type === "op" && next.text === "+") {
      this.consume();
      return this.parseUnary();
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Fraction {
    const token = this.consume();
    if (token.type === "number") {
      return fractionFromDecimalString(token.text);
    }
    if (token.type === "lparen") {
      const value = this.parseExpression();
      const closing = this.consume();
      if (closing.type !== "rparen") {
        throw new NumericDerivationError(
          "invalid_fraction_representation",
          "Missing closing parenthesis.",
        );
      }
      return value;
    }
    throw new NumericDerivationError(
      "invalid_fraction_representation",
      `Unexpected token '${token.text}' in expression.`,
    );
  }

  isAtEnd(): boolean {
    return this.position >= this.tokens.length;
  }
}

export type ExpressionEvaluationOutcome =
  | { readonly ok: true; readonly value: Fraction }
  | { readonly ok: false; readonly reason: "division_by_zero" | "numeric_overflow" | "invalid_syntax"; readonly message: string };

/** Evaluates a single, already-isolated arithmetic expression string. */
export function evaluateExpression(expression: string): ExpressionEvaluationOutcome {
  try {
    const parser = new Parser(tokenise(expression));
    const value = parser.parseExpression();
    if (!parser.isAtEnd()) {
      return { ok: false, reason: "invalid_syntax", message: "Trailing tokens after a complete expression." };
    }
    return { ok: true, value };
  } catch (error) {
    if (error instanceof NumericDerivationError) {
      if (error.code === "division_by_zero") return { ok: false, reason: "division_by_zero", message: error.message };
      if (error.code === "numeric_overflow") return { ok: false, reason: "numeric_overflow", message: error.message };
      return { ok: false, reason: "invalid_syntax", message: error.message };
    }
    throw error;
  }
}

/** A maximal run of digits/operators/parens/whitespace containing at least one operator and two number tokens — never a bare number or a lone year-like token. */
const CANDIDATE_EXPRESSION_PATTERN = /[0-9][0-9+\-*/×÷xX().\s]*[0-9]/g;

function hasOperator(candidate: string): boolean {
  return /[+\-*/×÷]/.test(normaliseOperatorGlyphs(candidate).replace(/^-/, ""));
}

export type ExpressionExtractionOutcome =
  | { readonly ok: true; readonly expressionText: string; readonly value: Fraction }
  | { readonly ok: false; readonly reason: "not_found" | "ambiguous" | "division_by_zero" | "numeric_overflow" | "invalid_syntax"; readonly message: string };

/**
 * Scans free-form prompt text for exactly one machine-parseable arithmetic
 * expression. More than one distinct candidate run, or none at all, is
 * reported as an explicit "cannot derive independently" outcome rather than
 * a guess — matching the matrix's `uncertaintyCondition` for the arithmetic
 * category (a word problem whose operation is only implied is not a
 * failure, just not independently computable by this method).
 */
export function extractArithmeticExpression(prompt: string): ExpressionExtractionOutcome {
  const matches = [...prompt.matchAll(CANDIDATE_EXPRESSION_PATTERN)]
    .map((match) => match[0].trim())
    .filter((candidate) => hasOperator(candidate));

  if (matches.length === 0) {
    return { ok: false, reason: "not_found", message: "No machine-parseable arithmetic expression found in the prompt." };
  }

  const distinct = Array.from(new Set(matches));
  if (distinct.length > 1) {
    return {
      ok: false,
      reason: "ambiguous",
      message: `Multiple distinct arithmetic expressions were found in the prompt: ${distinct.join(" | ")}.`,
    };
  }

  const expressionText = distinct[0];
  const evaluation = evaluateExpression(expressionText);
  if (!evaluation.ok) {
    return { ok: false, reason: evaluation.reason, message: evaluation.message };
  }
  return { ok: true, expressionText, value: evaluation.value };
}
