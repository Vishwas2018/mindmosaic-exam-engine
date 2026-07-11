import { createHash } from "node:crypto";

/**
 * Normalises line endings to LF before hashing/fingerprinting, so a CRLF
 * checkout (Windows) and an LF checkout hash identically. Per Windows
 * determinism rules, this must run before every content hash.
 */
export function normaliseNewlines(content: string): string {
  return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/** Normalises path separators to forward slashes for cross-platform hashing. */
export function normalisePathSeparators(path: string): string {
  return path.replace(/\\/g, "/");
}

export function hashContent(content: string): string {
  return createHash("sha256").update(normaliseNewlines(content), "utf8").digest("hex");
}

/**
 * Recursively sorts object keys so that two objects with the same data
 * but different property insertion order stringify - and therefore hash -
 * identically.
 */
export function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value !== null && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortKeysDeep(source[key]);
    }
    return sorted;
  }
  return value;
}

export function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

/** Stable-key-order, newline-normalised JSON content hash. */
export function hashJson(value: unknown): string {
  return hashContent(stableStringify(value));
}
