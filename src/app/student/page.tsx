import type { Metadata } from "next";

import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";
import { AccessCardsSection } from "@/features/student/components/dashboard/AccessCardsSection";
import { DashboardHero } from "@/features/student/components/dashboard/DashboardHero";
import { DashboardWelcomeBanner } from "@/features/student/components/dashboard/DashboardWelcomeBanner";
import { ExploreGridSection } from "@/features/student/components/dashboard/ExploreGridSection";
import { QuickActionsSection } from "@/features/student/components/dashboard/QuickActionsSection";
import { RecentActivityCard } from "@/features/student/components/dashboard/RecentActivityCard";
import { deriveStartHereItem } from "@/features/student/components/discovery";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentOverview } from "@/features/student/data";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "My Learning — Dashboard",
  description: "Personalised dashboard for curriculum learning, NAPLAN, and ICAS preparation.",
};

/*
 * Per-user page: everything on it is scoped to the signed-in student, so it
 * must render at request time.
 */
export const dynamic = "force-dynamic";

/**
 * MindMosaic Student Dashboard — a port of the Stitch "Enriched Access &
 * Directory Visuals" mockup (project 13560346960841301670), on the shared
 * StudentPortalShell (sidebar + top bar) also used by Learning Hub, Exam
 * Centre, and My Progress — deliberately separate from
 * StudentShell/student-nav.ts, the older shell other student pages use.
 *
 * Data-integrity note: some mockup elements are still fake (XP/level badge,
 * term/week and goal pills, curriculum-sync badge, session/version chip,
 * "Edit interests & goals" — see each component's own "Placeholder" comment
 * for the specific field). The rest — attempt history, streak/week-dot
 * engagement, lesson/attempt counts, active-session state, and the Start
 * Here recommendation incl. its progress panel — are real. Grep
 * "Placeholder" across this page and `components/dashboard/`,
 * `components/StudentSidebar.tsx` for the current fake-vs-real inventory
 * before assuming any given field is live.
 */
export default async function StudentHomePage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);

  const firstName = student.displayName?.split(" ")[0] ?? null;

  const recommendation = deriveStartHereItem({
    studentName: firstName,
    yearLevel: student.yearLevel,
    attempts: overview.attempts,
    hasActiveSession: shellData.hasActiveSession,
  });

  const mathematicsLessonCount = shellData.mathematicsPathways.reduce(
    (sum, pathway) => sum + pathway.nodes.length,
    0,
  );

  const naplanAttemptCount = overview.attempts.filter((attempt) => attempt.title.startsWith("NAPLAN")).length;
  const icasAttemptCount = overview.attempts.filter((attempt) => attempt.title.startsWith("ICAS")).length;

  const latestAttempt = overview.attempts[0] ?? null;

  return (
    <StudentPortalShell active="home" breadcrumbLabel="Dashboard" student={student} shellData={shellData}>
      <ActiveSessionBanner />
      <DashboardWelcomeBanner firstName={firstName} yearLevel={student.yearLevel} />
      <DashboardHero recommendation={recommendation} />
      <QuickActionsSection />
      <AccessCardsSection
        mathematicsLessonCount={mathematicsLessonCount}
        naplanAttemptCount={naplanAttemptCount}
        icasAttemptCount={icasAttemptCount}
      />
      <ExploreGridSection />
      <RecentActivityCard attempt={latestAttempt} />
    </StudentPortalShell>
  );
}
