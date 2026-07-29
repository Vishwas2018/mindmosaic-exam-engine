import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";

import { Card, ProgressBar } from "@/components/ui";

import { WEEKLY_SESSION_TARGET, type EngagementSummary } from "../engagement/achievements";
import type { AttemptSummary } from "../engagement/attempts";
import { countThisWeek, toDayKey } from "../engagement/streaks";

/**
 * Screen 7 & 14 compact streak + weekly-goal widget for the student
 * dashboard — the same numbers the full /student/engagement page shows
 * (EngagementView.tsx), condensed to one card. Hidden until the student has
 * at least one session, matching MasterySnapshot's own "nothing to show
 * yet" convention rather than opening with a discouraging 0-day streak.
 */
export function StreakWeeklyGoalWidget({
  summary,
  attempts,
  now,
}: {
  summary: EngagementSummary;
  attempts: readonly AttemptSummary[];
  now: Date;
}) {
  if (summary.totalSessions === 0) return null;

  const today = toDayKey(now);
  const attemptDayKeys = attempts.map((attempt) => toDayKey(new Date(attempt.submittedAt)));
  const thisWeek = countThisWeek(attemptDayKeys, today);

  return (
    <Card className="p-6" variant="default">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-royal-orange/20 bg-royal-orange/10"
          >
            <Flame className="h-5 w-5 text-royal-orange" />
          </span>
          <div>
            <p className="text-2xl font-black tabular-nums leading-none text-ink">
              {summary.currentStreak}
            </p>
            <p className="mt-1 text-xs font-semibold text-muted">day streak</p>
          </div>
        </div>
        <Link
          href="/student/engagement"
          className="inline-flex min-h-9 items-center gap-1 rounded-xl text-xs font-bold text-royal transition hover:gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          View progress
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-5">
        <ProgressBar
          label="Weekly goal"
          value={thisWeek}
          max={WEEKLY_SESSION_TARGET}
          showValue
          tone="orange"
        />
        <p className="mt-1.5 text-xs font-semibold text-muted">
          {thisWeek} of {WEEKLY_SESSION_TARGET} sessions this week
        </p>
      </div>
    </Card>
  );
}
