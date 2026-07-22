/**
 * The single whole-word prompt tokeniser shared by every derivation method
 * that needs to check whether a declared quantity/label is actually stated
 * in a question's prompt text (`derive-answer.ts`'s table/chart lookups,
 * `derive-multistep-answer.ts`'s prompt-quantity grounding check). Kept in
 * its own module (rather than only inside `derive-answer.ts`) so the
 * multi-step method can reuse it without an import cycle between the two
 * derivation modules.
 */

/**
 * Unicode-NFC-normalised before tokenising: the `[a-z0-9.']` token pattern
 * is ASCII-only and necessarily loses an accented letter either way, but
 * without NFC first a composed accented character (`"café"`, one code
 * point) and its decomposed form (`"cafe"` + a combining accent) lose it
 * *inconsistently* — the composed form drops the trailing letter entirely,
 * the decomposed form keeps the bare ASCII base letter — producing two
 * different tokens for what is visibly the same word. Normalising first
 * makes both inputs collapse to the identical code-point sequence before
 * tokenising, so they always produce the same (lossy but consistent)
 * token.
 */
export function promptTokens(prompt: string): readonly string[] {
  return prompt.normalize("NFC").toLocaleLowerCase("en-AU").match(/[a-z0-9.']+/g) ?? [];
}
