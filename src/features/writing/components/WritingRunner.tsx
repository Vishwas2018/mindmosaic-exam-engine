"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock, Printer } from "lucide-react";

import { buttonClasses } from "@/components/ui";
import { isAutosaveDue } from "@/features/exam-engine/state/autosave";
import { hasDeadlineExpired } from "@/features/exam-engine/state/deadline";
import { countWords } from "@/features/exam-engine/question-renderers/renderer-utils";

import type { WritingAttemptDto } from "../contracts";
import type { WritingTask } from "../task";
import {
  activeWritingWarning,
  formatClock,
  remainingWithSkew,
  writingWarningMessage,
  type WritingWarning,
} from "../timing";

/** Same debounce the exam engine uses for its own autosave. */
const AUTOSAVE_DEBOUNCE_MS = 2_000;
const TICK_MS = 500;

type Mode = "timed" | "untimed";
type SaveState = "idle" | "saving" | "saved" | "error";

interface Props {
  task: WritingTask;
  /** An attempt already open for this child and task (resume), or null to show the start choices. */
  initialAttempt: WritingAttemptDto | null;
  /** Where the "see my marks" link goes once the work is handed in. */
  resultsHref: string;
  printHref: string;
}

async function postJson(url: string, method: "POST" | "PATCH", body: unknown): Promise<Response> {
  return fetch(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    // keepalive lets the final submit survive a tab closing at the buzzer.
    keepalive: true,
  });
}

/**
 * The timed (and untimed) writing screen. The prompt and the timer appear in
 * the same moment, the instant an attempt starts: there is no planning screen.
 *
 * The clock is the server's. The deadline is an absolute instant fixed by the
 * database when the attempt started; this component only counts down to it,
 * corrected for any gap between the device clock and the server clock. When it
 * reaches zero the writing is submitted automatically with reason
 * `timer_expired`, and the server would record that reason anyway for any
 * late submit (src/features/exam-engine/state/deadline.ts).
 */
