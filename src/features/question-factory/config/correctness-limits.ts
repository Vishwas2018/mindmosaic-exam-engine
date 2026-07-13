/**
 * Every bounded size the correctness-verification gate (Mission 2C)
 * enforces, in one place, so no derivation/parsing module invents its own
 * magic number. Every limit here exists to make an otherwise-unbounded
 * operation (hand-rolled arithmetic parsing, BigInt fraction construction,
 * persisted issue evidence) fail closed with a stable issue code rather
 * than exhausting memory, blowing the call stack, or leaking unbounded
 * content into a stored report.
 */
export const CORRECTNESS_LIMITS = Object.freeze({
  // Arithmetic-expression parsing (arithmetic-expression.ts). Bounds are
  // deliberately generous for any real prompt-derived expression while
  // remaining far below anything that could exhaust memory or the call
  // stack.
  ARITHMETIC_MAX_EXPRESSION_LENGTH: 200,
  ARITHMETIC_MAX_TOKEN_COUNT: 80,
  ARITHMETIC_MAX_PAREN_DEPTH: 20,
  ARITHMETIC_MAX_NUMERIC_LITERAL_LENGTH: 20,
  ARITHMETIC_MAX_OPERATOR_COUNT: 40,

  // Exact fraction/decimal parsing (numeric.ts, fraction-decimal.ts).
  // Bounds the digit length of a numerator/denominator/decimal literal
  // *before* it is ever passed to `BigInt(...)`, so a pathological input
  // (e.g. a thousand-digit string) is rejected before an expensive BigInt
  // is ever constructed, not just after via magnitude checks. Kept at or
  // below 15 digits so a value at this exact digit-length bound still
  // fits under `numeric.ts`'s separate `MAX_MAGNITUDE` (10^15) magnitude
  // check — the two bounds are deliberately consistent, not just
  // independently enforced.
  FRACTION_MAX_DIGIT_LENGTH: 15,

  // Independent ordering/matching tasks (fraction-decimal.ts's
  // `sortByValue`, derive-answer.ts's ordering/matching derivations) —
  // bounds the pairwise-comparison work, which is quadratic in item count.
  MAX_ORDERING_ITEMS: 30,

  // Money derivation (money.ts, derive-answer.ts's `attemptMoney`).
  MONEY_MAX_LINE_ITEMS: 30,
  MONEY_MAX_QUANTITY: 100000,
  MONEY_MAX_TOTAL_CENTS: 100000000, // $1,000,000.00

  // Persisted issue evidence (verify-candidate-correctness.ts,
  // derive-answer.ts). A single bound applied uniformly wherever a
  // `CorrectnessVerificationIssue.message` is constructed from
  // prompt-derived, expression-derived, or exception-derived text.
  MAX_ISSUE_MESSAGE_LENGTH: 300,
});
