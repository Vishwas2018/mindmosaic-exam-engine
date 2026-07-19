import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, GraduationCap } from "lucide-react";

import {
  Badge,
  buttonClasses,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ProgressBar,
} from "@/components/ui";
import { describeConfig } from "@/features/exam-engine/components/describe-config";
import { assignmentCompletionPercentage } from "@/features/teacher/analytics";
import { assignmentConfigSchema } from "@/features/teacher/assignment-contract";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import {
  getClassRoster,
  listClassAssignments,
  type AssignmentWithProgress,
} from "@/features/teacher/data";
import { formatShortDate, isPastDue } from "@/features/teacher/format";
import { loadTeacherPageContext } from "@/features/teacher/load-context";

export const metadata: Metadata = { title: "Assignments" };

const STATUS_PRESENTATION = {
  assigned: { label: "Not started", variant: "neutral" as const },
  in_progress: { label: "In progress", variant: "purple" as const },
  submitted: { label: "Completed", variant: "success" as const },
};

function AssignmentCard({
  assignment,
  nameFor,
}: {
  assignment: AssignmentWithProgress;
  nameFor: Map<string, string>;
}) {
  const config = assignmentConfigSchema.safeParse(assignment.config);
  const completion = assignmentCompletionPercentage(
    assignment.students.map((student) => student.status),
  );
  const submitted = assignment.students.filter(
    (student) => student.status === "submitted",
  ).length;
  const overdue = isPastDue(assignment.dueAt) && completion < 100;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-extrabold text-ink">
              {config.success ? config.data.title : "Assignment"}
            </h3>
            {overdue ? (
              <Badge variant="error">Past due</Badge>
            ) : completion >= 100 ? (
              <Badge variant="success">Completed</Badge>
            ) : (
              <Badge variant="purple">Open</Badge>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            {config.success ? describeConfig(config.data) : "Unknown configuration"} · Due{" "}
            {formatShortDate(assignment.dueAt)} · Created{" "}
            {formatShortDate(assignment.createdAt)}
          </p>
        </div>
        <div className="w-40 shrink-0">
          <ProgressBar
            label={`${submitted}/${assignment.students.length} submitted`}
            value={completion}
            tone={completion >= 100 ? "success" : "purple"}
          />
        </div>
      </div>

      <details className="group mt-4">
        <summary className="cursor-pointer select-none text-sm font-bold text-royal transition hover:underline">
          Student progress ({assignment.students.length})
        </summary>
        <ul className="mt-3 divide-y divide-royal/5 rounded-2xl border border-royal/10">
          {assignment.students.map((student) => {
            const presentation = STATUS_PRESENTATION[student.status];
            return (
              <li
                key={student.studentId}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
              >
                <span className="font-semibold text-ink">
                  {nameFor.get(student.studentId) ?? "Student no longer in class"}
                </span>
                <Badge variant={presentation.variant}>{presentation.label}</Badge>
              </li>
            );
          })}
        </ul>
      </details>
    </Card>
  );
}

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

  const open = assignments.filter(
    (assignment) =>
      assignmentCompletionPercentage(
        assignment.students.map((student) => student.status),
      ) < 100,
  );
  const completed = assignments.filter((assignment) => !open.includes(assignment));

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
          <section aria-label="Open assignments" className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
              Open ({open.length})
            </h2>
            {open.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                No open assignments — everything has been completed.
              </p>
            ) : (
              open.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  nameFor={nameFor}
                />
              ))
            )}
          </section>

          {completed.length > 0 && (
            <section aria-label="Completed assignments" className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Completed ({completed.length})
              </h2>
              {completed.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  nameFor={nameFor}
                />
              ))}
            </section>
          )}

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
