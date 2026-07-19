import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  Badge,
  buttonClasses,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@/components/ui";
import {
  assignmentCompletionPercentage,
  summariseClass,
} from "@/features/teacher/analytics";
import { assignmentConfigSchema } from "@/features/teacher/assignment-contract";
import { StandingBadge } from "@/features/teacher/components/StandingBadge";
import { SubjectMasteryBars } from "@/features/teacher/components/SubjectMasteryBars";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import {
  getClassRoster,
  listClassAssignments,
  listStudentAttempts,
} from "@/features/teacher/data";
import { formatLastActive, formatShortDate } from "@/features/teacher/format";
import { loadTeacherPageContext } from "@/features/teacher/load-context";

export const metadata: Metadata = { title: "Teacher dashboard" };

function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <Card className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
          {label}
        </p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-royal/8 text-royal">
          {icon}
        </span>
      </div>
      <p className={`text-2xl font-black tabular-nums tracking-[-0.02em] ${tone}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{detail}</p>
    </Card>
  );
}

export default async function TeacherDashboardPage({
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
        title="Class overview"
        activeNav="overview"
        classes={classes}
        activeClassId={null}
        teacherName={teacher.displayName}
      >
        <EmptyState
          title="No classes yet"
          description="Your account has no classes linked. Once your classes and students are set up, your dashboard appears here."
          icon={<GraduationCap aria-hidden="true" className="h-6 w-6" />}
        />
      </TeacherShell>
    );
  }

  const roster = await getClassRoster(supabase, activeClass.id);
  const studentIds = roster.map((student) => student.studentId);
  const [attempts, assignments] = await Promise.all([
    listStudentAttempts(supabase, studentIds),
    listClassAssignments(supabase, activeClass.id),
  ]);

  const overview = summariseClass(studentIds, attempts);
  const nameFor = new Map(
    roster.map((student) => [student.studentId, student.displayName ?? "Unnamed student"]),
  );
  const summaryFor = new Map(
    overview.summaries.map((summary) => [summary.studentId, summary]),
  );

  const atRisk = overview.summaries.filter(
    (summary) => summary.standing === "at_risk" && summary.attemptCount > 0,
  );
  const noActivity = overview.summaries.filter((summary) => summary.attemptCount === 0);

  const classQuery = `?class=${activeClass.id}`;

  return (
    <TeacherShell
      title="Class overview"
      activeNav="overview"
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
      {roster.length === 0 ? (
        <EmptyState
          title="No students in this class yet"
          description="Students appear here once they are added to the class roster."
          icon={<Users aria-hidden="true" className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-6">
          <section
            aria-label="Class key figures"
            className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          >
            <StatCard
              label="Students"
              value={String(overview.studentCount)}
              detail={`${overview.activeThisWeekCount} active this week`}
              icon={<Users aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Avg score"
              value={
                overview.averagePercentage === null
                  ? "—"
                  : `${overview.averagePercentage}%`
              }
              detail="Objective marks across attempts"
              icon={<TrendingUp aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="Assignments"
              value={String(assignments.length)}
              detail="Created for this class"
              icon={<ClipboardList aria-hidden="true" className="h-4 w-4" />}
            />
            <StatCard
              label="At risk"
              value={String(overview.atRiskCount)}
              detail="Students needing attention"
              icon={<AlertTriangle aria-hidden="true" className="h-4 w-4" />}
              tone={overview.atRiskCount > 0 ? "text-error" : "text-ink"}
            />
          </section>

          {(atRisk.length > 0 || noActivity.length > 0) && (
            <section aria-label="Priority alerts" className="space-y-3">
              {atRisk.length > 0 && (
                <Card className="border-error/20 bg-error/5 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error/10 text-error">
                      <AlertTriangle aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">
                        {atRisk.length}{" "}
                        {atRisk.length === 1 ? "student is" : "students are"} at risk of
                        falling behind
                      </p>
                      <p className="text-xs text-muted">
                        {atRisk
                          .map((summary) => nameFor.get(summary.studentId))
                          .join(", ")}
                      </p>
                    </div>
                    <Link
                      href={`/teacher/assignments/new${classQuery}`}
                      className={buttonClasses({ variant: "secondary", size: "sm" })}
                    >
                      Assign work
                    </Link>
                  </div>
                </Card>
              )}
              {noActivity.length > 0 && (
                <Card className="border-warning/20 bg-warning/5 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                      <Users aria-hidden="true" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-ink">
                        {noActivity.length}{" "}
                        {noActivity.length === 1 ? "student has" : "students have"} no
                        attempts yet
                      </p>
                      <p className="text-xs text-muted">
                        {noActivity
                          .map((summary) => nameFor.get(summary.studentId))
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </section>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Student performance</CardTitle>
              <CardDescription>
                {roster.length} students · open a row for the full profile
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 pb-2">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-royal/10 text-left">
                    <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                      Student
                    </th>
                    <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                      Last active
                    </th>
                    <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                      Avg score
                    </th>
                    <th className="px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                      Attempts
                    </th>
                    <th className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-[0.05em] text-muted">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((student) => {
                    const summary = summaryFor.get(student.studentId);
                    return (
                      <tr
                        key={student.studentId}
                        className="border-b border-royal/5 transition hover:bg-soft-purple/60"
                      >
                        <td className="px-6 py-3">
                          <Link
                            href={`/teacher/students/${student.studentId}${classQuery}`}
                            className="flex items-center gap-3 font-bold text-ink hover:text-royal"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-royal/10 text-xs font-extrabold text-royal"
                            >
                              {(student.displayName ?? "?").slice(0, 1).toUpperCase()}
                            </span>
                            {student.displayName ?? "Unnamed student"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {formatLastActive(summary?.lastActiveAt ?? null)}
                        </td>
                        <td className="px-4 py-3 font-bold tabular-nums text-ink">
                          {summary?.averagePercentage === null ||
                          summary?.averagePercentage === undefined
                            ? "—"
                            : `${summary.averagePercentage}%`}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-muted">
                          {summary?.attemptCount ?? 0}
                        </td>
                        <td className="px-6 py-3">
                          <StandingBadge standing={summary?.standing ?? "at_risk"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <section className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Subject mastery</CardTitle>
                <CardDescription>
                  Share of objective marks earned across the whole class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectMasteryBars mastery={overview.subjectMastery} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Assignments</CardTitle>
                  <CardDescription>Latest for this class</CardDescription>
                </div>
                <Link
                  href={`/teacher/assignments${classQuery}`}
                  className="text-sm font-bold text-royal hover:underline"
                >
                  View all
                </Link>
              </CardHeader>
              <CardContent className="space-y-1 pt-0">
                {assignments.length === 0 ? (
                  <p className="py-4 text-sm leading-6 text-muted">
                    Nothing assigned yet — create the first assignment for this class.
                  </p>
                ) : (
                  assignments.slice(0, 4).map((assignment) => {
                    const config = assignmentConfigSchema.safeParse(assignment.config);
                    const completion = assignmentCompletionPercentage(
                      assignment.students.map((student) => student.status),
                    );
                    return (
                      <div
                        key={assignment.id}
                        className="flex items-center gap-3 border-b border-royal/5 py-3 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">
                            {config.success ? config.data.title : "Assignment"}
                          </p>
                          <p className="text-xs text-muted">
                            Due {formatShortDate(assignment.dueAt)} ·{" "}
                            {assignment.students.length} students
                          </p>
                        </div>
                        <Badge variant={completion >= 100 ? "success" : "purple"}>
                          {completion}%
                        </Badge>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
    </TeacherShell>
  );
}
