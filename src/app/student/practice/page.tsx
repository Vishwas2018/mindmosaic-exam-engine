import type { Metadata } from "next";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { requireStudent } from "@/features/student/require-student";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";

export const metadata: Metadata = {
  title: "Practice Studio",
  description: "Targeted skill drills and practice sets across Mathematics and English.",
};

export const dynamic = "force-dynamic";

export default async function StudentPracticeStudioPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (!(await isStudentPreviewEnabled())) {
    await requireStudent();
  }

  return <StudentCanvasScreen screen="practice" state={resolvedParams.state} />;
}
