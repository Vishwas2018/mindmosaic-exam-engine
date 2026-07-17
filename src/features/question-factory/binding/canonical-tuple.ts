import { createHash } from "node:crypto";

import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

/**
 * The canonical binding tuple: the exact classification fields structural
 * validation attests for a candidate, and therefore the only authoritative
 * basis for mapping a candidate to a bound blueprint. One real blueprint is
 * authored per distinct tuple — never per candidate, never per batch.
 */
export interface CanonicalBindingTuple {
  readonly skill: string;
  readonly yearLevel: YearLevel;
  readonly examStyle: ExamStyle;
  readonly subject: string;
  readonly strand: string;
  readonly difficulty: string;
  readonly questionType: string;
}

/**
 * Stable, injective, human-readable serialisation of a tuple. Field order
 * is fixed and every value is included verbatim (no normalisation beyond
 * what the candidate already declares), so two tuples serialise identically
 * exactly when every field is identical. The `|` separator cannot occur in
 * any field: skills/types/styles are constrained identifiers and
 * subject/difficulty are closed enums; `strand` is free text, so a `|` in a
 * strand is rejected rather than escaped — escaping would create a second,
 * subtly different canonical form.
 */
export function serialiseCanonicalTuple(tuple: CanonicalBindingTuple): string {
  const fields = [
    tuple.skill,
    String(tuple.yearLevel),
    tuple.examStyle,
    tuple.subject,
    tuple.strand,
    tuple.difficulty,
    tuple.questionType,
  ];
  for (const field of fields) {
    if (field.includes("|")) {
      throw new Error(`Canonical tuple field '${field}' contains the reserved '|' separator.`);
    }
  }
  return fields.join("|");
}

function slugSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Deterministic bound-blueprint id for a tuple:
 * `pb2-bind-bp-<skill-slug>-y<year>-<style-slug>-<difficulty>-<type-slug>-<hash10>`.
 * The readable segments make audit review practical; the 10-hex-digit
 * SHA-256 suffix over the *full* canonical serialisation makes the id a
 * pure function of the whole tuple (including subject and strand, which the
 * readable segments omit for length), so two distinct tuples colliding on
 * every readable segment still mint different ids. Deliberately no
 * randomness and no counter — re-running generation always mints the same
 * id for the same tuple. Callers must still assert injectivity across a
 * generated set (`detectBlueprintIdCollisions`) and abort on collision
 * rather than disambiguate silently.
 */
export function mintBindingBlueprintId(tuple: CanonicalBindingTuple): string {
  const canonical = serialiseCanonicalTuple(tuple);
  const digest = createHash("sha256").update(canonical, "utf8").digest("hex").slice(0, 10);
  const readable = [
    slugSegment(tuple.skill),
    `y${tuple.yearLevel}`,
    slugSegment(tuple.examStyle).replace(/-style$/, ""),
    slugSegment(tuple.difficulty),
    slugSegment(tuple.questionType),
  ]
    .filter((segment) => segment.length > 0)
    .join("-");
  // factoryIdentifierSchema caps identifiers at 120 chars; keep headroom.
  const prefix = `pb2-bind-bp-${readable}`.slice(0, 100).replace(/-+$/, "");
  return `${prefix}-${digest}`;
}

/**
 * Returns every blueprint id minted by more than one distinct canonical
 * tuple. An empty result is a precondition for using a generated set —
 * callers abort on any entry, never pick a winner.
 */
export function detectBlueprintIdCollisions(
  tuples: readonly CanonicalBindingTuple[],
): readonly { readonly blueprintId: string; readonly canonicalTuples: readonly string[] }[] {
  const byId = new Map<string, Set<string>>();
  for (const tuple of tuples) {
    const id = mintBindingBlueprintId(tuple);
    const canonical = serialiseCanonicalTuple(tuple);
    const existing = byId.get(id) ?? new Set<string>();
    existing.add(canonical);
    byId.set(id, existing);
  }
  const collisions: { blueprintId: string; canonicalTuples: string[] }[] = [];
  for (const [blueprintId, canonicals] of byId) {
    if (canonicals.size > 1) collisions.push({ blueprintId, canonicalTuples: [...canonicals].sort() });
  }
  return collisions;
}
