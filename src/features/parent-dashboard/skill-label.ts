/**
 * A parent-readable name for a subject or skill key from a scored paper's breakdown.
 *
 * Breakdown keys are either already a phrase ("Adding money amounts") or a dotted taxonomy id
 * ("num.prod.measurement.perimeter"). An id is shown as "Measurement: perimeter" — never raw — by dropping the
 * subject and production prefixes and turning the rest into words.
 */
const PREFIXES = new Set(["num", "lit", "lang", "read", "sci", "prod", "core"]);

const words = (part: string) => part.replace(/[-_]+/g, " ").trim();
const capitalise = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export function skillLabel(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) return "Other";
  if (!/^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)+$/.test(trimmed)) return capitalise(words(trimmed));
  const parts = trimmed.split(".").filter((part, index) => !(index < 2 && PREFIXES.has(part.toLowerCase())));
  if (parts.length === 0) return "Other";
  if (parts.length === 1) return capitalise(words(parts[0]!));
  const area = parts[parts.length - 2]!;
  const topic = parts[parts.length - 1]!;
  return `${capitalise(words(area))}: ${words(topic)}`;
}
