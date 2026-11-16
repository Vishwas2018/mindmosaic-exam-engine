import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { VihaanDiagnosticExamRunner } from "@/features/scholarship-prep/components/DiagnosticExamRunner";
import { getVihaanSolutionsRecord } from "@/features/scholarship-prep/content/questions/vihaan-pilot-questions";
import { isVihaanScholarshipPrepEnabledFor } from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { requireStudent } from "@/features/student/require-student";
import { getVihaanDiagnosticQuestions } from "@/server/vihaan-practice";

export const metadata: Metadata = {
  title: "Diagnostic Assessment — Vihaan Scholarship Prep",
  description: "Establish your baseline for Year 7 scholarship preparation.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage({
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
  const isSyntheticE2e = resolvedParams.e2e === "1";

  const approvedQuestions = getVihaanDiagnosticQuestions(student.userId);
  const solutionsById = getVihaanSolutionsRecord(approvedQuestions);

  return (
    <StudentPortalShell
      active="vihaan"
      breadcrumbLabel="Diagnostic Assessment"
      student={student}
      shellData={shellData}
    >
      <VihaanDiagnosticExamRunner
        questions={approvedQuestions}
        subject="mixed"
        solutionsById={solutionsById}
        isSyntheticE2e={isSyntheticE2e}
        persistToServer
      />
    </StudentPortalShell>
  );
}
