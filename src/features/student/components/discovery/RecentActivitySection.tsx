import Link from "next/link";
import { ArrowRight, BookOpenCheck, Calculator, FileText, Sparkles } from "lucide-react";

import { formatSubmittedAt, type AttemptSummary } from "../../attempt-summary";

function getSubjectIcon(subjectLabel: string) {
  const lower = subjectLabel.toLowerCase();
  if (lower.includes("math")) {
    return <Calculator className="w-5 h-5 text-primary" aria-hidden="true" />;
  }
  if (lower.includes("english") || lower.includes("reading") || lower.includes("writing")) {
    return <FileText className="w-5 h-5 text-primary" aria-hidden="true" />;
  }
  return <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />;
}

export function RecentActivitySection({
  attempts,
}: {
  attempts: readonly AttemptSummary[];
}) {
  const visibleAttempts = attempts.slice(0, 4);

  return (
    <section aria-labelledby="recent-activity-heading" className="flex flex-col gap-4 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2
            id="recent-activity-heading"
            className="font-jakarta font-extrabold text-xl md:text-2xl text-plum-dark tracking-tight"
          >
            Recent activity
          </h2>
          <p className="font-vietnam text-xs md:text-sm text-plum-muted mt-0.5">
            Your latest completed practice sets and tests
          </p>
        </div>
        {attempts.length > 0 && (
          <Link
            href="/results"
            className="font-jakarta font-bold text-xs md:text-sm text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
          >
            <span>View all results</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        )}
      </div>

      {visibleAttempts.length === 0 ? (
        <div className="rounded-2xl border border-parchment-border bg-white p-8 md:p-12 text-center shadow-warm-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-tint text-primary border border-primary/20 mb-4">
            <BookOpenCheck className="h-7 w-7" aria-hidden="true" />
          </div>
          <h3 className="font-jakarta font-extrabold text-lg text-plum-dark">
            No completed sessions yet
          </h3>
          <p className="mx-auto mt-2 max-w-md font-vietnam text-xs md:text-sm text-plum-muted">
            Your submitted practice tests and curriculum checkpoints will appear here with your verified scores.
          </p>
          <div className="mt-6">
            <Link
              href="/practice"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-jakarta text-sm font-bold text-white shadow-warm-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <span>Start your first session</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-parchment-border bg-white shadow-warm-card overflow-hidden">
          <div className="divide-y divide-parchment-border">
            {visibleAttempts.map((attempt) => {
              const formattedDate = formatSubmittedAt(attempt.submittedAt);
              const hasScore = attempt.scorePercent !== null;
              const isHigh = hasScore && (attempt.scorePercent ?? 0) >= 70;

              let scoreText = "Completed";
              if (hasScore) {
                if (attempt.totalQuestions !== null && attempt.totalQuestions > 0) {
                  const correctCount = Math.round(((attempt.scorePercent ?? 0) / 100) * attempt.totalQuestions);
                  scoreText = `${correctCount} of ${attempt.totalQuestions} correct`;
                } else {
                  scoreText = `${attempt.scorePercent}% correct`;
                }
              }

              return (
                <div
                  key={attempt.id}
                  className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-tint/60 text-primary flex items-center justify-center shrink-0 border border-primary/10">
                      {getSubjectIcon(attempt.subjectLabel)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-jakarta font-bold text-sm md:text-base text-plum-dark truncate">
                        {attempt.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-plum-muted mt-0.5">
                        <span className="font-semibold text-primary">{attempt.subjectLabel}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{attempt.timing === "timed" ? "Timed Exam" : "Practice Set"}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`px-3 py-1 rounded-full font-jakarta font-semibold text-xs border ${
                        !hasScore
                          ? "bg-surface-container text-plum-muted border-parchment-border"
                          : isHigh
                            ? "bg-teal-light text-teal-accent border-teal-border"
                            : "bg-coral-light text-coral-accent border-coral-border"
                      }`}
                    >
                      {scoreText}
                    </span>

                    <Link
                      href="/results"
                      className="font-jakarta font-bold text-xs text-primary hover:text-coral-accent transition-colors inline-flex items-center gap-1"
                    >
                      <span>View result</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-surface-container-low px-5 py-3 border-t border-parchment-border flex items-center justify-end">
            <Link
              href="/results"
              className="inline-flex items-center gap-1.5 font-jakarta font-bold text-xs md:text-sm text-primary hover:text-primary-dark transition-colors"
            >
              <span>View all results</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
