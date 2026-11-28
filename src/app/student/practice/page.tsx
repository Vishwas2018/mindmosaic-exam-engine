import type { Metadata } from "next";

import { PracticeStudioHero } from "@/features/student/components/practice-studio/PracticeStudioHero";
import { PracticeStudioHistory } from "@/features/student/components/practice-studio/PracticeStudioHistory";
import { PracticeStudioSelector } from "@/features/student/components/practice-studio/PracticeStudioSelector";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";
import { getStudioAvailability } from "@/server/practice-studio-availability";

export const metadata: Metadata = {
  title: "Practice Studio",
  description: "Targeted skill drills and practice sets across Mathematics and English.",
};

/* Per-user page — always render at request time (see /student/page.tsx). */
export const dynamic = "force-dynamic";

/**
 * Practice Studio (/student/practice).
 * 5-step selector powered by the availability module (P1):
 * Year → Programme → Subject → Strand → Set options.
 * Summary rail with question count, "about N minutes" and one Start practice link.
 * Untimed by default; answers are not saved as you go (closing tab restarts).
 * First visit vs returning state; honest empty & unchecked states.
 */
export default async function StudentPracticeStudioPage() {
  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);
  const availability = getStudioAvailability();

  const effectiveYear = student.yearLevel === 5 ? 5 : 3;
  const isFirstVisit = overview.attempts.length === 0;

  return (
    <StudentPortalShell active="practice" breadcrumbLabel="Practice Studio" student={student} shellData={shellData}>
      <PracticeStudioHero yearLevel={effectiveYear} isFirstVisit={isFirstVisit} />

      <PracticeStudioSelector
        availability={availability}
        yearLevel={effectiveYear}
      />

      {overview.attempts.length > 0 && (
        <PracticeStudioHistory attempts={overview.attempts} hasActiveSession={shellData.hasActiveSession} />
      )}
    </StudentPortalShell>
  );
}
