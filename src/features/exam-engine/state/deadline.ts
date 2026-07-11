import type { SubmissionReason } from "@/features/exam-engine/scoring";

/**
 * Authoritative deadline arithmetic for timed exams. These are pure
 * functions of an explicit `now` timestamp so callers can inject the clock
 * in tests instead of depending on ambient `Date.now()` calls scattered
 * through the store; production code always passes the real clock.
 *
 * Boundary convention: a deadline is exclusive of the instant it names. An
 * action taken at `now < deadlineAt` succeeds; an action taken at
 * `now >= deadlineAt` (including exactly on the deadline) is treated as
 * expired. This keeps "one millisecond before" and "exactly at" behaviour
 * unambiguous and matches how `remainingSeconds` reaches exactly zero.
 */

/** Wall-clock time source. Production always uses the real clock. */
export type Clock = () => number;

export const systemClock: Clock = () => Date.now();

export function hasDeadlineExpired(
  deadlineAt: number | null,
  now: number,
): boolean {
  if (deadlineAt === null) return false;
  return now >= deadlineAt;
}

/** Remaining whole seconds until the deadline; null for untimed exams. */
export function getEffectiveRemainingSeconds(
  deadlineAt: number | null,
  now: number,
): number | null {
  if (deadlineAt === null) return null;
  return Math.max(0, Math.ceil((deadlineAt - now) / 1000));
}

/**
 * A caller-supplied submission reason is only advisory: once the deadline
 * has passed, the submission is authoritatively a timer expiry regardless
 * of what the client claims (a late `user_submitted` request included).
 */
export function getEffectiveSubmissionReason(
  requestedReason: SubmissionReason,
  deadlineAt: number | null,
  now: number,
): SubmissionReason {
  return hasDeadlineExpired(deadlineAt, now) ? "timer_expired" : requestedReason;
}

/**
 * The timestamp a submission is recorded at. A submission arriving after
 * the deadline (for example a delayed client tick) is clamped to the
 * deadline itself, so recorded time-taken can never exceed the configured
 * duration.
 */
export function getEffectiveSubmittedAt(
  now: number,
  deadlineAt: number | null,
): number {
  if (deadlineAt !== null && now > deadlineAt) return deadlineAt;
  return now;
}
