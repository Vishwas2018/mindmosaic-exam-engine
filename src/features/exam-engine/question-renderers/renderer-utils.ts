/** Convert an arbitrary identifier into a DOM-safe id fragment. */
export function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/** Count words in a free-text response. */
export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
