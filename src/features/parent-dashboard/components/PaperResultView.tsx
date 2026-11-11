"use client";

import { useId } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { MarksMeter } from "./MarksMeter";
import { type PreviewPaperResult } from "../fixtures";

export interface PaperResultViewProps {
  result: PreviewPaperResult;
  child: {
    id: string;
    displayName: string;
    yearLevel?: number | null;
  };
  isLocalPreview?: boolean;
}

/**
 * PaperResultView (Parent Journey 4 - Artboard #31):
 *
 * Core honesty rules:
 * 1. Marked marks vs Still to be marked: Strictly kept separate and NEVER added together into an interim percentage score!
 * 2. Written answers banner: Clearly notifies that scores only ever go up when human marking finishes.
 * 3. Strand attribution: Displays marks per strand for this sitting, with explicit explanation that single-paper strands cannot make evaluative claims.
 * 4. CTA to Worked Answer Review: Direct navigation to /parent/results/[id]/review.
 */
export function PaperResultView({
  result,
  child,
  isLocalPreview = false,
}: PaperResultViewProps) {
  const thisPaperHeadingId = useId();
  const whereMarksCameFromId = useId();

  const isAwaiting =
    result.status === "awaiting_person" || (result.pendingQuestions ?? 0) > 0;
  const pendingQuestionsCount = result.pendingQuestions ?? (isAwaiting ? 2 : 0);
  const pendingMarksCount = result.pendingMarks ?? (isAwaiting ? 4 : 0);

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Link href="/parent" className="hover:text-royal transition">
              Family Overview
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/parent/children/${child.id}/progress`}
              className="hover:text-royal transition"
            >
              {child.displayName}’s progress
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-bold">This paper</span>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-wider text-royal">
            {child.displayName}’s progress
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {result.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            Finished {result.date} · Year {child.yearLevel ?? 3} ·{" "}
            {result.timed ? "timed" : "untimed"}
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Info Banner when written answers await marking */}
      {isAwaiting && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/5 p-4 text-xs sm:text-sm text-ink"
        >
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" aria-hidden="true" />
          <div>
            <p className="font-extrabold text-sky-950">
              {pendingQuestionsCount} written {pendingQuestionsCount === 1 ? "answer is" : "answers are"} still with a person.
            </p>
            <p className="mt-0.5 text-muted">
              The marks below are the ones that could be marked automatically. They will go up, never down, when the written answers are marked.
            </p>
          </div>
        </div>
      )}

      {/* 2-Column Grid: This paper summary & Where the marks came from */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        {/* Card 1: This paper */}
        <section
          aria-labelledby={thisPaperHeadingId}
          className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
        >
          <h2 id={thisPaperHeadingId} className="text-lg font-black text-ink">
            This paper
          </h2>

          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-royal/10 bg-royal/5 p-4">
              <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Marked so far
              </dt>
              <dd className="mt-1 font-display text-2xl font-black text-ink tabular-nums">
                {result.marksEarned} of {result.marksAvailable} marks
              </dd>
            </div>

            <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
              <dt className="text-xs font-extrabold uppercase tracking-wider text-amber-900/80">
                Still to be marked
              </dt>
              <dd className="mt-1 font-display text-2xl font-black text-amber-950 tabular-nums">
                {isAwaiting
                  ? `${pendingQuestionsCount} questions · ${pendingMarksCount} marks`
                  : "None · all marked"}
              </dd>
            </div>

            <div className="rounded-xl border border-royal/10 bg-surface-container-low/40 p-4">
              <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Questions answered
              </dt>
              <dd className="mt-1 font-display text-2xl font-black text-ink tabular-nums">
                {result.questionsAnswered ?? 14} of {result.totalQuestions ?? 15}
              </dd>
            </div>

            <div className="rounded-xl border border-royal/10 bg-surface-container-low/40 p-4">
              <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
                Time taken
              </dt>
              <dd className="mt-1 font-display text-2xl font-black text-ink tabular-nums">
                {result.durationMinutes} minutes of {result.allowedMinutes}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs font-medium text-muted">
            Marked and pending are shown as separate figures and never added together into one score.
          </p>

          <div className="mt-6 pt-4 border-t border-royal/10">
            <Link
              href={`/parent/results/${result.id}/review`}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-royal px-5 text-sm font-extrabold text-white shadow-xs transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30 sm:w-auto"
            >
              Go through the answers <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Card 2: Where the marks came from */}
        <section
          aria-labelledby={whereMarksCameFromId}
          className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
        >
          <h2 id={whereMarksCameFromId} className="text-lg font-black text-ink">
            Where the marks came from
          </h2>
          <p className="mt-1 text-xs font-medium text-muted">
            Strand breakdown across the questions on this paper.
          </p>

          <div className="mt-6 space-y-5 divide-y divide-royal/10">
            {result.strands.map((strand, idx) => (
              <div key={strand.name} className={idx > 0 ? "pt-5" : ""}>
                <MarksMeter
                  label={strand.name}
                  earnedMarks={strand.marksEarned}
                  availableMarks={strand.marksAvailable}
                  papersCount={1}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl border border-royal/10 bg-royal/5 p-4 text-xs font-medium text-muted">
            <p className="font-bold text-ink">
              Not enough yet to say anything about either strand on this paper alone. It needs 2 finished papers and 8 marks.
            </p>
            <p className="mt-1">
              One paper is never enough on its own. The strand view on {child.displayName}’s progress adds papers together until there is enough to say something.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
