import type { CandidateAnswer } from "./response";

/** A blank or whitespace-only string carries no information. */
export function isBlankString(value: string): boolean {
  return value.trim().length === 0;
}

/**
 * True when every value in a structured (record-shaped) response is blank,
 * or the record has no keys at all.
 *
 * This is what makes "answered" mean "has a value", not merely "has a
 * key": a fill-blank response left as `{ triangle: "" }` after being typed
 * into and then cleared is exactly as unanswered as `{}`. Every
 * record-shaped interaction — fill blanks, matching, dropdown, drag/drop
 * placements, label-diagram responses — shares this rule through
 * `isUnansweredResponse` rather than each re-deriving it.
 */
export function isBlankRecord(record: Readonly<Record<string, string>>): boolean {
  const values = Object.values(record);
  return values.length === 0 || values.every(isBlankString);
}

/**
 * Remove keys whose value is blank, so a field a learner typed into and
 * then cleared doesn't linger in the response as an empty-string entry.
 * Renderers that manage a select per field already produce this shape
 * naturally (an empty selection maps to "no entry"); this exists for
 * free-text-per-field interactions like fill-blank.
 */
export function normaliseRecordResponse(
  record: Readonly<Record<string, string>>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (!isBlankString(value)) result[key] = value;
  }
  return result;
}

/**
 * The single definition of "this response counts as unanswered", shared
 * by scoring, the answered-question count, and the question navigation
 * map — so a cleared field reads as unanswered consistently everywhere,
 * not just wherever happened to check `Object.keys(...).length`.
 */
export function isUnansweredResponse(answer: CandidateAnswer | undefined): boolean {
  if (answer === undefined || answer === null) return true;
  if (typeof answer === "string") return isBlankString(answer);
  if (Array.isArray(answer)) return answer.length === 0;
  if (typeof answer === "object") {
    /* TS does not narrow `readonly string[]` out of the union via
       Array.isArray the way it does a mutable T[]; the array case has
       already returned above, so this is always the record branch. */
    return isBlankRecord(answer as Readonly<Record<string, string>>);
  }
  return false;
}
