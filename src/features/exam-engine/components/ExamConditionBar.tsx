"use client";

import { useEffect, useState } from "react";

import { useExamStore } from "@/features/exam-engine/state";

/**
 * The condition bar from design handoff screen 10, view 3 — the strip that
 * makes it unambiguous that a paper is being sat under exam conditions.
 *
 * Coral "Exam conditions" eyebrow, the paper's description, a mono
 * countdown, the autosave state and "Pause and exit".
 *
 * Two things it does not fake:
 *
 *  - **The countdown only renders on a timed sitting.** An untimed one has
 *    no deadline, and a bar reading `--:--` beside the words "exam
 *    conditions" is worse than no bar.
 *  - **Autosave reflects reality.** A guest session has nowhere to save to
 *    (docs/ASSESSMENT_SECURITY_MODEL.md), and it says so rather than
 *    showing a reassuring tick over a session a refresh will lose.
 */

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function autosaveLabel(
  sessionMode: "local" | "server",
  lastAutosavedAt: number | null,
  now: number,
): { title: string; detail: string; tone: "brand" | "muted" } {
  if (sessionMode === "local") {
    return {
      title: "Not saved",
      detail: "Guest session — closing this tab loses it",
      tone: "muted",
    };
  }
  if (lastAutosavedAt === null) {
    return { title: "Autosave", detail: "Saving shortly", tone: "muted" };
  }
  const seconds = Math.max(0, Math.round((now - lastAutosavedAt) / 1000));
  return {
    title: "Autosaved",
    detail:
      seconds < 10
        ? "a moment ago"
        : seconds < 60
          ? `${seconds}s ago`
          : `${Math.round(seconds / 60)} min ago`,
    tone: "brand",
  };
}

export function ExamConditionBar({
  description,
  onExit,
}: {
  description: string;
  onExit: () => void;
}) {
  const timing = useExamStore((state) => state.config?.timing ?? null);
  const remainingSeconds = useExamStore((state) => state.remainingSeconds);
  const sessionMode = useExamStore((state) => state.sessionMode);
  const lastAutosavedAt = useExamStore((state) => state.lastAutosavedAt);

  /* Ticks only to re-render the "a moment ago" wording; the countdown
     itself is driven by the store. Started in an effect so the server and
     the first client render agree. */
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    /* Scheduled rather than set synchronously: reading the clock during
       the effect body would set state in the same commit and cascade a
       render. A 0ms timeout puts the first read on the next tick, which
       is also the earliest point the server/client mismatch is resolved. */
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const save = autosaveLabel(sessionMode, lastAutosavedAt, now ?? 0);
  const timed = timing === "timed";

  return (
    <div className="flex flex-wrap items-center gap-[clamp(14px,2vw,28px)] rounded-2xl border border-mm-tint-line-strong bg-white p-4 px-[clamp(18px,2vw,24px)]">
      <div className="grid gap-[3px]">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-coral-text">
          {timed ? "Exam conditions · in progress" : "Untimed sitting · in progress"}
        </p>
        <p className="text-[15.5px] font-bold text-mm-ink">{description}</p>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-[clamp(14px,2vw,26px)]">
        {timed && remainingSeconds !== null && (
          <div className="grid gap-0.5 text-right">
            <span className="text-[11.5px] uppercase tracking-[0.08em] text-mm-muted">
              Time remaining
            </span>
            {/* aria-hidden: <ExamTimer> already owns the accessible,
                politely-announced countdown; this is the visual one and a
                second live region would double every announcement. */}
            <span
              aria-hidden="true"
              className="font-mono text-[26px] font-bold tracking-[-0.02em] tabular-nums text-mm-ink"
            >
              {formatClock(remainingSeconds)}
            </span>
          </div>
        )}

        <div className="grid gap-0.5 text-right">
          <span className="text-[11.5px] uppercase tracking-[0.08em] text-mm-muted">
            {save.title}
          </span>
          <span
            className={
              save.tone === "brand"
                ? "text-sm font-semibold text-mm-brand"
                : "text-sm font-semibold text-mm-muted"
            }
          >
            {/* Rendered only once the client clock is running, so the
                server HTML and the first hydration pass cannot disagree. */}
            {now === null ? "—" : save.detail}
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          data-testid="exit-exam"
          className="inline-flex min-h-11 items-center rounded-[10px] border border-mm-line bg-white px-[18px] text-sm font-bold text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
        >
          Pause and exit
        </button>
      </div>
    </div>
  );
}
