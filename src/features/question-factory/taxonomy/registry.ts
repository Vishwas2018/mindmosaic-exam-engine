import { SKILL_TAXONOMY_ENTRIES } from "./entries";
import type { TaxonomyEntry } from "./types";
import { validateTaxonomyEntries } from "./validate";

const validation = validateTaxonomyEntries(SKILL_TAXONOMY_ENTRIES);
if (!validation.valid) {
  const detail = validation.issues.map((issue) => `- ${issue.message}`).join("\n");
  throw new Error(`Skill taxonomy registry failed validation:\n${detail}`);
}

const byId = new Map<string, TaxonomyEntry>();
const byAlias = new Map<string, TaxonomyEntry>();

for (const entry of SKILL_TAXONOMY_ENTRIES) {
  byId.set(entry.id, entry);
  for (const alias of entry.aliases) {
    byAlias.set(alias, entry);
  }
}

/**
 * Resolves a taxonomy id or an explicit alias (production-bank skill text or
 * legacy `_HARVEST` label) to its taxonomy entry. Never falls back to
 * matching `displayName` — only `id` and `aliases` are resolvable, per the
 * "explicit ID or alias mapping" rule.
 */
function resolve(label: string): TaxonomyEntry | undefined {
  return byId.get(label) ?? byAlias.get(label);
}

function resolveOrThrow(label: string): TaxonomyEntry {
  const entry = resolve(label);
  if (!entry) {
    throw new Error(`Unknown skill label '${label}': no taxonomy id or alias matches.`);
  }
  return entry;
}

function get(id: string): TaxonomyEntry | undefined {
  return byId.get(id);
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