export function WritingRunner({ task, initialAttempt, resultsHref, printHref }: Props) {
  const [attempt, setAttempt] = useState<WritingAttemptDto | null>(initialAttempt);
  const [text, setText] = useState(initialAttempt?.responseText ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [confirmingHandIn, setConfirmingHandIn] = useState(false);
  /* `now` and the server/device gap, read together so they agree. serverNow is frozen in the
     attempt, so the first paint (server and hydration alike) shows deadline - serverNow. */
  const [clock, setClock] = useState(() => {
    const now = Date.now();
    return { now, skewMs: initialAttempt ? initialAttempt.serverNow - now : 0 };
  });
  const [announcement, setAnnouncement] = useState("");

  const textRef = useRef(text);
  const lastChangeAt = useRef<number | null>(null);
  const lastFlushedAt = useRef<number | null>(null);
  const submitting = useRef(false);
  const announced = useRef<Set<WritingWarning>>(new Set());

  const submitted = attempt?.submittedAt != null;
  const deadlineAt = attempt?.deadlineAt ?? null;
  const { skewMs } = clock;
  const remaining = remainingWithSkew(deadlineAt, clock.now, skewMs);
  const warning = submitted ? null : activeWritingWarning(remaining);

  const begin = useCallback(
    async (mode: Mode) => {
      setStarting(true);
      setError(null);
      try {
        const response = await postJson("/api/writing/attempts", "POST", { taskId: task.id, mode });
        if (!response.ok) throw new Error("start_failed");
        const { attempt: started } = (await response.json()) as { attempt: WritingAttemptDto };
        const now = Date.now();
        setClock({ now, skewMs: started.serverNow - now });
        setText(started.responseText);
        textRef.current = started.responseText;
        setAttempt(started);
      } catch {
        setError("We couldn't start this task. Check your connection and try again.");
      } finally {
        setStarting(false);
      }
    },
    [task.id],
  );

  const submit = useCallback(
    async (reason: "user_submitted" | "timer_expired") => {
      if (!attempt || submitting.current) return;
      submitting.current = true;
      setConfirmingHandIn(false);
      try {
        const response = await postJson(`/api/writing/attempts/${attempt.id}/submit`, "POST", {
          text: textRef.current,
          reason,
        });
        if (!response.ok) throw new Error("submit_failed");
        const { attempt: done } = (await response.json()) as { attempt: WritingAttemptDto };
        setAttempt(done);
        setSaveState("saved");
      } catch {
        // Let the next tick try again: the work must not be lost to a dropped request.
        submitting.current = false;
        setError("Your writing is safe on this page. We're trying to hand it in again.");
      }
    },
    [attempt],
  );

  // One loop drives the countdown, the autosave and the automatic hand-in.
  useEffect(() => {
    if (!attempt || submitted) return;
    const timer = setInterval(() => {
      const tickNow = Date.now();
      setClock((current) => ({ ...current, now: tickNow }));

      if (hasDeadlineExpired(deadlineAt, tickNow + skewMs)) {
        void submit("timer_expired");
        return;
      }

      if (isAutosaveDue(lastChangeAt.current, lastFlushedAt.current, tickNow, AUTOSAVE_DEBOUNCE_MS)) {
        lastFlushedAt.current = tickNow;
        setSaveState("saving");
        void postJson(`/api/writing/attempts/${attempt.id}`, "PATCH", { text: textRef.current })
          .then((response) => {
            if (!response.ok && response.status !== 409) throw new Error("save_failed");
            setSaveState("saved");
          })
          .catch(() => {
            // Retry on the next tick: leave the change unflushed.
            lastFlushedAt.current = null;
            setSaveState("error");
          });
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [attempt, submitted, deadlineAt, skewMs, submit]);

  // Announce each warning once, politely, in text (never colour alone).
  useEffect(() => {
    if (warning !== null && !announced.current.has(warning)) {
      announced.current.add(warning);
      setAnnouncement(writingWarningMessage(warning));
    }
  }, [warning]);

  const words = useMemo(() => countWords(text), [text]);

  if (!attempt) {
    return (
      <section aria-labelledby="writing-start-heading" className="space-y-6">
        <div>
          <h1 id="writing-start-heading" className="text-2xl font-extrabold tracking-[-0.025em] text-ink">
            {task.title}
          </h1>
          <p className="mt-2 text-muted">
            You have {task.timeLimitMinutes} minutes to write. The task and the timer start together, so get comfortable
            first.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={printHref}
            className="flex flex-col gap-1 rounded-2xl border-2 border-royal bg-royal/5 p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <span className="flex items-center gap-2 font-extrabold text-ink">
              <Printer aria-hidden="true" className="h-4 w-4" /> Timed, on paper
            </span>
            <span className="text-sm text-muted">
              Recommended for a real simulation. Print the task and a ruled sheet. A parent adds the writing afterwards.
            </span>
          </Link>
          <button
            type="button"
            disabled={starting}
            onClick={() => begin("timed")}
            className="flex flex-col gap-1 rounded-2xl border border-royal/15 bg-white p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 disabled:opacity-60"
          >
            <span className="flex items-center gap-2 font-extrabold text-ink">
              <Clock aria-hidden="true" className="h-4 w-4" /> Timed, on screen
            </span>
            <span className="text-sm text-muted">The {task.timeLimitMinutes} minutes start the moment you press this.</span>
          </button>
          <button
            type="button"
            disabled={starting}
            onClick={() => begin("untimed")}
            className="flex flex-col gap-1 rounded-2xl border border-royal/15 bg-white p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 disabled:opacity-60"
          >
            <span className="font-extrabold text-ink">Untimed practice, on screen</span>
            <span className="text-sm text-muted">Take as long as you need. No clock.</span>
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  const timed = deadlineAt !== null;

  return (
    <section aria-labelledby="writing-task-heading" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 id="writing-task-heading" className="text-xl font-extrabold tracking-[-0.025em] text-ink">
          {task.title}
        </h1>
        {timed && !submitted && remaining !== null ? (
          <p
            data-testid="writing-countdown"
            className="inline-flex items-center gap-2 rounded-xl border border-royal/15 bg-white px-3 py-1.5 text-lg font-extrabold tabular-nums text-ink"
          >
            <Clock aria-hidden="true" className="h-4 w-4" />
            <span aria-hidden="true">{formatClock(remaining)}</span>
            <span className="sr-only">{Math.ceil(remaining / 60)} minutes remaining</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-royal/10 bg-white p-5">
        <p className="whitespace-pre-line text-lg leading-8 text-ink" data-testid="writing-prompt">
          {task.prompt}
        </p>
        {task.suggestedWords ? (
          <p className="mt-3 text-sm text-muted">
            A guide: about {task.suggestedWords.min} to {task.suggestedWords.max} words. Quality matters more than length.
          </p>
        ) : null}
      </div>

      {warning !== null ? (
        <p data-testid="writing-warning" className="rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900">
          {writingWarningMessage(warning)}
        </p>
      ) : null}
      <p className="sr-only" aria-live="polite" role="status">
        {announcement}
      </p>

      <div>
        <label htmlFor="writing-response" className="sr-only">
          Your writing
        </label>
        <textarea
          id="writing-response"
          value={text}
          rows={16}
          disabled={submitted}
          /* A paper test has no spell-check or autocomplete, and spelling is marked. */
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          autoComplete="off"
          data-testid="writing-response"
          onChange={(event) => {
            const value = event.currentTarget.value;
            setText(value);
            textRef.current = value;
            lastChangeAt.current = Date.now();
            setSaveState("idle");
          }}
          className="w-full rounded-2xl border border-royal/20 bg-white px-4 py-3 text-base leading-7 text-ink outline-none focus-visible:border-royal focus-visible:ring-4 focus-visible:ring-royal/20 disabled:cursor-not-allowed disabled:bg-page"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span aria-live="polite">
            {words} {words === 1 ? "word" : "words"}
          </span>
          <span data-testid="writing-save-state">
            {submitted
              ? ""
              : saveState === "saving"
                ? "Saving…"
                : saveState === "saved"
                  ? "Saved"
                  : saveState === "error"
                    ? "Couldn't save yet. Trying again."
                    : ""}
          </span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      {submitted ? (
        <div
          data-testid="writing-submitted"
          className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-2 font-extrabold text-emerald-900">
            <CheckCircle2 aria-hidden="true" className="h-5 w-5" />
            {attempt.submissionReason === "timer_expired"
              ? "Time's up. Your writing has been saved and handed in."
              : "Handed in. Well done for finishing."}
          </p>
          <Link href={resultsHref} className={buttonClasses({ variant: "secondary" })}>
            See my writing and marks
          </Link>
        </div>
      ) : confirmingHandIn ? (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-page p-4">
          <p className="font-semibold text-ink">Hand in now? You won&apos;t be able to change it.</p>
          <button type="button" className={buttonClasses({ variant: "primary" })} onClick={() => submit("user_submitted")}>
            Yes, hand in
          </button>
          <button type="button" className={buttonClasses({ variant: "secondary" })} onClick={() => setConfirmingHandIn(false)}>
            Keep writing
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="writing-hand-in"
          className={buttonClasses({ variant: "primary" })}
          onClick={() => setConfirmingHandIn(true)}
        >
          Hand in
        </button>
      )}
    </section>
  );
}
