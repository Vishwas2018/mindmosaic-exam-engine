import type { Metadata } from "next";

import { PracticeStudioHero } from "@/features/student/components/practice-studio/PracticeStudioHero";
import { PracticeStudioHistory } from "@/features/student/components/practice-studio/PracticeStudioHistory";
import { PracticeStudioSelector } from "@/features/student/components/practice-studio/PracticeStudioSelector";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { fetchStudentOverview } from "@/features/student/data";
import { requireStudent } from "@/features/student/require-student";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
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
export default async function StudentPracticeStudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const forcedState = resolvedParams.state;
  const isPreview = await isStudentPreviewEnabled();

  const student = await requireStudent();
  const overview = await fetchStudentOverview();
  const shellData = await fetchStudentPortalShellData(student);
  const availability = getStudioAvailability();

  const effectiveYear = student.yearLevel === 5 ? 5 : 3;
  const isFirstVisit = forcedState === "first-visit" || overview.attempts.length === 0;

  return (
    <StudentPortalShell active="practice" breadcrumbLabel="Practice Studio" student={student} shellData={shellData}>
      {isPreview && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-royal/15 bg-white p-3 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-royal">Preview Artboard Switcher:</span>
            <span className="text-mm-muted">Explore Practice Studio screen states</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <a
              href="/student/practice"
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                !forcedState ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              Choose Practice (b10)
            </a>
            <a
              href="/student/practice?state=first-visit"
              className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                forcedState === "first-visit" ? "bg-royal text-white" : "bg-royal/5 text-royal hover:bg-royal/10"
              }`}
            >
              First Visit (b13)
            </a>
          </div>
        </div>
      )}

      <PracticeStudioHero yearLevel={effectiveYear} isFirstVisit={isFirstVisit} />

      <PracticeStudioSelector
        availability={availability}
        yearLevel={effectiveYear}
      />

      {!isFirstVisit && overview.attempts.length > 0 && (
        <PracticeStudioHistory attempts={overview.attempts} hasActiveSession={shellData.hasActiveSession} />
      )}
    </StudentPortalShell>
  );
}
