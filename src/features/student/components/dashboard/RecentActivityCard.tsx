import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import type { AttemptSummary } from "../../attempt-summary";
import { formatSubmittedAt } from "../../attempt-summary";
import { RadialProgressRing } from "./RadialProgressRing";

export function RecentActivityCard({ attempt }: { attempt: AttemptSummary | null }) {
  return (
    <section className="space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink tracking-tight">
          Recent activity
        </h2>
        <Link
          href="/student/engagement"
          className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          View My Progress
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>

      {attempt ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-mm-line bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
              <RadialProgressRing percent={attempt.scorePercent ?? 0} />
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-[family-name:var(--font-display)] text-xs font-bold text-primary">
                  {attempt.scorePercent !== null ? `${attempt.scorePercent}%` : "—"}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">
                  {attempt.title}
                </h3>
                <span className="rounded border border-mm-line bg-mm-tint-soft px-2 py-0.5 text-[10px] font-semibold text-mm-muted">
                  {attempt.timing === "timed" ? "Timed" : "Practice"}
                </span>
              </div>
              <p className="flex items-center gap-2 text-xs text-mm-muted">
                <span className="font-semibold text-mm-ink">
                  {attempt.scorePercent !== null
                    ? `${attempt.scorePercent}% scored`
                    : "Awaiting review"}{" "}
                  · {attempt.attemptedQuestions} of {attempt.totalQuestions ?? attempt.attemptedQuestions} answered
                </span>
                <span>·</span>
                <span>Completed {formatSubmittedAt(attempt.submittedAt)}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/student/engagement"
              className="flex min-h-11 items-center rounded-btn border border-mm-line bg-mm-tint-soft px-4 text-xs font-semibold text-primary transition-colors hover:bg-mm-tint"
            >
              Review answers
            </Link>
            {/*
              Placeholder — there is no per-attempt review route in this
              codebase (see the explicit scope note in
              app/results/ResultsColdLoad.tsx: building one means
              rehydrating a stored attempt through the exam-engine review
              path, called out there as its own follow-up). Pointing this at
              /student/engagement would just duplicate "Review answers"
              under a different label (audit D-06), so it's marked
              coming-soon instead.
            */}
            <button
              type="button"
              title="Detailed breakdown (coming soon)"
              aria-disabled="true"
              className="flex min-h-11 cursor-default items-center rounded-btn border border-mm-line bg-white px-4 text-xs font-semibold text-mm-ink-soft"
            >
              Detailed breakdown
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-mm-line bg-white p-8 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mm-tint text-primary">
            <BookOpenCheck aria-hidden="true" className="h-6 w-6" />
          </div>
          <p className="text-sm text-mm-muted">No completed sessions yet.</p>
          <Link
            href="/practice"
            className="inline-flex min-h-11 items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Start a practice session
            <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
}
