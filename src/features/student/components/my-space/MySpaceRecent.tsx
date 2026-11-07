import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { formatSubmittedAt, type AttemptSummary } from "@/features/student/attempt-summary";

const SHOWN = 3;

/**
 * Latest finished papers. Marks are shown out of what could be marked: a
 * question a person has yet to mark is "not yet marked", never zero. There is
 * no per-attempt review page yet, so no "Review answers" link is drawn; the
 * list in My Results is the honest destination.
 */
export function MySpaceRecent({ attempts }: { attempts: readonly AttemptSummary[] }) {
  return (
    <section aria-labelledby="my-space-recent" className="space-y-3 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="my-space-recent" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
          Recent activity
        </h2>
        <Link href="/results" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Open My Results
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      {attempts.length === 0 ? (
        <p className="rounded-2xl border border-mm-line bg-white p-5 text-sm text-mm-muted">
          Nothing finished yet. Finished timed papers will be listed here.
        </p>
      ) : (
        <ul className="space-y-3">
          {attempts.slice(0, SHOWN).map((attempt) => (
            <li key={attempt.id} className="rounded-2xl border border-mm-line bg-white p-5 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">{attempt.title}</h3>
                <span className="rounded border border-mm-line bg-mm-tint-soft px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
                  {attempt.timing === "timed" ? "Timed" : "Untimed"}
                </span>
              </div>
              <p className="mt-1 text-sm text-mm-muted">
                {attempt.attemptedQuestions} of {attempt.totalQuestions ?? attempt.attemptedQuestions} answered · Finished{" "}
                {formatSubmittedAt(attempt.submittedAt)}
              </p>
              <p className="mt-1 text-sm font-semibold text-mm-ink">
                {attempt.scorePercent !== null
                  ? `${attempt.scorePercent}% of the marks that could be marked`
                  : "No marks to show yet"}
                {attempt.pendingManualReview ? " · some questions not yet marked" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
