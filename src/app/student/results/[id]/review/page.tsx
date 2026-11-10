import type { Metadata } from "next";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
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
  await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  if (!(await isStudentPreviewEnabled())) {
    await requireStudent();
  }

  return <StudentCanvasScreen screen="result-review" state={resolvedSearch.state} />;
}
