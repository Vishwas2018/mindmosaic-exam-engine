import type { Metadata } from "next";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { EngagementView } from "@/features/student/engagement/components/EngagementView";
import { fetchEngagementAttempts } from "@/features/student/engagement/fetch-engagement";
import { MyProgressHero } from "@/features/student/components/progress/MyProgressHero";
import { MyProgressInsightCard } from "@/features/student/components/progress/MyProgressInsightCard";
import { MyProgressMasteryBoard } from "@/features/student/components/progress/MyProgressMasteryBoard";
import { MyProgressSessionsTable } from "@/features/student/components/progress/MyProgressSessionsTable";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "My Progress",
  description: "Streaks, achievements and milestones from your practice.",
};

/* Per-student data behind auth — never statically prerendered. */
export const dynamic = "force-dynamic";

/**
 * My Progress — a port of the Stitch "My Progress" mockup onto the shared
 * StudentPortalShell, per this session's "pixel-match with placeholders"
 * decision.
 *
 * Real: questions-answered count, current focus, subject mastery board, the
 * recent-sessions table (same real attempt history shown on the dashboard
 * and Exam Centre — deliberately not the mock's fixed example rows, which
 * would otherwise visibly contradict those two screens for the same
 * login), and everything in the pre-existing EngagementView section below
 * (streak, weekly target, session/score stats, achievements, journey).
 *
 * Placeholder, marked in their own files: the "Assessment readiness"
 * target-window tile (no test-calendar model) and — implicitly, by
 * omission — the mock's per-day "Weekly Practice Cadence" minutes chart,
 * which is dropped rather than faked: no session-duration field exists on
 * an attempt (see AttemptSummary), and EngagementView's real week-dots
 * already cover "which days did you practise" honestly.
 *
 * Switched from getStudentAccess() to requireStudent() for the same
 * yearLevel-aware shell every other portal screen uses; this trades away
 * the old custom "not configured" screen for require Student()'s redirect,
 * consistent with Dashboard/Learning Hub/Exam Centre's behaviour in that
 * edge case.
 */
export default async function StudentEngagementPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);
  const result = await fetchEngagementAttempts(student.userId);
  const now = new Date();

  const questionsAnswered = overview.attempts.reduce((sum, a) => sum + a.attemptedQuestions, 0);

  return (
    <StudentPortalShell active="progress" breadcrumbLabel="My Progress" student={student} shellData={shellData}>
      <MyProgressHero
        yearLevel={student.yearLevel}
        questionsAnswered={questionsAnswered}
        recommendedFocus={overview.recommendedFocus}
      />

      <MyProgressMasteryBoard mastery={overview.mastery} />

      <MyProgressInsightCard recommendedFocus={overview.recommendedFocus} />

      {result.ok ? (
        <EngagementView
          summary={buildEngagementSummary(result.attempts, now)}
          attempts={result.attempts}
          now={now}
        />
      ) : (
        <ErrorState
          description="We couldn't load your progress just now. Refresh the page to try again."
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Go to practice
            </Link>
          }
        />
      )}

      <div>
        <h2 className="mb-3 text-xl font-bold text-mm-ink">Recent completed sessions</h2>
        <MyProgressSessionsTable attempts={overview.attempts} />
      </div>
    </StudentPortalShell>
  );
}
