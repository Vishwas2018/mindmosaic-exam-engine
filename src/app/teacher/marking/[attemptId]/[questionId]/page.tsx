import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import {
  getStudentMembership,
  getStudentProfile,
  listTeacherClasses,
  requireTeacher,
} from "@/features/teacher/data";
import { EssayMarkForm } from "@/features/teacher/components/EssayMarkForm";
import { TeacherShell } from "@/features/teacher/components/TeacherShell";
import { listEssayMarks } from "@/features/teacher/marking-data";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getQuestionById } from "@/server/exam-bank";

export const metadata: Metadata = { title: "Mark response" };

const attemptRowSchema = z.object({
  id: z.uuid(),
  student_id: z.uuid(),
  submitted_at: z.string(),
  responses: z.unknown(),
  result: z.unknown(),
});

const resultSchema = z.object({
  questionDetails: z
    .array(
      z.object({
        questionId: z.string(),
        pendingManualReview: z.boolean(),
        availableMarks: z.number(),
      }),
    )
    .default([]),
});

export default async function MarkEssayPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string; questionId: string }>;
  searchParams: Promise<{ class?: string }>;
}) {
  const { attemptId, questionId } = await params;
  const { class: requestedClassId } = await searchParams;

  if (!isSupabaseConfigured) notFound();

  const teacher = await requireTeacher();
  const supabase = await createClient();

  /* RLS-scoped: an attempt outside the teacher's own classes reads as
     absent here, same as every other teacher read path. */
  const { data: attemptData } = await supabase
    .from("exam_attempts")
    .select("id, student_id, submitted_at, responses, result")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attemptData) notFound();
  const attempt = attemptRowSchema.parse(attemptData);

  const result = resultSchema.safeParse(attempt.result);
  const questionDetail = result.success
    ? result.data.questionDetails.find((detail) => detail.questionId === questionId)
    : undefined;
  if (!questionDetail || !questionDetail.pendingManualReview) notFound();

  const question = getQuestionById(questionId);
  if (!question || question.answerKey.kind !== "manual") notFound();

  const responses = z.record(z.string(), z.unknown()).safeParse(attempt.responses);
  const studentResponse = responses.success ? responses.data[questionId] : undefined;
  const responseText = typeof studentResponse === "string" ? studentResponse : "";

  const [classes, membership, student, existingMarks] = await Promise.all([
    listTeacherClasses(supabase),
    getStudentMembership(supabase, attempt.student_id),
    getStudentProfile(supabase, attempt.student_id),
    listEssayMarks(supabase, [attemptId]),
  ]);
  const existingMark = existingMarks.find((mark) => mark.questionId === questionId) ?? null;

  const activeClassId =
    requestedClassId ?? membership.find((m) => classes.some((c) => c.id === m.classId))?.classId ??
    classes[0]?.id ??
    null;

  return (
    <TeacherShell
      title="Mark response"
      activeNav="marking"
      classes={classes}
      activeClassId={activeClassId}
      teacherName={teacher.displayName}
    >
      <div className="space-y-6">
        {/*
          The step back up. This is the deepest route in the product
          (/teacher/marking/<attempt>/<question>) and it had no link out of
          itself at all: a teacher who finished marking one response could
          only re-enter through the shell's "Marking" nav item and find their
          place in the queue again. The shell nav is for moving between
          sections; this is for moving up one level, which is a different job.
        */}
        <Link
          href="/teacher/marking"
          data-testid="back-to-marking-queue"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          Back to marking queue
        </Link>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-base">
              {student?.displayName ?? "Unnamed student"}
            </CardTitle>
            <CardDescription>Question: {question.prompt}</CardDescription>
          </CardHeader>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-base">Rubric</CardTitle>
            <CardDescription className="whitespace-pre-wrap">
              {question.answerKey.rubric}
            </CardDescription>
          </CardHeader>
          {question.answerKey.sampleResponse && (
            <CardContent className="pt-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Sample response
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">
                {question.answerKey.sampleResponse}
              </p>
            </CardContent>
          )}
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-base">Student response</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="whitespace-pre-wrap text-sm leading-6 text-ink">
              {responseText || "(No response submitted.)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score</CardTitle>
            <CardDescription>
              Out of {questionDetail.availableMarks}{" "}
              {questionDetail.availableMarks === 1 ? "mark" : "marks"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <EssayMarkForm
              attemptId={attemptId}
              questionId={questionId}
              availableMarks={questionDetail.availableMarks}
              classId={activeClassId}
              initialAwardedMarks={existingMark?.awardedMarks ?? null}
              initialFeedback={existingMark?.feedback ?? null}
            />
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
