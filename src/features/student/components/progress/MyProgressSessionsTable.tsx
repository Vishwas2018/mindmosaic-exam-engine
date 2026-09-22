import type { AttemptSummary } from "@/features/student/attempt-summary";

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Recent Completed Sessions & Answer History" from the Stitch mock, built
 * from real attempt history — not the mock's fixed example rows. Audit
 * finding from the dashboard work: a fabricated table here would visibly
 * contradict the real attempt history already shown on the dashboard and
 * Exam Centre for the same login.
 */
export function MyProgressSessionsTable({ attempts }: { attempts: readonly AttemptSummary[] }) {
  if (attempts.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-mm-line bg-white px-6 py-10 text-center">
        <p className="text-sm text-mm-muted">
          Nothing sat yet. Finished sessions appear here with their subject, topic and score.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-mm-line bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-mm-line bg-mm-page/60 text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Subject</th>
              <th className="px-5 py-3">Topic</th>
              <th className="px-5 py-3">Score</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt, index) => (
              <tr
                key={attempt.id}
                className={index < attempts.length - 1 ? "border-b border-mm-line-soft" : ""}
              >
                <td className="whitespace-nowrap px-5 py-3.5 text-mm-muted">
                  {formatDate(attempt.submittedAt)}
                </td>
                <td className="px-5 py-3.5 font-semibold text-mm-ink">{attempt.subjectLabel}</td>
                <td className="px-5 py-3.5 text-mm-muted">{attempt.title}</td>
                <td className="whitespace-nowrap px-5 py-3.5 font-mono font-bold text-mm-ink">
                  {attempt.scorePercent === null
                    ? "Pending"
                    : `${attempt.attemptedQuestions} of ${attempt.totalQuestions ?? attempt.attemptedQuestions} · ${attempt.scorePercent}%`}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {/* No per-attempt review route exists (see ResultsColdLoad.tsx's scope note). */}
                  <button
                    type="button"
                    title="Detailed review (coming soon)"
                    aria-disabled="true"
                    className="inline-flex min-h-11 cursor-default items-center text-xs font-semibold text-primary"
                  >
                    Review answers
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
