import type { Metadata } from "next";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "My Progress",
  description: "What your marks say so far, and what they are based on.",
};

export const dynamic = "force-dynamic";

export default async function StudentEngagementPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (!(await isStudentPreviewEnabled())) {
    await requireStudent();
  }

  return <StudentCanvasScreen screen="progress" state={resolvedParams.state} />;
}
