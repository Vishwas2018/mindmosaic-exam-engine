/**
 * Deterministic, substring/pattern-based safety checks. Never heuristic or
 * "AI judgement" — every check here is a literal, reproducible test so the
 * same input always produces the same accept/reject outcome, per the
 * determinism requirement.
 */

const UNSAFE_MARKUP_PATTERNS: readonly RegExp[] = [
  /<script[\s>]/i,
  /<svg[\s>]/i,
  /javascript:/i,
  /\bon[a-z]+\s*=/i, // inline event handlers: onerror=, onclick=, ...
  /<iframe[\s>]/i,
];

/** True if the string contains any forbidden raw/executable markup pattern. */
export function containsUnsafeMarkup(value: string): boolean {
  return UNSAFE_MARKUP_PATTERNS.some((pattern) => pattern.test(value));
}

/** Scans a set of named text fields and returns the names of any containing unsafe markup. */
export function findUnsafeMarkupFields(fields: Readonly<Record<string, string | undefined>>): string[] {
  const flagged: string[] = [];
  for (const [name, value] of Object.entries(fields)) {
    if (value !== undefined && containsUnsafeMarkup(value)) {
      flagged.push(name);
    }
  }
  return flagged;
}

/**
 * Deterministic answer-leakage check: true if `altText` contains, as a
 * case-insensitive substring, any of the literal correct-answer strings.
 * Intentionally literal-substring only — no semantic/NLP matching, so the
 * result is always reproducible ("where detectable deterministically" per
 * the Mission 2 requirements).
 */
export function altTextLeaksAnswer(altText: string, answerTexts: readonly string[]): boolean {
  const lowerAlt = altText.toLowerCase();
  return answerTexts.some((answer) => {
    const trimmed = answer.trim();
    return trimmed.length >= 2 && lowerAlt.includes(trimmed.toLowerCase());
  });
}
