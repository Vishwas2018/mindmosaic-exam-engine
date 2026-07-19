import Link from "next/link";
import {
  Award,
  CalendarDays,
  Flame,
  Lock,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ProgressBar,
  buttonClasses,
} from "@/components/ui";
import { cn } from "@/lib/cn";

import type { Achievement, EngagementSummary } from "../achievements";
import { countThisWeek, weekDots, toDayKey, type WeekDot } from "../streaks";
import type { AttemptSummary } from "../attempts";

/**
 * Engagement page body (mockup 11): streaks, weekly momentum, achievement
 * ladder and journey timeline. Purely presentational server component —
 * every number is derived from exam_attempts rows upstream.
 *
 * The mockup's "weekly goals" panel needs teacher/self-set goal storage
 * that has no Phase 0 table, so goals are reduced to one derived metric: a
 * default target of practice sessions per week.
 */
const WEEKLY_SESSION_TARGET = 5;

const TONE_STYLES: Record<Achievement["tone"], string> = {
  gold: "bg-royal-orange/10 text-warning border-royal-orange/20",
  purple: "bg-royal/8 text-royal border-royal/15",
  green: "bg-success/10 text-success border-success/15",
};

const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return DAY_KEY_FORMAT.format(new Date(y, m - 1, d));
}

function WeekDotsRow({ dots }: { dots: WeekDot[] }) {
  const stateClasses: Record<WeekDot["state"], string> = {
    done: "bg-royal text-white",
    today_done: "bg-royal text-white ring-2 ring-royal-orange",
    today_pending: "border-2 border-royal bg-soft-purple text-royal",
    missed: "bg-royal/5 text-muted",
    future: "bg-page text-muted/60",
  };
  const stateLabels: Record<WeekDot["state"], string> = {
    done: "practised",
    today_done: "today — practised",
    today_pending: "today — not practised yet",
    missed: "no practice",
    future: "upcoming",
  };
  return (
    <ul className="flex gap-1.5" aria-label="This week's practice days">
      {dots.map((dot) => (
        <li
          key={dot.dayKey}
          aria-label={`${formatDayKey(dot.dayKey)}: ${stateLabels[dot.state]}`}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-extrabold",
            stateClasses[dot.state],
          )}
        >
          <span aria-hidden="true">{dot.label}</span>
        </li>
      ))}
    </ul>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card variant="outlined" className="p-4 text-center">
      <p className="text-2xl font-black tabular-nums text-royal">{value}</p>
      <p className="mt-1 text-xs font-bold text-muted">{label}</p>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card
      variant="outlined"
      className={cn("p-5", !achievement.earned && "opacity-70")}
    >
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
            achievement.earned
              ? TONE_STYLES[achievement.tone]
              : "border-royal/10 bg-page text-muted",
          )}
        >
          {achievement.earned ? (
            <Award className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div className="min-w-0">
          <h3
            className={cn(
              "text-sm font-extrabold",
              achievement.earned ? "text-ink" : "text-muted",
            )}
          >
            {achievement.title}
          </h3>
          <p className="mt-0.5 text-[11px] font-semibold text-muted">
            {achievement.earned && achievement.earnedOn
              ? `Earned ${formatDayKey(achievement.earnedOn)}`
              : achievement.earned
                ? "Earned"
                : "Locked"}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        {achievement.description}
      </p>
      {!achievement.earned && achievement.progress && (
        <div className="mt-3">
          <ProgressBar
            label={`${achievement.title} progress`}
            value={achievement.progress.value}
            max={achievement.progress.target}
          />
          <p className="mt-1 text-[11px] font-semibold tabular-nums text-muted">
            {achievement.progress.value} / {achievement.progress.target}
          </p>
        </div>
      )}
    </Card>
  );
}

