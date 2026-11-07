import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { AttemptSummary, SubjectMastery } from "@/features/student/attempt-summary";
import {
  MIN_ATTEMPTS_FOR_FINDING,
  MIN_MARKS_FOR_FINDING,
  meetsFindingThreshold,
} from "@/features/student/progress-threshold";

/**
 * Descriptive only: marks earned out of marks available, by subject, from
 * finished TIMED papers. Practice sets are not recorded, and lesson progress is
 * not stored, so neither appears. A subject below the threshold (D6) shows
 * that there is not enough yet, never a figure.
 */
export function MySpaceProgress({
  attempts,
  mastery,
}: {
  attempts: readonly AttemptSummary[];
  mastery: readonly SubjectMastery[];
}) {
  return (
    <section aria-labelledby="my-space-progress" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="my-space-progress" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
          My Progress
        </h2>
        <Link href="/student/engagement" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Open My Progress
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <div className="rounded-2xl border border-mm-line bg-white p-5 shadow-xs">
        {attempts.length === 0 ? (
          <p className="text-sm text-mm-muted">Your marks will show here after you finish a timed paper.</p>
        ) : (
          <>
            <p className="text-sm text-mm-muted">
              Worked out from your {attempts.length} finished timed paper{attempts.length === 1 ? "" : "s"}. Practice sets are not recorded.
            </p>
            <ul className="mt-3 divide-y divide-mm-line">
              {mastery.map((subject) => {
                const count = attempts.filter((a) => a.subjectLabel === subject.label).length;
                const enough = meetsFindingThreshold(count, subject.marksAvailable);
                return (
                  <li key={subject.subject} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                    <span className="font-semibold text-mm-ink">{subject.label}</span>
                    {enough ? (
                      <span className="text-sm text-mm-ink">
                        {subject.marksEarned} of {subject.marksAvailable} marks · {count} papers
                      </span>
                    ) : (
                      <span className="text-sm text-mm-muted">
                        Not enough yet: needs {MIN_ATTEMPTS_FOR_FINDING} papers and {MIN_MARKS_FOR_FINDING} marks
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
