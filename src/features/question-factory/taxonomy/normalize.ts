/**
 * The single canonical normalisation function for taxonomy ids and aliases.
 * Every consumer that compares, registers, or looks up a skill label —
 * alias registration, collision detection, `skillTaxonomyRegistry.resolve`,
 * trusted-bank skill resolution, and this module's own tests — must go
 * through this function so "the same skill, written slightly differently"
 * always normalises to one comparison key.
 *
 * Deliberately narrow: only orthographic/whitespace/Unicode-form variation
 * is folded away. This is never a fuzzy or semantic matcher — two labels
 * that read differently to a person (different words, different meaning)
 * always normalise to different strings. Spelling equivalences (e.g.
 * British/Australian vs American spelling) are never inferred here; if two
 * spellings must resolve to the same entry, declare both as explicit
 * `aliases` on that entry in `entries.ts` and let this function normalise
 * each independently.
 */

// Curly/smart quotes, prime, modifier-letter apostrophe, acute/grave accent
// used as an apostrophe substitute — all fold to a single straight `'`.
const APOSTROPHE_VARIANTS = /[‘’ʼ′´`]/g;

// Hyphen-minus lookalikes (non-breaking hyphen, figure dash, en dash, em
// dash, horizontal bar, minus sign) all fold to the plain ASCII hyphen.
const DASH_VARIANTS = /[‐‑‒–—―−]/g;

// Cosmetic terminal punctuation on a prose display-name/alias (a trailing
// full stop, comma, semicolon or colon) never distinguishes one skill from
// another — strip it once, after whitespace has already been collapsed.
const TRAILING_PUNCTUATION = /[.,;:]+$/;

export function normalizeTaxonomyLabel(label: string): string {
  return label
    // Apostrophe/dash substitution runs before NFKC: NFKC's compatibility
    // decomposition turns some of these (e.g. U+00B4 ACUTE ACCENT) into a
    // bare combining mark plus a space, which would no longer match a
    // single-character class afterwards.
    .replace(APOSTROPHE_VARIANTS, "'")
    .replace(DASH_VARIANTS, "-")
    .normalize("NFKC")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(TRAILING_PUNCTUATION, "")
    .trim();
}
