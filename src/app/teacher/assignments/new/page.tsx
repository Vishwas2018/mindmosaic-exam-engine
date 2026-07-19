import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, GraduationCap, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";
import { AssignmentCreateForm } from "@/features/teacher/components/AssignmentCreateForm";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import { getClassRoster } from "@/features/teacher/data";
import { loadTeacherPageContext } from "@/features/teacher/load-context";

export const metadata: Metadata = { title: "New assignment" };

export default async function NewAssignmentPage({
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
        title="New assignment"
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

  const roster = await getClassRoster(supabase, activeClass.id);

  return (
    <TeacherShell
      title="New assignment"
      activeNav="assignments"
      classes={classes}
      activeClassId={activeClass.id}
      teacherName={teacher.displayName}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/teacher/assignments?class=${activeClass.id}`}
          className="inline-flex items-center gap-1 text-sm font-bold text-muted transition hover:text-royal"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back to assignments
        </Link>

        {roster.length === 0 ? (
          <EmptyState
            title="No students to assign to"
            description="This class has no students on its roster yet, so there is nobody to receive an assignment."
            icon={<Users aria-hidden="true" className="h-6 w-6" />}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Create an assignment for {activeClass.name}</CardTitle>
              <CardDescription>
                Students you select will see this in their account. Their attempts are
                scored server-side, and results appear on your dashboard as they submit.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AssignmentCreateForm activeClass={activeClass} roster={roster} />
            </CardContent>
          </Card>
        )}
      </div>
    </TeacherShell>
  );
}
