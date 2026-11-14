import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { isVihaanScholarshipPrepEnabled } from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import { requireStudent } from "@/features/student/require-student";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { VihaanDiagnosticExamRunner } from "@/features/scholarship-prep/components/DiagnosticExamRunner";

export const metadata: Metadata = {
  title: "Diagnostic Assessment — Vihaan Scholarship Prep",
  description: "Establish your baseline for Year 7 scholarship preparation.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);

  if (!isVihaanScholarshipPrepEnabled()) {
    return redirect("/student");
  }

  return (
    <StudentPortalShell
      active="vihaan"
      breadcrumbLabel="Diagnostic Assessment"
      student={student}
      shellData={shellData}
    >
      <VihaanDiagnosticExamRunner
        questions={[]}
        subject="mathematics"
        onComplete={(result) => { console.log("Diagnostic result:", result); }}
      />
    </StudentPortalShell>
  );
}
