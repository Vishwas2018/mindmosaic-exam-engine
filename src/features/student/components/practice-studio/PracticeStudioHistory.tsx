import Link from "next/link";
import { PlayCircle } from "lucide-react";

import type { AttemptSummary } from "@/features/student/attempt-summary";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Recent Practice History" from the Stitch mock, built from real attempt
 * history (same data shown on the dashboard, Exam Centre, and My
 * Progress) rather than the mock's fixed example rows. The "in progress"
 * row is real too: it only renders when `hasActiveSession` is true (the
 * same signal driving the dashboard's resume recommendation and
 * notification dot), not always-on as in the mock. No duration field
 * exists on an attempt (see AttemptSummary), so unlike the mock this
 * shows timing mode (Timed/Untimed) instead of inventing minutes.
 */
export function PracticeStudioHistory({
  attempts,
  hasActiveSession,
}: {
  attempts: readonly AttemptSummary[];
  hasActiveSession: boolean;
}) {
  const recent = attempts.slice(0, 5);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink tracking-tight">
          Recent practice history
        </h2>
        <Link
          href="/student/engagement"
          className="inline-flex min-h-11 items-center text-xs font-semibold text-primary hover:underline"
        >
          View full history
        </Link>
      </div>

      {!hasActiveSession && recent.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-mm-line bg-white px-6 py-10 text-center">
          <p className="text-sm text-mm-muted">Nothing practised yet — finished drills appear here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-mm-line bg-white">
          <ol>
            {hasActiveSession && (
              <li className="flex items-center justify-between gap-4 border-b border-mm-line-soft bg-mm-coral-text/5 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mm-coral-text/15 text-mm-coral-text">
                    <PlayCircle aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-mm-ink">In progress</p>
                    <p className="text-xs text-mm-muted">You have an active session waiting to be finished.</p>
                  </div>
                </div>
                <Link
                  href="/exam"
                  className="rounded-btn bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                  Resume
                </Link>
              </li>
            )}
            {recent.map((attempt, index) => (
              <li
                key={attempt.id}
                className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 ${
                  index < recent.length - 1 ? "border-b border-mm-line-soft" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-mm-ink">{attempt.title}</p>
                  <p className="mt-0.5 text-xs text-mm-muted">
                    {attempt.timing === "timed" ? "Timed" : "Untimed"} · {formatDate(attempt.submittedAt)}
                  </p>
                </div>
                <span className="font-mono text-sm font-bold text-mm-ink">
                  {attempt.scorePercent === null
                    ? "Pending"
                    : `${attempt.attemptedQuestions} of ${attempt.totalQuestions ?? attempt.attemptedQuestions} · ${attempt.scorePercent}%`}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
