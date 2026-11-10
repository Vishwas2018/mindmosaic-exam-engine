import type { Metadata } from "next";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = { title: "Exam Centre" };

export const dynamic = "force-dynamic";

export default async function StudentExamPreparationPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (!(await isStudentPreviewEnabled())) {
    await requireStudent();
  }

  return <StudentCanvasScreen screen="exams" state={resolvedParams.state} />;
}
