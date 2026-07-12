import { normalizeTaxonomyLabel } from "./normalize";
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
 * Pure structural validation of a taxonomy entry set: no duplicate ids
 * (compared through `normalizeTaxonomyLabel`, so ids that differ only by
 * case/whitespace/Unicode form still collide), no alias claimed by more
 * than one entry (same normalised comparison, and checked against every
 * other entry's id too — an alias must never normalise to the same string
 * as a *different* entry's id), no dangling prerequisite reference. Does
 * not touch the production question bank — see `resolvesEverySkillLabel`
 * for that cross-check.
 */
export function validateTaxonomyEntries(
  entries: readonly TaxonomyEntry[],
): TaxonomyValidationResult {
  const issues: TaxonomyValidationIssue[] = [];
  const idsSeen = new Set<string>();
  // One shared normalised-key space for ids and aliases: whichever entry
  // registers a given normalised string first owns it, and any other
  // entry (id or alias) that normalises to the same string collides.
  const normalizedOwner = new Map<string, string>();

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

    const normalizedId = normalizeTaxonomyLabel(entry.id);
    const idOwner = normalizedOwner.get(normalizedId);
    if (idOwner && idOwner !== entry.id) {
      issues.push({
        code: "duplicate_id",
        message: `Taxonomy id '${entry.id}' normalises the same as existing id/alias '${normalizedId}' already owned by '${idOwner}'.`,
        entryId: entry.id,
      });
    } else {
      normalizedOwner.set(normalizedId, entry.id);
    }

    for (const alias of entry.aliases) {
      if (alias.trim().length === 0) {
        issues.push({
          code: "empty_alias",
          message: `Taxonomy entry '${entry.id}' has an empty alias.`,
          entryId: entry.id,
        });
        continue;
      }

      const normalizedAlias = normalizeTaxonomyLabel(alias);
      const owner = normalizedOwner.get(normalizedAlias);
      if (owner && owner !== entry.id) {
        issues.push({
          code: "alias_collision",
          message: `Alias '${alias}' (normalised: '${normalizedAlias}') is claimed by both '${owner}' and '${entry.id}'.`,
          entryId: entry.id,
        });
        continue;
      }
      normalizedOwner.set(normalizedAlias, entry.id);
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
 * question rows resolves through an explicit taxonomy id or alias, using
 * the same `normalizeTaxonomyLabel` comparison as `skillTaxonomyRegistry`
 * so this check and the runtime resolver never disagree.
 */
export function resolvesEverySkillLabel(
  entries: readonly TaxonomyEntry[],
  skillLabels: readonly string[],
): { readonly resolved: boolean; readonly unresolved: readonly string[] } {
  const known = new Set<string>();
  for (const entry of entries) {
    known.add(normalizeTaxonomyLabel(entry.id));
    for (const alias of entry.aliases) known.add(normalizeTaxonomyLabel(alias));
  }

  const unresolved = Array.from(new Set(skillLabels)).filter(
    (label) => !known.has(normalizeTaxonomyLabel(label)),
  );
  return { resolved: unresolved.length === 0, unresolved };
}
