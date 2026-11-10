import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";
import { StudentPortalShell } from "@/features/student/components/StudentPortalShell";
import { fetchStudentPortalShellData } from "@/features/student/components/student-portal-shell-data";
import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";

export const metadata: Metadata = {
  title: "Account & Profile",
  description: "Your student profile, reading preferences, and sign-out.",
};

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  if (await isStudentPreviewEnabled()) {
    return <StudentCanvasScreen screen="profile" state={resolvedParams.state} />;
  }

  const student = await requireStudent();
  const shellData = await fetchStudentPortalShellData(student);
  redirect("/student");

  return (
    <StudentPortalShell active="home" breadcrumbLabel="Account" student={student} shellData={shellData}>
      <Link href="/student">Back to My Space</Link>
    </StudentPortalShell>
  );
}
