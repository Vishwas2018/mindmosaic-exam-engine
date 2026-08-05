import { Flame, Sparkles, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface DashboardStatRailProps {
  totalSessions: number;
  averagePercentage: number | null;
  bestPercentage: number | null;
  currentStreak: number;
  /** Sittings submitted without a single answer — counted, never averaged. */
  blankSessions?: number;
}

/**
 * The four numbers that answer "where am I" without scrolling.
 *
 * Deliberately renders for a student with no history too, showing honest
 * zeros and em-dashes. Every other panel on this screen used to hide itself
 * when empty (MasterySnapshot and StreakWeeklyGoalWidget both returned
 * null), which left a brand-new student looking at two marketing cards and
 * an empty box — a landing page, not a dashboard. A dashboard that reads
 * "0 sessions, no average yet" is still telling you where you are.
 */
export function DashboardStatRail({
  totalSessions,
  averagePercentage,
  bestPercentage,
  currentStreak,
  blankSessions = 0,
}: DashboardStatRailProps) {
  /*
   * A blank sitting scores a real 0%, so "5 sessions finished / Average 0%"
   * was arithmetically right and read as a scoring bug — which is how it was
   * reported. The average now excludes them and the hints say where they
   * went, so the count and the score stop contradicting each other.
   */
  const blankNote =
    blankSessions === 1 ? "1 with no answers" : `${blankSessions} with no answers`;
  const stats: {
    key: string;
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
    tone: "purple" | "orange" | "success";
  }[] = [
    {
      key: "sessions",
      label: "Sessions finished",
      value: String(totalSessions),
      hint:
        totalSessions === 0 ? "None yet" : blankSessions > 0 ? blankNote : "All time",
      icon: Target,
      tone: "purple",
    },
    {
      key: "average",
      label: "Average score",
      value: averagePercentage === null ? "—" : `${averagePercentage}%`,
      hint:
        averagePercentage !== null
          ? "Across answered sessions"
          : blankSessions > 0
            ? "No questions answered yet"
            : "After your first score",
      icon: TrendingUp,
      tone: "purple",
    },
    {
      key: "best",
      label: "Best score",
      value: bestPercentage === null ? "—" : `${bestPercentage}%`,
      hint:
        bestPercentage !== null
          ? "Your record so far"
          : blankSessions > 0
            ? "Answer a question to set one"
            : "Your record goes here",
      icon: Sparkles,
      tone: "success",
    },
    {
      key: "streak",
      label: "Day streak",
      value: String(currentStreak),
      hint: currentStreak === 0 ? "Practise today to start one" : "Days in a row",
      icon: Flame,
      tone: "orange",
    },
  ];

  const toneClasses: Record<string, string> = {
    purple: "bg-royal/8 text-royal",
    orange: "bg-royal-orange/12 text-warning",
    success: "bg-success/10 text-success",
  };

  return (
    <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            data-testid={`stat-${stat.key}`}
            className="rounded-2xl border border-royal/8 bg-white p-4 shadow-[0_6px_18px_rgba(30,20,60,0.04)] sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <dt className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-muted">
                {stat.label}
              </dt>
              <span
                aria-hidden="true"
                className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${toneClasses[stat.tone]}`}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <dd className="mt-3 text-3xl font-black tabular-nums leading-none tracking-[-0.03em] text-ink">
              {stat.value}
            </dd>
            <p className="mt-1.5 text-xs font-semibold text-muted">{stat.hint}</p>
          </div>
        );
      })}
    </dl>
  );
}
