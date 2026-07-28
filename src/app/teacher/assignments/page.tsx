import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, GraduationCap } from "lucide-react";

import { buttonClasses, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { AssignmentsBoard } from "@/features/teacher/components/AssignmentsBoard";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import { getClassRoster, listClassAssignments } from "@/features/teacher/data";
import { loadTeacherPageContext } from "@/features/teacher/load-context";

export const metadata: Metadata = { title: "Assignments" };

export default async function TeacherAssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const { class: requestedClassId } = await searchParams;
  const { supabase, teacher, classes, activeClass } =
    await loadTeacherPageContext(requestedClassId);

  if (!activeClass) {
    return (
      <TeacherShell
        title="Assignments"
        activeNav="assignments"
        classes={classes}
        activeClassId={null}
        teacherName={teacher.displayName}
      >
        <EmptyState
          title="No classes yet"
          description="Assignments are created per class. Once your classes are set up, you can assign work here."
          icon={<GraduationCap aria-hidden="true" className="h-6 w-6" />}
        />
      </TeacherShell>
    );
  }

  const [assignments, roster] = await Promise.all([
    listClassAssignments(supabase, activeClass.id),
    getClassRoster(supabase, activeClass.id),
  ]);
  const nameFor = new Map(
    roster.map((student) => [student.studentId, student.displayName ?? "Unnamed student"]),
  );
  const classQuery = `?class=${activeClass.id}`;

  return (
    <TeacherShell
      title="Assignments"
      activeNav="assignments"
      classes={classes}
      activeClassId={activeClass.id}
      teacherName={teacher.displayName}
      actions={
        <Link
          href={`/teacher/assignments/new${classQuery}`}
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          New assignment
        </Link>
      }
    >
      {assignments.length === 0 ? (
        <EmptyState
          title="Nothing assigned yet"
          description="Create an assignment and every selected student will see it in their account."
          icon={<ClipboardList aria-hidden="true" className="h-6 w-6" />}
          action={
            <Link
              href={`/teacher/assignments/new${classQuery}`}
              className={buttonClasses({ variant: "primary" })}
            >
              Create the first assignment
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <AssignmentsBoard assignments={assignments} nameFor={nameFor} />

          <Card variant="outlined">
            <CardHeader>
              <CardTitle className="text-base">How completion is measured</CardTitle>
              <CardDescription>
                A student counts as completed once their submission is recorded against
                the assignment. Scores appear on each student&apos;s profile, computed
                server-side from their attempt.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0" />
          </Card>
        </div>
      )}
    </TeacherShell>
  );
}
