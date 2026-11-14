import type { Metadata } from "next";

import { MySpaceHero } from "@/features/student/components/my-space/MySpaceHero";
import { MySpacePathways } from "@/features/student/components/my-space/MySpacePathways";
import { MySpaceProgress } from "@/features/student/components/my-space/MySpaceProgress";
import { MySpaceRecent } from "@/features/student/components/my-space/MySpaceRecent";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import {
  StudentOnboardingModal,
  OnboardingResumeBanner,
} from "@/features/student/components/onboarding";
import { fetchStudentOverview } from "@/features/student/data";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { requireStudent } from "@/features/student/require-student";
import { getStudioAvailability } from "@/server/practice-studio-availability";

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
 * My Space. Every figure is real or absent: Continue only for a confirmed open
 * timed paper, pathways from the Practice Studio availability module, progress
 * worked out from finished timed papers (and saying so), recent results. No XP,
 * level, pace or difficulty chips, curriculum-sync badge or metric tiles.
 */
export default async function StudentHomePage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);
  const availability = getStudioAvailability();

  const firstName = student.displayName?.split(" ")[0] ?? null;
  /* Only Years 3 and 5 are served; any other recorded year reads as 3, as elsewhere in the student app. */
  const yearLevel = student.yearLevel === 5 ? 5 : 3;

  return (
    <StudentPortalShell active="home" breadcrumbLabel="My Space" student={student} shellData={shellData}>
      <OnboardingResumeBanner
        onboardingCompleted={student.onboardingCompleted}
        yearLevel={student.yearLevel}
        interests={student.interests}
        weeklyGoalMinutes={student.weeklyGoalMinutes}
      />
      <section className="space-y-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink lg:text-3xl">
          {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        </h1>
        <p className="text-sm text-mm-muted">Year {yearLevel}</p>
      </section>
      <MySpaceHero hasActiveSession={shellData.hasActiveSession} hasFinishedPaper={overview.attempts.length > 0} />
      <MySpacePathways availability={availability} yearLevel={yearLevel} />
      <MySpaceProgress attempts={overview.attempts} mastery={overview.mastery} />
      <MySpaceRecent attempts={overview.attempts} />
      <StudentOnboardingModal
        firstName={firstName}
        yearLevel={student.yearLevel}
        onboardingCompleted={student.onboardingCompleted}
        interests={student.interests}
        weeklyGoalMinutes={student.weeklyGoalMinutes}
        studentId={student.userId}
      />
    </StudentPortalShell>
  );
}
