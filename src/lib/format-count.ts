/**
 * Singular/plural helpers for user-facing counts (MT-007: "1 questions").
 * Pass the real count; only exactly 1 is singular ("0 questions", "2 questions").
 */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return count === 1 ? singular : pluralForm;
}

/** "1 question", "0 questions", "12 questions". */
export function countLabel(count: number, singular: string, pluralForm?: string): string {
  return `${count} ${plural(count, singular, pluralForm)}`;
}
