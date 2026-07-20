import type { Metadata } from "next";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import { getStudentAccess } from "@/features/student/access";
import { fetchStudentAssignments } from "@/features/student/assignments/fetch-student-assignments";
import { AssignmentsView } from "@/features/student/assignments/components/AssignmentsView";
import { PortalNotConfigured } from "@/features/student/components/PortalGateStates";
import { StudentShell } from "@/features/student/components/StudentShell";

export const metadata: Metadata = {
  title: "My assignments",
  description: "Assignments set by your teacher, with due dates and results.",
};

/* Per-student data behind auth — never statically prerendered. */
export const dynamic = "force-dynamic";

export default async function StudentAssignmentsPage() {
  const access = await getStudentAccess();

  if (access.kind === "not_configured") {
    return (
      <StudentShell active="assignments">
        <PortalNotConfigured />
      </StudentShell>
    );
  }

  const result = await fetchStudentAssignments(access.userId);

  return (
    <StudentShell active="assignments">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-ink">
          My assignments
        </h1>
        <p className="mt-2 text-base leading-7 text-muted">
          Work set by your teacher. Complete each one before its due date.
        </p>
      </div>
      {result.ok ? (
        <AssignmentsView assignments={result.assignments} />
      ) : (
        <ErrorState
          description="We couldn't load your assignments just now. Refresh the page to try again."
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Go to practice
            </Link>
          }
        />
      )}
    </StudentShell>
  );
}
