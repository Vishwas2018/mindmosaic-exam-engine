import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VihaanDashboard } from "@/features/scholarship-prep/components/VihaanDashboard";
import { getVihaanSolutionsRecord } from "@/features/scholarship-prep/content/questions/vihaan-pilot-questions";
import { isVihaanScholarshipPrepEnabledFor } from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { requireStudent } from "@/features/student/require-student";
import { createClient } from "@/lib/supabase/server";
import {
  getVihaanApprovedBank,
  getVihaanMockPool,
  getVihaanPracticePool,
  loadVihaanParentOutcomes,
} from "@/server/vihaan-practice";
import { loadWritingHistory } from "@/server/writing/queries";

export const metadata: Metadata = {
  title: "Vihaan Scholarship Prep",
  description: "Year 7 Academic Scholarship preparation — Edutest-style practice for Huntingtower 2028.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VihaanScholarshipPrepPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);

  if (!isVihaanScholarshipPrepEnabledFor(student.userId)) {
    return redirect("/student");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const includeSyntheticE2e = resolvedParams.e2e === "1";

  const practiceQuestions = getVihaanPracticePool(student.userId);
  const mockQuestions = getVihaanMockPool(student.userId);
  const allApproved = getVihaanApprovedBank(student.userId);
  const solutionsById = getVihaanSolutionsRecord(allApproved);
  const supabase = await createClient();
  const outcomes = await loadVihaanParentOutcomes(supabase, student.userId, 200, {
    includeSyntheticE2e,
  });
  const rawWritingHistory = await loadWritingHistory(supabase, {
    studentIds: [student.userId],
    submittedOnly: true,
  });
  const writingHistory = rawWritingHistory.filter((item) => {
    const isSyntheticTask = item.attempt.taskId.startsWith("e2e-");
    return includeSyntheticE2e ? true : !isSyntheticTask;
  });

  return (
    <StudentPortalShell
      active="vihaan"
      breadcrumbLabel="Vihaan Scholarship Prep"
      student={student}
      shellData={shellData}
    >
      <VihaanDashboard
        student={student}
        shellData={shellData}
        questions={practiceQuestions}
        mockQuestions={mockQuestions}
        solutionsById={solutionsById}
        outcomes={outcomes}
        writingHistory={writingHistory}
        isSyntheticE2e={includeSyntheticE2e}
      />
    </StudentPortalShell>
  );
}
