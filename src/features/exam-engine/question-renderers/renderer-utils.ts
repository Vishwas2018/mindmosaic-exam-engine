/** Convert an arbitrary identifier into a DOM-safe id fragment. */
export function toDomId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "-");
}

/**
 * Decorative position badges for option-style renderers (multiple choice,
 * multiple select) — matches 07-exam-engine.html / 08-practice.html's `.ol`
 * option-letter treatment. Purely visual: the accessible label/selection
 * state still comes from the underlying radio/checkbox input, never from
 * this badge (it is `aria-hidden`).
 */
export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

/** Tailwind classes for one option-letter badge, swapping fill when its option is selected. */
export function optionLetterClasses(selected: boolean): string {
  return [
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
    selected ? "bg-royal text-white" : "bg-page text-muted",
  ].join(" ");
}

/** Count words in a free-text response. */
export function countWords(value: string): number {
  const trimmed = value.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}
