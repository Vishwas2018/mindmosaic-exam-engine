/**
 * The single sanctioned way to canonicalise a donor-supplied identifier
 * (option id, blank id, matching source/target id, ordering item id,
 * dropdown field/option id, or any answer-key reference to one of those)
 * before comparing, storing, or collision-checking it. Order matters:
 * trim first (so a lone trailing/leading space never survives into the
 * comparison key), then Unicode NFKC-normalise (so compatibility variants —
 * full-width digits, ligatures, etc. — collapse to one canonical form),
 * then lower-case last (so case-folding happens after both of the above,
 * never before). Every id and every reference to it in the whole ingestion
 * pipeline must go through this exact function — a raw `.toLowerCase()`
 * anywhere else would silently disagree with a canonicalised definition
 * that had, say, a NFKC-normalisable character or incidental whitespace.
 */
export function canonicaliseId(id: string): string {
  return id.trim().normalize("NFKC").toLowerCase();
}

export type CanonicaliseIdsFailureReason = "empty_after_canonicalisation" | "collision_after_canonicalisation";

export type CanonicaliseIdsResult =
  | { readonly ok: true; readonly mapping: ReadonlyMap<string, string> }
  | { readonly ok: false; readonly reason: CanonicaliseIdsFailureReason; readonly original: string };

/**
 * Canonicalises a list of donor ids, failing closed (rather than silently
 * keeping only one) when canonicalisation produces an empty string or when
 * two originally-distinct ids collapse onto the same canonical value. The
 * returned mapping is keyed by the *original* donor id, so callers can look
 * up "what did this specific donor id become" without re-deriving it.
 */
export function canonicaliseIds(ids: readonly string[]): CanonicaliseIdsResult {
  const mapping = new Map<string, string>();
  const seen = new Set<string>();
  for (const id of ids) {
    const canonical = canonicaliseId(id);
    if (canonical.length === 0) {
      return { ok: false, reason: "empty_after_canonicalisation", original: id };
    }
    if (seen.has(canonical)) {
      return { ok: false, reason: "collision_after_canonicalisation", original: id };
    }
    seen.add(canonical);
    mapping.set(id, canonical);
  }
  return { ok: true, mapping };
}
