import type { Metadata } from "next";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { StudentAnswerReview } from "@/features/student/components/review/StudentAnswerReview";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "Every question, with the working | My Results",
  description: "Question-by-question answer review with worked solutions.",
};

export const dynamic = "force-dynamic";

export default async function StudentAnswerReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedSearch = searchParams ? await searchParams : {};
  if (await isStudentPreviewEnabled()) {
    return <StudentCanvasScreen screen="result-review" state={resolvedSearch.state} />;
  }

  await params;
  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);

  return (
    <StudentPortalShell active="progress" breadcrumbLabel="Question Review" student={student} shellData={shellData}>
      <StudentAnswerReview paperTitle="NAPLAN-style Numeracy" scoreText="24 of 32 marks" />
    </StudentPortalShell>
  );
}