export function EngagementView({
  summary,
  attempts,
  now,
}: {
  summary: EngagementSummary;
  attempts: AttemptSummary[];
  now: Date;
}) {
  const today = toDayKey(now);
  const attemptDayKeys = attempts.map((a) => toDayKey(new Date(a.submittedAt)));
  const dots = weekDots([...new Set(attemptDayKeys)], today);
  const thisWeek = countThisWeek(attemptDayKeys, today);
  const hasAttempts = summary.totalSessions > 0;

  return (
    <div className="space-y-10">
      {!hasAttempts && (
        <EmptyState
          title="Your journey starts with one session"
          description="Streaks, badges and milestones all grow from practice sessions. Finish your first one while signed in and this page comes to life."
          icon={<Sparkles aria-hidden="true" className="h-6 w-6" />}
          action={
            <Link href="/" className={buttonClasses({ variant: "orange" })}>
              Start practising
            </Link>
          }
        />
      )}

      {hasAttempts && (
        <section aria-labelledby="streak-heading" className="grid gap-4 lg:grid-cols-3">
          <h2 id="streak-heading" className="sr-only">
            Streak
          </h2>
          <Card className="p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-royal-orange/20 bg-royal-orange/10"
                >
                  <Flame className="h-7 w-7 text-royal-orange" />
                </div>
                <div>
                  <p className="text-3xl font-black tabular-nums leading-none text-ink">
                    {summary.currentStreak}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-muted">
                    day streak
                  </p>
                </div>
              </div>
              <Badge variant="orange">Best: {summary.bestStreak} days</Badge>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <WeekDotsRow dots={dots} />
              {!summary.practisedToday && summary.currentStreak > 0 && (
                <p className="text-xs font-bold text-warning">
                  Practise today to keep your streak alive.
                </p>
              )}
            </div>
          </Card>

          <Card variant="accent" className="p-6">
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" className="h-4 w-4 text-royal" />
              <h3 className="text-sm font-extrabold text-ink">This week</h3>
            </div>
            <p className="mt-3 text-2xl font-black tabular-nums text-ink">
              {thisWeek}
              <span className="text-base font-bold text-muted">
                {" "}
                / {WEEKLY_SESSION_TARGET} sessions
              </span>
            </p>
            <ProgressBar
              className="mt-3"
              label="Weekly sessions"
              value={thisWeek}
              max={WEEKLY_SESSION_TARGET}
              tone="orange"
            />
            <p className="mt-2 text-xs font-semibold text-muted">
              {thisWeek >= WEEKLY_SESSION_TARGET
                ? "Weekly target reached — brilliant!"
                : `${WEEKLY_SESSION_TARGET - thisWeek} more to hit this week's target.`}
            </p>
          </Card>
        </section>
      )}

      {hasAttempts && (
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Practice statistics
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Sessions" value={String(summary.totalSessions)} />
            <StatTile
              label="Average score"
              value={
                summary.averagePercentage === null
                  ? "—"
                  : `${summary.averagePercentage}%`
              }
            />
            <StatTile
              label="Best score"
              value={
                summary.bestPercentage === null
                  ? "—"
                  : `${summary.bestPercentage}%`
              }
            />
            <StatTile label="Perfect scores" value={String(summary.perfectCount)} />
          </div>
        </section>
      )}

      <section aria-labelledby="achievements-heading">
        <div className="mb-4 flex items-center gap-2">
          <Trophy aria-hidden="true" className="h-5 w-5 text-royal" />
          <h2
            id="achievements-heading"
            className="text-xl font-extrabold tracking-[-0.02em] text-ink"
          >
            Achievements
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.achievements.map((achievement) => (
            <AchievementCard key={achievement.id} achievement={achievement} />
          ))}
        </div>
      </section>

      {summary.timeline.length > 0 && (
        <section aria-labelledby="journey-heading">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star aria-hidden="true" className="h-5 w-5 text-royal" />
                <CardTitle id="journey-heading">Your journey</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ol className="space-y-0">
                {summary.timeline.map((event, index) => (
                  <li key={`${event.dayKey}-${event.title}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        aria-hidden="true"
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          index === 0
                            ? "bg-royal text-white"
                            : "bg-royal/10 text-royal",
                        )}
                      >
                        <Award className="h-4 w-4" />
                      </div>
                      {index < summary.timeline.length - 1 && (
                        <div className="my-1 w-px flex-1 bg-royal/10" />
                      )}
                    </div>
                    <div className={cn(index < summary.timeline.length - 1 && "pb-6")}>
                      <p className="text-sm font-extrabold text-ink">
                        {event.title}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold text-muted">
                        {formatDayKey(event.dayKey)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
