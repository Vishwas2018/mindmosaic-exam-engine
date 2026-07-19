import type { AttemptSummary } from "./attempts";
import {
  computeStreakStats,
  streakReachedOn,
  toDayKey,
  uniqueSortedDayKeys,
} from "./streaks";

/**
 * Achievement ladder derived entirely from exam_attempts history — no
 * dedicated achievements table exists in Phase 0, so badges are recomputed
 * from the same server-authoritative rows every view (documented
 * assumption). Deterministic given the same attempts and clock.
 */

export type AchievementTone = "gold" | "purple" | "green";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tone: AchievementTone;
  earned: boolean;
  /** Day key the badge was earned, when derivable from history. */
  earnedOn: string | null;
  /** Progress towards a locked badge; null when earned or not meaningful. */
  progress: { value: number; target: number } | null;
}

export interface TimelineEvent {
  /** Day key of the event. */
  dayKey: string;
  title: string;
}

export interface EngagementSummary {
  totalSessions: number;
  /** Mean of parseable percentages, rounded; null with no scored attempts. */
  averagePercentage: number | null;
  bestPercentage: number | null;
  perfectCount: number;
  currentStreak: number;
  bestStreak: number;
  practisedToday: boolean;
  achievements: Achievement[];
  timeline: TimelineEvent[];
}

const SESSION_MILESTONES = [
  { target: 1, id: "first-session", title: "First Steps", tone: "green" as const,
    description: "Completed your very first practice session." },
  { target: 10, id: "ten-sessions", title: "Regular Learner", tone: "purple" as const,
    description: "Completed 10 practice sessions." },
  { target: 25, id: "twenty-five-sessions", title: "Dedicated Scholar", tone: "purple" as const,
    description: "Completed 25 practice sessions. Practice makes progress." },
] as const;

const STREAK_MILESTONES = [
  { target: 3, id: "three-day-streak", title: "3-Day Streak", tone: "gold" as const,
    description: "Practised three days in a row." },
  { target: 7, id: "seven-day-streak", title: "7-Day Streak", tone: "gold" as const,
    description: "Practised every day for a full week. Consistency is the foundation of mastery." },
  { target: 30, id: "thirty-day-streak", title: "30-Day Streak", tone: "gold" as const,
    description: "Practised every day for 30 days straight." },
] as const;

export function buildEngagementSummary(
  attempts: readonly AttemptSummary[],
  now: Date,
): EngagementSummary {
  const today = toDayKey(now);
  const sorted = [...attempts].sort((a, b) =>
    a.submittedAt.localeCompare(b.submittedAt),
  );
  const attemptDates = sorted.map((a) => new Date(a.submittedAt));
  const dayKeys = uniqueSortedDayKeys(attemptDates);
  const streak = computeStreakStats(dayKeys, today);

  const scored = sorted.filter((a) => a.percentage !== null);
  const percentages = scored.map((a) => a.percentage as number);
  const averagePercentage =
    percentages.length > 0
      ? Math.round(
          percentages.reduce((sum, p) => sum + p, 0) / percentages.length,
        )
      : null;
  const bestPercentage =
    percentages.length > 0 ? Math.max(...percentages) : null;
  const perfect = scored.filter((a) => a.percentage === 100);
  const strong = scored.filter((a) => (a.percentage as number) >= 90);

  const achievements: Achievement[] = [];

  for (const milestone of SESSION_MILESTONES) {
    const earned = sorted.length >= milestone.target;
    achievements.push({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      tone: milestone.tone,
      earned,
      earnedOn: earned
        ? toDayKey(new Date(sorted[milestone.target - 1].submittedAt))
        : null,
      progress: earned ? null : { value: sorted.length, target: milestone.target },
    });
  }

  for (const milestone of STREAK_MILESTONES) {
    const earnedOn = streakReachedOn(dayKeys, milestone.target);
    achievements.push({
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      tone: milestone.tone,
      earned: earnedOn !== null,
      earnedOn,
      progress:
        earnedOn !== null
          ? null
          : {
              value: Math.min(streak.current, milestone.target),
              target: milestone.target,
            },
    });
  }

  achievements.push({
    id: "top-marks",
    title: "Top Marks",
    description: "Scored 90% or higher in a session.",
    tone: "purple",
    earned: strong.length > 0,
    earnedOn:
      strong.length > 0 ? toDayKey(new Date(strong[0].submittedAt)) : null,
    progress: null,
  });

  achievements.push({
    id: "first-perfect",
    title: "First Perfect",
    description: "Scored 100% on a practice session. Precision matters.",
    tone: "green",
    earned: perfect.length > 0,
    earnedOn:
      perfect.length > 0 ? toDayKey(new Date(perfect[0].submittedAt)) : null,
    progress: null,
  });

  /* Journey timeline: earned badges plus the first session, newest first. */
  const timeline: TimelineEvent[] = achievements
    .filter((a): a is Achievement & { earnedOn: string } => a.earnedOn !== null)
    .map((a) => ({ dayKey: a.earnedOn, title: `${a.title} earned` }));
  timeline.sort((a, b) => b.dayKey.localeCompare(a.dayKey));

  return {
    totalSessions: sorted.length,
    averagePercentage,
    bestPercentage,
    perfectCount: perfect.length,
    currentStreak: streak.current,
    bestStreak: streak.best,
    practisedToday: streak.practisedToday,
    achievements,
    timeline: timeline.slice(0, 6),
  };
}
