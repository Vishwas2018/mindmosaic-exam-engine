import { normalizeTaxonomyLabel } from "./normalize";
import { SKILL_TAXONOMY_ENTRIES } from "./entries";
import type { TaxonomyEntry } from "./types";
import { validateTaxonomyEntries } from "./validate";

const validation = validateTaxonomyEntries(SKILL_TAXONOMY_ENTRIES);
if (!validation.valid) {
  const detail = validation.issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Skill taxonomy registry failed validation:\n${detail}`);
}

// Keyed by `normalizeTaxonomyLabel(...)`, never the raw string, so lookups
// tolerate case/whitespace/Unicode-form variation exactly the same way
// `validateTaxonomyEntries` already checked for collisions. Validation
// above already guarantees each normalised key is owned by exactly one
// entry, so these maps cannot be ambiguous.
const byNormalizedId = new Map<string, TaxonomyEntry>();
const byNormalizedAlias = new Map<string, TaxonomyEntry>();

for (const entry of SKILL_TAXONOMY_ENTRIES) {
  byNormalizedId.set(normalizeTaxonomyLabel(entry.id), entry);
  for (const alias of entry.aliases) {
    byNormalizedAlias.set(normalizeTaxonomyLabel(alias), entry);
  }
}

/**
 * Resolves a taxonomy id or an explicit alias (production-bank skill text or
 * legacy `_HARVEST` label) to its taxonomy entry. Never falls back to
 * matching `displayName` — only `id` and `aliases` are resolvable, per the
 * "explicit ID or alias mapping" rule. Comparison is via
 * `normalizeTaxonomyLabel`, so orthographic variants of a known id/alias
 * resolve identically; a label that is semantically different from every
 * known id/alias always fails closed (`undefined`), never a fuzzy guess.
 */
function resolve(label: string): TaxonomyEntry | undefined {
  const normalized = normalizeTaxonomyLabel(label);
  return byNormalizedId.get(normalized) ?? byNormalizedAlias.get(normalized);
}

function resolveOrThrow(label: string): TaxonomyEntry {
  const entry = resolve(label);
  if (!entry) {
    throw new Error(`Unknown skill label '${label}': no taxonomy id or alias matches.`);
  }
  return entry;
}

function get(id: string): TaxonomyEntry | undefined {
  return byNormalizedId.get(normalizeTaxonomyLabel(id));
}

function list(): readonly TaxonomyEntry[] {
  return SKILL_TAXONOMY_ENTRIES;
}

export const skillTaxonomyRegistry = Object.freeze({
  resolve,
  resolveOrThrow,
  get,
  list,
  entries: SKILL_TAXONOMY_ENTRIES,
});
