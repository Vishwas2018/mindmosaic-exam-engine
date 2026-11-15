import type { Metadata } from "next";

import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { WarmupFlow } from "@/features/student/components/warmup/WarmupFlow";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "Five-question warm-up",
  description: "An optional five-question warm-up that suggests what to practise next.",
};

/* Per-user page: always render at request time. */
export const dynamic = "force-dynamic";

/**
 * The optional diagnostic warm-up. Reached from My Space only when the child chooses to; nothing opens it
 * automatically. Reuses the existing 5-question selector and scorer (published questions only).
 */
export default async function StudentWarmupPage() {
  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);
  /* Only Years 3 and 5 are served; any other recorded year reads as 3, as elsewhere in the student app. */
  const yearLevel = student.yearLevel === 5 ? 5 : 3;

  return (
    <StudentPortalShell active="home" breadcrumbLabel="My Space / Warm-up" student={student} shellData={shellData}>
      <WarmupFlow yearLevel={yearLevel} previouslyCompleted={student.diagnosticCompleted} />
    </StudentPortalShell>
  );
}
