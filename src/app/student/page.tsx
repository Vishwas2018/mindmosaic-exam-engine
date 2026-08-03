import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";

import { Badge, Card, buttonClasses } from "@/components/ui";
import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";
import { groupAssignments } from "@/features/student/assignments/classify";
import { fetchStudentAssignments } from "@/features/student/assignments/fetch-student-assignments";
import { AssignmentsSummaryCard } from "@/features/student/components/AssignmentsSummaryCard";
import { DashboardStatRail } from "@/features/student/components/DashboardStatRail";
import { MasterySnapshot } from "@/features/student/components/MasterySnapshot";
import { RecentAttemptsCard } from "@/features/student/components/RecentAttemptsCard";
import { SessionModeCards } from "@/features/student/components/SessionModeCards";
import { StreakWeeklyGoalWidget } from "@/features/student/components/StreakWeeklyGoalWidget";
import { StudentShell } from "@/features/student/components/StudentShell";
import { fetchStudentOverview } from "@/features/student/data";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { fetchEngagementAttempts } from "@/features/student/engagement/fetch-engagement";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Student dashboard" };

/*
 * Per-user page: everything on it is scoped to the signed-in student, so it
 * must render at request time. Without this, a build without Supabase env
 * would bake the unconfigured redirect into a static page.
 */
export const dynamic = "force-dynamic";

/**
 * The student's home base.
 *
 * This screen used to open with a centred hero headline over two
 * full-height session cards and nothing else — the shape of a marketing
 * page, not a dashboard. Worse, every panel that could have carried status
 * hid itself when empty, so a student with no history saw two buttons and
 * an empty box and could not tell what the product tracked.
 *
 * It is laid out as a dashboard now: a status line and a stat rail that
 * always render (honest zeros beat a missing panel), then a two-column
 * body — the session launchers and history in the main column, the
 * at-a-glance panels beside them. The two session-type options are
 * unchanged in substance; they are compact tiles instead of the page's
 * whole first screen.
 */
export default async function StudentHomePage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const engagementResult = await fetchEngagementAttempts(student.userId);
  const now = new Date();
  const engagementSummary = engagementResult.ok
    ? buildEngagementSummary(engagementResult.attempts, now)
    : null;

  const assignmentsResult = await fetchStudentAssignments(student.userId);
  const assignments = assignmentsResult.ok
    ? groupAssignments(assignmentsResult.assignments, now)
    : null;

  const firstName = student.displayName?.split(" ")[0] ?? null;
  const totalSessions = engagementSummary?.totalSessions ?? overview.attempts.length;
  const focus = overview.recommendedFocus;

  /* One line of state under the greeting, built from what is actually
     known — never a date, which a server render would stamp in the
     server's timezone rather than the student's. */
  const statusLine =
    totalSessions === 0
      ? "Nothing sat yet. Pick a session type below and your progress starts filling in."
      : `${totalSessions} session${totalSessions === 1 ? "" : "s"} finished` +
        (engagementSummary && engagementSummary.currentStreak > 0
          ? ` · ${engagementSummary.currentStreak}-day streak going`
          : "");

  return (
    <StudentShell active="home">
      <ActiveSessionBanner className="mb-6" />

      <header className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
            Your dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-ink sm:text-4xl">
            {firstName ? `Hi ${firstName}` : "Hi there"}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{statusLine}</p>
        </div>
        <Link href="/practice" className={buttonClasses({ variant: "primary", size: "lg" })}>
          {totalSessions === 0 ? "Start your first session" : "Start a session"}
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      </header>

      <section aria-label="Your numbers" className="pb-8">
        <DashboardStatRail
          totalSessions={totalSessions}
          averagePercentage={engagementSummary?.averagePercentage ?? null}
          bestPercentage={engagementSummary?.bestPercentage ?? null}
          currentStreak={engagementSummary?.currentStreak ?? 0}
        />
      </section>

      <div className="grid items-start gap-6 pb-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <section aria-label="Start a session" className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black tracking-[-0.02em] text-ink">
                Start a session
              </h2>
              <span className="text-sm font-semibold text-muted">
                Pick a mode — you can switch any time
              </span>
            </div>

            {/* Only shown once there is enough scored history to name a
                weakest subject, so it is a real recommendation rather than
                a default nudge at a student who has sat nothing. */}
            {focus && (
              <Card
                variant="default"
                className="flex flex-wrap items-center gap-x-4 gap-y-3 border-royal-orange/25 bg-royal-orange/6 p-4"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-royal-orange/12 text-warning"
                >
                  <Target className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-ink">
                    Focus next: {focus.label}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">
                    Your lowest subject so far, at {focus.percent}%.
                  </p>
                </div>
                <Link
                  href="/student/learn"
                  className={buttonClasses({ variant: "secondary", size: "sm" })}
                >
                  Practise this
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </Card>
            )}

            <SessionModeCards />
          </section>

          <section aria-label="Recent sessions" className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black tracking-[-0.02em] text-ink">
                {/* "Pick up where you left off" over an empty list told a new
                    student to resume something they had never started. */}
                {overview.attempts.length > 0
                  ? "Pick up where you left off"
                  : "Recent sessions"}
              </h2>
              {overview.attempts.length > 0 && (
                <Badge variant="purple">{overview.attempts.length} finished</Badge>
              )}
            </div>
            <RecentAttemptsCard attempts={overview.attempts} showEmptyAction={false} />
          </section>
        </div>

        <aside aria-label="Your progress" className="space-y-6">
          {engagementSummary && (
            <StreakWeeklyGoalWidget
              summary={engagementSummary}
              attempts={engagementResult.ok ? engagementResult.attempts : []}
              now={now}
            />
          )}
          <AssignmentsSummaryCard
            loaded={assignments !== null}
            toDoCount={assignments?.toDo.length ?? 0}
            inProgressCount={assignments?.inProgress.length ?? 0}
            overdueCount={assignments?.overdueCount ?? 0}
          />
          <MasterySnapshot mastery={overview.mastery} />
        </aside>
      </div>
    </StudentShell>
  );
}
