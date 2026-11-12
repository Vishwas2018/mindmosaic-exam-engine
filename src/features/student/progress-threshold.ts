/**
 * When a finding about a student's results may be shown (decision D6).
 *
 * A finding about a subject or strand needs at least this many finished
 * attempts AND this many marks available behind it. Below that the screen says
 * there is not enough yet; it never shows a figure that rests on one short
 * paper. The SAME numbers are used on the student screens (My Space, My
 * Progress) and on the parent screens, so import them from here rather than
 * restating them.
 */
export const MIN_ATTEMPTS_FOR_FINDING = 2;
export const MIN_MARKS_FOR_FINDING = 8;

export function meetsFindingThreshold(attempts: number, marksAvailable: number): boolean {
  return attempts >= MIN_ATTEMPTS_FOR_FINDING && marksAvailable >= MIN_MARKS_FOR_FINDING;
}
