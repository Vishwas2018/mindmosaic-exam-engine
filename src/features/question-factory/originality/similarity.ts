/**
 * Pure, deterministic token 3-gram Jaccard similarity over normalised
 * comparable text. No I/O, no randomness, no locale dependency (NFKC
 * normalisation is locale-independent). Two independently versioned
 * axes — `ORIGINALITY_NORMALISATION_VERSION` (text canonicalisation) and
 * `ORIGINALITY_CHECKER_VERSION` (shingle size, Jaccard formula,
 * comparable-text field selection) — so either can be bumped without
 * forcing the other, per the Mission 3D plan §4a.
 */

/** Bump when normalisation (case-folding, character stripping, whitespace collapse) changes. */
export const ORIGINALITY_NORMALISATION_VERSION = "1" as const;

/** Bump when the shingle size, Jaccard formula, or comparable-text field selection changes. */
export const ORIGINALITY_CHECKER_VERSION = "1" as const;

const SHINGLE_SIZE = 3;

/**
 * Unicode NFKC-normalise -> lower-case -> strip every character that is
 * not `[a-z0-9\s]` -> collapse whitespace -> trim. Deterministic,
 * locale-independent, no external dependency.
 */
export function normaliseComparableText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenise(normalisedText: string): readonly string[] {
  if (normalisedText.length === 0) return [];
  return normalisedText.split(" ").filter((token) => token.length > 0);
}

/**
 * 3-token sliding-window shingles. If fewer than 3 tokens are available,
 * the single shingle is the whole available text (no 3-gram exists yet
 * there is still something to compare). An empty token list produces an
 * empty shingle set — the "cannot compute" case, never silently treated
 * as "0% similar to everything".
 */
export function buildShingles(tokens: readonly string[]): ReadonlySet<string> {
  if (tokens.length === 0) return new Set();
  if (tokens.length < SHINGLE_SIZE) return new Set([tokens.join(" ")]);
  const shingles = new Set<string>();
  for (let index = 0; index <= tokens.length - SHINGLE_SIZE; index += 1) {
    shingles.add(tokens.slice(index, index + SHINGLE_SIZE).join(" "));
  }
  return shingles;
}

export function jaccardSimilarity(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersectionSize = 0;
  for (const value of a) {
    if (b.has(value)) intersectionSize += 1;
  }
  const unionSize = a.size + b.size - intersectionSize;
  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

/**
 * For any question (candidate or corpus member): prompt + stimulus body +
 * joined option text, space-separated. Never includes `explanation`
 * (authoring reasoning, not assessable content) or any metadata.
 */
export function extractComparableText(question: {
  readonly prompt: string;
  readonly stimulus?: { readonly body: string } | undefined;
  readonly options: readonly { readonly text: string }[];
}): string {
  const parts = [question.prompt, question.stimulus?.body, ...question.options.map((option) => option.text)];
  return parts.filter((part): part is string => typeof part === "string" && part.length > 0).join(" ");
}

export function computeSimilarity(candidateComparableText: string, corpusComparableText: string): number {
  const candidateShingles = buildShingles(tokenise(normaliseComparableText(candidateComparableText)));
  const corpusShingles = buildShingles(tokenise(normaliseComparableText(corpusComparableText)));
  return jaccardSimilarity(candidateShingles, corpusShingles);
}
