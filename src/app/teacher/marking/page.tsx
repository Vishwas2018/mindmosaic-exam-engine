import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, PenLine } from "lucide-react";

import { Badge, buttonClasses, Card, EmptyState } from "@/components/ui";
import { getClassRoster } from "@/features/teacher/data";
import { formatShortDate } from "@/features/teacher/format";
import { loadTeacherPageContext } from "@/features/teacher/load-context";
import { listEssayMarks, listManualReviewAttempts } from "@/features/teacher/marking-data";
import { deriveMarkingQueue, type MarkingQueueItem } from "@/features/teacher/marking-queue";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";

export const metadata: Metadata = { title: "Marking" };

function PendingRow({
  item,
  studentName,
  classId,
}: {
  item: MarkingQueueItem;
  studentName: string;
  classId: string;
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{studentName}</p>
        <p className="text-xs text-muted">
          {item.questionId} · Submitted {formatShortDate(item.submittedAt)} ·{" "}
          {item.availableMarks} {item.availableMarks === 1 ? "mark" : "marks"} available
        </p>
      </div>
      <Link
        href={`/teacher/marking/${item.attemptId}/${item.questionId}?class=${classId}`}
        className={buttonClasses({ variant: "primary", size: "sm" })}
      >
        Mark
      </Link>
    </li>
  );
}

function MarkedRow({ item, studentName }: { item: MarkingQueueItem; studentName: string }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">{studentName}</p>
        <p className="text-xs text-muted">
          {item.questionId} · Submitted {formatShortDate(item.submittedAt)}
        </p>
      </div>
      <Badge variant="success">
        {item.awardedMarks}/{item.availableMarks} marks
      </Badge>
    </li>
  );
}

export default async function TeacherMarkingPage({
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
        title="Marking"
        activeNav="marking"
        classes={classes}
        activeClassId={null}
        teacherName={teacher.displayName}
      >
        <EmptyState
          title="No classes yet"
          description="Manual-review responses appear here once your classes are set up and students have submitted essay-style questions."
          icon={<PenLine aria-hidden="true" className="h-6 w-6" />}
        />
      </TeacherShell>
    );
  }

  const roster = await getClassRoster(supabase, activeClass.id);
  const studentIds = roster.map((student) => student.studentId);
  const nameFor = new Map(
    roster.map((student) => [student.studentId, student.displayName ?? "Unnamed student"]),
  );

  const attempts = await listManualReviewAttempts(supabase, studentIds);
  const marks = await listEssayMarks(
    supabase,
    attempts.map((attempt) => attempt.id),
  );
  const queue = deriveMarkingQueue(attempts, marks);

  const pending = queue.flatMap((attempt) =>
    attempt.items.filter((item) => item.status === "pending"),
  );
  const marked = queue.flatMap((attempt) =>
    attempt.items.filter((item) => item.status === "marked"),
  );

  return (
    <TeacherShell
      title="Marking"
      activeNav="marking"
      classes={classes}
      activeClassId={activeClass.id}
      teacherName={teacher.displayName}
    >
      {pending.length === 0 && marked.length === 0 ? (
        <EmptyState
          title="Nothing to mark"
          description="Essay and other manual-review responses from this class will appear here once submitted."
          icon={<FileCheck2 aria-hidden="true" className="h-6 w-6" />}
        />
      ) : (
        <div className="space-y-8">
          <section aria-label="Needs marking" className="space-y-3">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
              Needs marking ({pending.length})
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm leading-6 text-muted">
                Nothing outstanding — every manual-review response has been marked.
              </p>
            ) : (
              <Card className="divide-y divide-royal/5 p-0">
                <ul className="divide-y divide-royal/5">
                  {pending.map((item) => (
                    <PendingRow
                      key={`${item.attemptId}:${item.questionId}`}
                      item={item}
                      studentName={nameFor.get(item.studentId) ?? "Student no longer in class"}
                      classId={activeClass.id}
                    />
                  ))}
                </ul>
              </Card>
            )}
          </section>

          {marked.length > 0 && (
            <section aria-label="Already marked" className="space-y-3">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Marked ({marked.length})
              </h2>
              <Card className="divide-y divide-royal/5 p-0">
                <ul className="divide-y divide-royal/5">
                  {marked.map((item) => (
                    <MarkedRow
                      key={`${item.attemptId}:${item.questionId}`}
                      item={item}
                      studentName={nameFor.get(item.studentId) ?? "Student no longer in class"}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </div>
      )}
    </TeacherShell>
  );
}
