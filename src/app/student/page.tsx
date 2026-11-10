import type { Metadata } from "next";

import {
  MySpaceCanvasScreen,
  resolveMySpaceState,
} from "@/features/student/components/my-space/MySpaceCanvasScreen";
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
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
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
export default async function StudentHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const forcedState = resolvedParams.state;
  const isPreview = await isStudentPreviewEnabled();

  if (isPreview) {
    return <MySpaceCanvasScreen state={resolveMySpaceState(forcedState)} />;
  }

  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);
  const availability = getStudioAvailability();

  const firstName = student.displayName?.split(" ")[0] ?? null;
  /* Only Years 3 and 5 are served; any other recorded year reads as 3, as elsewhere in the student app. */
  const yearLevel = student.yearLevel === 5 ? 5 : 3;

  const isFirstVisit = forcedState === "first-visit";
  const displayedAttempts = isFirstVisit ? [] : overview.attempts;
  const displayedMastery = isFirstVisit ? [] : overview.mastery;

  return (
    <StudentPortalShell active="home" breadcrumbLabel="My Space" student={student} shellData={shellData}>
      {isPreview && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/15 bg-white p-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-royal">Preview Artboard Switcher:</span>
            <span className="text-mm-muted">Explore My Space screen states</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href="/student"
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                !forcedState ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Returning Student
            </a>
            <a
              href="/student?state=first-visit"
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                forcedState === "first-visit" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              First Visit (b4/b5)
            </a>
          </div>
        </div>
      )}

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
      <MySpaceHero hasActiveSession={shellData.hasActiveSession} hasFinishedPaper={displayedAttempts.length > 0} />
      <MySpacePathways availability={availability} yearLevel={yearLevel} />
      <MySpaceProgress attempts={displayedAttempts} mastery={displayedMastery} />
      <MySpaceRecent attempts={displayedAttempts} />
      <StudentOnboardingModal
        firstName={firstName}
        yearLevel={student.yearLevel}
        onboardingCompleted={student.onboardingCompleted}
        interests={student.interests}
        weeklyGoalMinutes={student.weeklyGoalMinutes}
      />
    </StudentPortalShell>
  );
}
