import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Plain-English answers about practice sets, timed papers, and marks.",
};

export const dynamic = "force-dynamic";

export default async function StudentSupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (await isStudentPreviewEnabled()) {
    return <StudentCanvasScreen screen="help" state={resolvedParams.state} />;
  }

  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);
  redirect("/help");

  return (
    <StudentPortalShell active="home" breadcrumbLabel="Help Centre" student={student} shellData={shellData}>
      <Link href="/student">Back to My Space</Link>
    </StudentPortalShell>
  );
}
