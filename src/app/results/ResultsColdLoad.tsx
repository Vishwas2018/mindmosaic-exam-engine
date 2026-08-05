"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Minus } from "lucide-react";

import { Badge, Card, ErrorState, buttonClasses } from "@/components/ui";
import { formatSubmittedAt, type AttemptSummary } from "@/features/student/attempt-summary";

import { fetchAttemptHistory } from "./history-fetch";

/**
 * What /results shows when the in-memory exam store is empty.
 *
 * The store only holds the attempt just submitted, so any refresh — or
 * following the Results nav item at any other moment — used to render "No
 * results to show yet" even for a student with five finished sessions on
 * their dashboard. The Results nav item was a dead end after every refresh.
 *
 * Guests keep exactly the old empty state: they have no server-side
 * attempts at all, by design, so there is nothing else to offer them.
 *
 * The post-submit flow is untouched. This component is only reached when
 * `status !== "submitted"`, so a live result still renders from the store
 * with its full question-by-question review.
 */

/*
 * Deliberately NOT a link per row. There is no per-attempt review route in
 * this codebase: the review screen renders `reviewQuestions`, which the
 * store populates at submit time from the bank plus answer keys, and a
 * stored attempt row holds marks and question ids but no prompts. Building
 * one means rehydrating a stored attempt through the exam-engine review
 * path, which is out of scope here and is called out in the report.
 *
 * So each row shows what the stored row genuinely knows — title, date,
 * score, and whether anything was actually answered — and the screen says
 * plainly where the full review is available. A link that went somewhere
 * unhelpful would be a worse dead end than none.
 */
function AttemptRow({ attempt }: { attempt: AttemptSummary }) {
  const blank = attempt.attemptedQuestions === 0;

  return (
    <li
      data-testid="attempt-history-row"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-royal/8 px-6 py-4 first:border-t-0"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-ink">{attempt.title}</p>
        <p className="mt-0.5 text-xs font-semibold text-muted">
          {formatSubmittedAt(attempt.submittedAt)}
          {attempt.totalQuestions !== null ? ` · ${attempt.totalQuestions} questions` : ""}
          {attempt.timing ? ` · ${attempt.timing === "timed" ? "Timed" : "Untimed"}` : ""}
          {attempt.pendingManualReview ? " · some marks pending" : ""}
        </p>
      </div>

      {blank ? (
        /* Not "0%" — see the dashboard fix. A paper submitted without an
           answer is not a score, and showing one here would reintroduce
           exactly the confusion that reported as broken aggregation. */
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted">
          <Minus aria-hidden="true" className="h-4 w-4" />
          No answers
        </span>
      ) : attempt.scorePercent === null ? (
        <span className="text-sm font-bold text-muted">Awaiting marking</span>
      ) : (
        <span className="text-lg font-black tabular-nums text-ink">{attempt.scorePercent}%</span>
      )}
    </li>
  );
}

export function ResultsColdLoad() {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "guest" } | { kind: "ready"; attempts: readonly AttemptSummary[] }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchAttemptHistory()
      .then((outcome) => {
        if (cancelled) return;
        setState(
          outcome.kind === "guest"
            ? { kind: "guest" }
            : { kind: "ready", attempts: outcome.attempts },
        );
      })
      .catch(() => {
        /* Fail soft to the guest view: it is the honest floor, and this
           screen is read-only. */
        if (!cancelled) setState({ kind: "guest" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="Looking for your results…"
          description="One moment while we check for finished sessions."
        />
      </main>
    );
  }

  /* Guests, and signed-in students with genuinely nothing finished, keep
     the original empty state unchanged. */
  if (state.kind === "guest" || state.attempts.length === 0) {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="No results to show yet"
          description="Finish an exam to see your results here."
          action={
            <Link href="/practice" className={buttonClasses({ variant: "secondary" })}>
              Set up an exam
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main id="main-content" className="site-width py-10 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-royal">
            Your history
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-ink sm:text-4xl">
            Finished sessions
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted">
            Every session you have submitted, newest first. The full
            question-by-question review is shown at the end of a sitting — open a session
            to see the explanations again.
          </p>
        </div>

        <Card variant="default" className="mt-8 overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-royal/8 px-6 py-4">
            <h2 className="text-sm font-extrabold text-ink">Sessions</h2>
            <Badge variant="purple">{state.attempts.length} finished</Badge>
          </div>
          <ol>
            {state.attempts.map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </ol>
        </Card>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/practice" className={buttonClasses({ variant: "primary", size: "lg" })}>
            Start another session
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
          <Link href="/student" className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
