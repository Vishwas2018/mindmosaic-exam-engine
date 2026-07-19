import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import {
  Badge,
  buttonClasses,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import {
  attemptResultSliceSchema,
  studentSubjectMastery,
  summariseStudent,
} from "@/features/teacher/analytics";
import { assignmentConfigSchema } from "@/features/teacher/assignment-contract";
import { StandingBadge } from "@/features/teacher/components/StandingBadge";
import { SubjectMasteryBars } from "@/features/teacher/components/SubjectMasteryBars";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import {
  getStudentMembership,
  getStudentProfile,
  listStudentAssignments,
  listStudentAttempts,
} from "@/features/teacher/data";
import {
  formatLastActive,
  formatShortDate,
  formatTimeSpent,
} from "@/features/teacher/format";
import { loadTeacherPageContext } from "@/features/teacher/load-context";

export const metadata: Metadata = { title: "Student detail" };

const STATUS_PRESENTATION = {
  assigned: { label: "Not started", variant: "neutral" as const },
  in_progress: { label: "In progress", variant: "purple" as const },
  submitted: { label: "Completed", variant: "success" as const },
};

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card className="p-5">
      <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
        {label}
      </p>
      <p className="text-[26px] font-black leading-none tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-muted">{detail}</p>
    </Card>
  );
}

export default async function TeacherStudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ class?: string }>;
}) {
  const [{ id: studentId }, { class: requestedClassId }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { supabase, teacher, classes, activeClass } =
    await loadTeacherPageContext(requestedClassId);

  /* Scope check first: a student outside the teacher's classes is
     indistinguishable from a non-existent one — RLS returns nothing for
     both, and this page must not reveal the difference either. */
  const membership = await getStudentMembership(supabase, studentId);
  if (membership.length === 0) notFound();

  const profile = await getStudentProfile(supabase, studentId);
  if (!profile) notFound();

  const [attempts, assignmentRows] = await Promise.all([
    listStudentAttempts(supabase, [studentId]),
    listStudentAssignments(supabase, studentId),
  ]);
  const summary = summariseStudent(studentId, attempts);

  const resultByAttempt = attempts.flatMap((attempt) => {
    const slice = attemptResultSliceSchema.safeParse(attempt.result);
    return slice.success
      ? [{ submittedAt: attempt.submittedAt, result: slice.data }]
      : [];
  });

  const displayName = profile.displayName ?? "Unnamed student";
  const classQuery = activeClass ? `?class=${activeClass.id}` : "";

  const studentMastery = studentSubjectMastery(studentId, attempts);

  return (
    <TeacherShell
      title="Student detail"
      activeNav="overview"
      classes={classes}
      activeClassId={activeClass?.id ?? null}
      teacherName={teacher.displayName}
      actions={
        <Link
          href={`/teacher/assignments/new${classQuery}`}
          className={buttonClasses({ variant: "primary", size: "sm" })}
        >
          Assign work
        </Link>
      }
    >
      <div className="space-y-6">
        <div>
          <Link
            href={`/teacher${classQuery}`}
            className="inline-flex items-center gap-1 text-sm font-bold text-muted transition hover:text-royal"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Back to class overview
          </Link>
        </div>

        <header className="flex flex-wrap items-start gap-5">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-royal/10 text-2xl font-black text-royal"
          >
            {displayName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black tracking-[-0.03em] text-ink">
                {displayName}
              </h2>
              {profile.yearLevel !== null && (
                <Badge variant="purple">Year {profile.yearLevel}</Badge>
              )}
              <StandingBadge standing={summary.standing} />
            </div>
            <p className="text-sm text-muted">
              {membership.map((entry) => entry.className).join(" · ")} · Last active{" "}
              {formatLastActive(summary.lastActiveAt)}
            </p>
          </div>
        </header>

        <section
          aria-label="Student key figures"
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          <StatTile
            label="Overall score"
            value={
              summary.averagePercentage === null ? "—" : `${summary.averagePercentage}%`
            }
            detail="Average of objective marks"
          />
          <StatTile
            label="Attempts"
            value={String(summary.attemptCount)}
            detail="Submitted exam sessions"
          />
          <StatTile
            label="Questions attempted"
            value={String(summary.questionsAttempted)}
            detail="Across all attempts"
          />
          <StatTile
            label="Time on task"
            value={formatTimeSpent(summary.timeSpentSeconds)}
            detail="Total supervised practice"
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance by subject</CardTitle>
                <CardDescription>
                  Share of objective marks earned in each subject
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectMasteryBars mastery={studentMastery} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment history</CardTitle>
                <CardDescription>
                  Work assigned to {displayName} across your classes
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0 pb-2">
                {assignmentRows.length === 0 ? (
                  <p className="px-6 py-4 text-sm leading-6 text-muted">
                    No assignments yet.
                  </p>
                ) : (
                  <table className="w-full min-w-[520px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-royal/10 text-left">
                        <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                          Assignment
                        </th>
                        <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                          Due
                        </th>
                        <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentRows.map((row) => {
                        const config = assignmentConfigSchema.safeParse(row.config);
                        const presentation = STATUS_PRESENTATION[row.status];
                        return (
                          <tr key={row.assignmentId} className="border-b border-royal/5">
                            <td className="px-6 py-3 font-bold text-ink">
                              {config.success ? config.data.title : "Assignment"}
                            </td>
                            <td className="px-4 py-3 text-muted">
                              {formatShortDate(row.dueAt)}
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant={presentation.variant}>
                                {presentation.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="self-start">
            <CardHeader>
              <CardTitle>Recent attempts</CardTitle>
              <CardDescription>Newest first</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {resultByAttempt.length === 0 ? (
                <p className="py-4 text-sm leading-6 text-muted">
                  No submitted attempts yet.
                </p>
              ) : (
                resultByAttempt.slice(0, 8).map((entry, index) => (
                  <div
                    key={`${entry.submittedAt}-${index}`}
                    className="flex items-center gap-3 border-b border-royal/5 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">
                        {entry.result.attemptedQuestions}/{entry.result.totalQuestions}{" "}
                        questions
                      </p>
                      <p className="text-xs text-muted">
                        {formatShortDate(entry.submittedAt)}
                      </p>
                    </div>
                    <span className="text-sm font-black tabular-nums text-royal">
                      {entry.result.objectivePercentage}%
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TeacherShell>
  );
}
