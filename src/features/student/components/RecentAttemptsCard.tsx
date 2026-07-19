import Link from "next/link";
import { ArrowRight, BookOpenCheck } from "lucide-react";

import { Badge, Card, EmptyState, buttonClasses } from "@/components/ui";

import { formatSubmittedAt, type AttemptSummary } from "../attempt-summary";

function scoreTone(percent: number): string {
  if (percent >= 75) return "text-success";
  if (percent < 60) return "text-error";
  return "text-ink";
}

/**
 * The signed-in student's recent server-scored sessions, straight from
 * exam_attempts. Review links go to the existing results route — the
 * results screen itself is owned by another thread (mockups 07–09).
 */
export function RecentAttemptsCard({
  attempts,
  limit = 5,
}: {
  attempts: readonly AttemptSummary[];
  limit?: number;
}) {
  if (attempts.length === 0) {
    return (
      <EmptyState
        title="No sessions yet"
        description="Your finished practice sessions and exam sims will appear here with their scores, ready to review."
        icon={<BookOpenCheck aria-hidden="true" className="h-6 w-6" />}
        action={
          <Link href="/#exam-setup" className={buttonClasses({ variant: "primary" })}>
            Start your first session
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        }
      />
    );
  }

  const visible = attempts.slice(0, limit);

  return (
    <Card variant="default" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-royal/8 px-6 py-4">
        <h2 className="text-sm font-extrabold text-ink">Recent sessions</h2>
        <Link
          href="/results"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          View all results
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
      <ul className="divide-y divide-royal/6">
        {visible.map((attempt) => (
          <li
            key={attempt.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink">{attempt.title}</p>
              <p className="mt-0.5 text-xs font-semibold text-muted">
                {formatSubmittedAt(attempt.submittedAt)}
                {attempt.totalQuestions !== null &&
                  ` · ${attempt.totalQuestions} questions`}
              </p>
            </div>
            <Badge variant={attempt.timing === "timed" ? "orange" : "purple"}>
              {attempt.timing === "timed" ? "Timed exam" : "Practice"}
            </Badge>
            <span className="w-16 text-right text-sm font-black tabular-nums">
              {attempt.scorePercent !== null ? (
                <span className={scoreTone(attempt.scorePercent)}>
                  {attempt.scorePercent}%
                </span>
              ) : (
                <span
                  className="text-muted"
                  title="Awaiting manual marking — no auto-marked questions in this session"
                >
                  —
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
