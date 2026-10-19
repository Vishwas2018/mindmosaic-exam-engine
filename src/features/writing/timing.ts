import { getEffectiveRemainingSeconds } from "@/features/exam-engine/state/deadline";

/**
 * Gentle time cues for a timed writing task. Pure functions of an explicit
 * remaining-seconds value, like state/deadline.ts, so they are unit-tested
 * without a clock.
 *
 * Calm on purpose: a single polite notice at each threshold, no flashing, no
 * alarm, no colour-only signal (it is text in a live region).
 */
export const WRITING_WARNING_SECONDS = [300, 60] as const;

export type WritingWarning = (typeof WRITING_WARNING_SECONDS)[number];

/** The most urgent warning that currently applies, or null. */
export function activeWritingWarning(remainingSeconds: number | null): WritingWarning | null {
  if (remainingSeconds === null || remainingSeconds <= 0) return null;
  if (remainingSeconds <= 60) return 60;
  if (remainingSeconds <= 300) return 300;
  return null;
}

export function writingWarningMessage(warning: WritingWarning): string {
  return warning === 60 ? "About one minute left. Finish your last sentence." : "About five minutes left.";
}

/** m:ss for a countdown. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Remaining seconds for a deadline, corrected for the gap between this
 * device's clock and the server's. `skewMs` is `serverNow - clientNow`
 * measured when the attempt was fetched, so a child's wrong device clock can
 * neither give them extra time nor cost them any.
 */
export function remainingWithSkew(deadlineAtMs: number | null, clientNowMs: number, skewMs: number): number | null {
  return getEffectiveRemainingSeconds(deadlineAtMs, clientNowMs + skewMs);
}
