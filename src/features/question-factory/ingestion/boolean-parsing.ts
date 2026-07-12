/**
 * The single sanctioned way to interpret a donor-supplied boolean answer
 * value, for both the harvest JSON `boolean` answer key and the CSV
 * `true_false` `correct` field. Never uses JavaScript truthiness
 * (`Boolean(value)`, `!!value`, `value ? true : false`) — those would
 * silently accept `"0"`, `"no"`, `1`, `{}`, `[]` and similar donor typos or
 * malformed values as truthy/falsy, which is exactly the kind of silent
 * data corruption a governed ingestion adapter must never perform.
 *
 * Only four donor representations are unambiguous: the JSON booleans
 * `true`/`false`, and the strings `"true"`/`"false"` (trimmed, compared
 * case-insensitively). Every other value — including numeric `0`/`1`,
 * `"yes"`/`"no"`, empty string, `null`, `undefined`, objects and arrays —
 * is rejected rather than guessed.
 */
export type StrictBooleanParseResult =
  | { readonly ok: true; readonly value: boolean }
  | { readonly ok: false };

export function parseStrictBoolean(input: unknown): StrictBooleanParseResult {
  if (typeof input === "boolean") {
    return { ok: true, value: input };
  }
  if (typeof input === "string") {
    const normalised = input.trim().toLowerCase();
    if (normalised === "true") return { ok: true, value: true };
    if (normalised === "false") return { ok: true, value: false };
  }
  return { ok: false };
}
