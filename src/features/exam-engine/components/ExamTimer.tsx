"use client";

import { useEffect } from "react";
import { Clock3 } from "lucide-react";

import {
  TIMER_CRITICAL_SECONDS,
  TIMER_WARNING_SECONDS,
} from "@/features/exam-engine/selection";
import { useExamStore } from "@/features/exam-engine/state";

import { formatClock } from "./answer-format";

/**
 * Countdown for timed exams. Remaining time is always recomputed from the
 * session start time inside the store's tick action, so the timer can never
 * drift negative or fire a duplicate auto-submit. Untimed exams render a
 * static label and no countdown.
 */
export function ExamTimer() {
  const status = useExamStore((state) => state.status);
  const durationSeconds = useExamStore((state) => state.durationSeconds);
  const remainingSeconds = useExamStore((state) => state.remainingSeconds);
  const tick = useExamStore((state) => state.tick);

  const isTimed = durationSeconds !== null;
  const running = status === "in_progress" && isTimed;

  useEffect(() => {
    if (!running) return;
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [running, tick]);

  /*
   * Milestone announcements. The aria-live region only speaks when its text
   * content changes, so deriving a stable string per threshold announces each
   * milestone once rather than every second.
   */
  const announcement =
    running && remainingSeconds !== null
      ? remainingSeconds <= TIMER_CRITICAL_SECONDS && remainingSeconds > 0
        ? "Less than 30 seconds remaining."
        : remainingSeconds <= TIMER_WARNING_SECONDS
          ? "Less than two minutes remaining."
          : ""
      : "";

  if (!isTimed) {
    return (
      <div
        data-testid="exam-timer-untimed"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-page px-3.5 text-sm font-extrabold text-ink"
      >
        <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
        Untimed
      </div>
    );
  }

  const seconds = remainingSeconds ?? durationSeconds;
  const critical = seconds <= TIMER_CRITICAL_SECONDS;
  const warning = !critical && seconds <= TIMER_WARNING_SECONDS;

  return (
    <div
      data-testid="exam-timer"
      data-timer-state={critical ? "critical" : warning ? "warning" : "normal"}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-extrabold tabular-nums ${
        critical
          ? "bg-error/10 text-error"
          : warning
            ? "bg-warning/10 text-warning"
            : "bg-page text-ink"
      }`}
      aria-label={`Time remaining ${formatClock(seconds)}${
        critical ? ", almost out of time" : warning ? ", running low" : ""
      }`}
    >
      <Clock3
        aria-hidden="true"
        className={`h-4 w-4 ${critical ? "text-error" : warning ? "text-warning" : "text-royal"}`}
      />
      {formatClock(seconds)}
      {(warning || critical) && (
        <span className="text-xs font-bold uppercase tracking-wide">
          {critical ? "Hurry" : "Low"}
        </span>
      )}
      <span aria-live="polite" role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
