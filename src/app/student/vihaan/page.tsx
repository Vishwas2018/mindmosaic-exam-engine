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
  getVihaanDiagnosticQuestions,
  loadVihaanParentOutcomes,
} from "@/server/vihaan-practice";

export const metadata: Metadata = {
  title: "Vihaan Scholarship Prep",
  description: "Year 7 Academic Scholarship preparation — Edutest-style practice for Huntingtower 2028.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VihaanScholarshipPrepPage() {
  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);

  if (!isVihaanScholarshipPrepEnabledFor(student.userId)) {
    return redirect("/student");
  }

  const questions = getVihaanDiagnosticQuestions(student.userId);
  const solutionsById = getVihaanSolutionsRecord(questions);
  const supabase = await createClient();
  const outcomes = await loadVihaanParentOutcomes(supabase, student.userId);

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
        questions={questions}
        solutionsById={solutionsById}
        outcomes={outcomes}
      />
    </StudentPortalShell>
  );
}
