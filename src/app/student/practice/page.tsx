import type { Metadata } from "next";

import { PracticeStudioAccuracyCard } from "@/features/student/components/practice-studio/PracticeStudioAccuracyCard";
import { PracticeStudioDrillModules } from "@/features/student/components/practice-studio/PracticeStudioDrillModules";
import { PracticeStudioHero } from "@/features/student/components/practice-studio/PracticeStudioHero";
import { PracticeStudioHistory } from "@/features/student/components/practice-studio/PracticeStudioHistory";
import { PracticeStudioSprintSpotlight } from "@/features/student/components/practice-studio/PracticeStudioSprintSpotlight";
import { MyProgressInsightCard } from "@/features/student/components/progress/MyProgressInsightCard";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Practice Studio" };

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Practice Studio — a NEW route (`/student/practice`), not a replacement
 * of the public `/practice` catalogue. The Stitch mock is a signed-in,
 * personalized adaptive-drill screen ("Vihaan's Best", per-drill mastery);
 * the real `/practice` catalogue is guest-accessible with its own e2e
 * coverage and serves a different job (browsing/starting any program,
 * signed in or not). Overwriting it would have broken guest access and
 * the guest-facing trust copy on that page. This route sits alongside it:
 * the sidebar's "Practice Studio" item now points here, while every
 * subject-specific deep link elsewhere (dashboard's "Explore NAPLAN", Exam
 * Centre's format cards, this page's own drill-module CTAs) still goes
 * straight to the real catalogue.
 *
 * Real: the discipline filter pills (real catalogue query params), 5 of 6
 * drill-module CTAs (real catalogue destinations — the 6th, Thinking
 * Skills & Logic, has no question bank, same as Exam Centre's AMC-style/
 * selective entry-style cards), the practice-history list and the
 * "resume" row (same real attempt history and hasActiveSession signal
 * used elsewhere), and the accuracy card (real overview.mastery).
 *
 * Placeholder, marked in their own files: the Daily Speed Sprint section
 * (no timed-sprint mode or personal-best tracking exists) and each drill
 * module's specific mastery percentage (no per-drill-category tracking,
 * only per-subject — see My Progress's mastery board for the same
 * granularity limit).
 */
export default async function StudentPracticeStudioPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);

  const effectiveYear = student.yearLevel === 5 ? 5 : 3;

  return (
    <StudentPortalShell active="practice" breadcrumbLabel="Practice Studio" student={student} shellData={shellData}>
      <PracticeStudioHero effectiveYear={effectiveYear} />

      <PracticeStudioSprintSpotlight />

      <PracticeStudioDrillModules effectiveYear={effectiveYear} />

      <PracticeStudioHistory attempts={overview.attempts} hasActiveSession={shellData.hasActiveSession} />

      <PracticeStudioAccuracyCard mastery={overview.mastery} />

      <MyProgressInsightCard recommendedFocus={overview.recommendedFocus} />
    </StudentPortalShell>
  );
}
