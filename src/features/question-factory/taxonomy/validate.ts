import type { TaxonomyEntry } from "./types";

export type TaxonomyValidationIssueCode =
  | "empty_id"
  | "duplicate_id"
  | "empty_alias"
  | "alias_collision"
  | "unknown_prerequisite"
  | "self_prerequisite";

export interface TaxonomyValidationIssue {
  readonly code: TaxonomyValidationIssueCode;
  readonly message: string;
  readonly entryId?: string;
}

export interface TaxonomyValidationResult {
  readonly valid: boolean;
  readonly issues: readonly TaxonomyValidationIssue[];
}

/**
 * Pure structural validation of a taxonomy entry set: no duplicate ids, no
 * alias claimed by more than one entry, no dangling prerequisite reference.
 * Does not touch the production question bank — see
 * `resolvesEveryProductionSkill` for that cross-check.
 */
export function validateTaxonomyEntries(
  entries: readonly TaxonomyEntry[],
): TaxonomyValidationResult {
  const issues: TaxonomyValidationIssue[] = [];
  const idsSeen = new Set<string>();
  const aliasOwner = new Map<string, string>();

  for (const entry of entries) {
    if (entry.id.trim().length === 0) {
      issues.push({ code: "empty_id", message: "Taxonomy entry id must not be empty." });
      continue;
    }

    if (idsSeen.has(entry.id)) {
      issues.push({
        code: "duplicate_id",
        message: `Duplicate taxonomy id '${entry.id}'.`,
        entryId: entry.id,
      });
    }
    idsSeen.add(entry.id);

    for (const alias of entry.aliases) {
      if (alias.trim().length === 0) {
        issues.push({
          code: "empty_alias",
          message: `Taxonomy entry '${entry.id}' has an empty alias.`,
          entryId: entry.id,
        });
        continue;
      }

      const owner = aliasOwner.get(alias);
      if (owner && owner !== entry.id) {
        issues.push({
          code: "alias_collision",
          message: `Alias '${alias}' is claimed by both '${owner}' and '${entry.id}'.`,
          entryId: entry.id,
        });
        continue;
      }
      aliasOwner.set(alias, entry.id);
    }
  }

  for (const entry of entries) {
    for (const prerequisiteId of entry.prerequisites) {
      if (prerequisiteId === entry.id) {
        issues.push({
          code: "self_prerequisite",
          message: `Taxonomy entry '${entry.id}' lists itself as a prerequisite.`,
          entryId: entry.id,
        });
        continue;
      }
      if (!idsSeen.has(prerequisiteId)) {
        issues.push({
          code: "unknown_prerequisite",
          message: `Taxonomy entry '${entry.id}' references unknown prerequisite '${prerequisiteId}'.`,
          entryId: entry.id,
        });
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

/**
 * Cross-checks that every distinct `metadata.skill` string in the supplied
 * question rows resolves through an explicit taxonomy id or alias.
 */
export function resolvesEverySkillLabel(
  entries: readonly TaxonomyEntry[],
  skillLabels: readonly string[],
): { readonly resolved: boolean; readonly unresolved: readonly string[] } {
  const known = new Set<string>();
  for (const entry of entries) {
    known.add(entry.id);
    for (const alias of entry.aliases) known.add(alias);
  }

  const unresolved = Array.from(new Set(skillLabels)).filter((label) => !known.has(label));
  return { resolved: unresolved.length === 0, unresolved };
}
