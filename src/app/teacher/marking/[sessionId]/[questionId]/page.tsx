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
import { listManualMarks } from "@/features/teacher/marking-data";
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

/** What a marker needs, assembled from whichever model created the sitting. */
interface MarkableResponse {
  readonly studentId: string;
  readonly prompt: string;
  /**
   * The authored marking rubric. Present only for a legacy sitting, whose
   * question is read from the compiled bank. A target sitting's rubric lives in
   * `item_answer_versions`, which no application-callable path reads (§17.1,
   * ADR-006 Amendment A/D2) — so it is absent rather than approximated, and the
   * screen says so rather than showing an empty panel.
   */
  readonly rubric: string | null;
  readonly sampleResponse: string | null;
  readonly responseText: string;
  readonly availableMarks: number;
}

export default async function MarkResponsePage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string; questionId: string }>;
  searchParams: Promise<{ class?: string }>;
}) {
  const { sessionId, questionId } = await params;
  const { class: requestedClassId } = await searchParams;

  if (!isSupabaseConfigured) notFound();

  const teacher = await requireTeacher();
  const supabase = await createClient();

  /* Which model created this sitting — the same question the marking route
     asks, through the same view, so the screen and the write cannot disagree
     about which path a mark takes. A sitting outside this teacher's classes is
     absent from the view entirely, which is the 404. */
  const { data: sitting } = await supabase
    .from("visible_sittings")
    .select("origin, session_id, attempt_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!sitting) notFound();

  const markable =
    sitting.origin === "version_pinned"
      ? await loadTargetResponse(supabase, sessionId, questionId)
      : await loadLegacyResponse(
          supabase,
          typeof sitting.attempt_id === "string" ? sitting.attempt_id : null,
          questionId,
        );
  if (!markable) notFound();

  const [classes, membership, student, existingMarks] = await Promise.all([
    listTeacherClasses(supabase),
    getStudentMembership(supabase, markable.studentId),
    getStudentProfile(supabase, markable.studentId),
    listManualMarks(supabase, [sessionId]),
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
          (/teacher/marking/<sitting>/<question>) and it had no link out of
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
            <CardDescription>Question: {markable.prompt}</CardDescription>
          </CardHeader>
        </Card>

        <Card variant="outlined">
          <CardHeader>
            <CardTitle className="text-base">Rubric</CardTitle>
            <CardDescription className="whitespace-pre-wrap">
              {markable.rubric ??
                "No rubric is available for this sitting. Mark against the question's own criteria."}
            </CardDescription>
          </CardHeader>
          {markable.sampleResponse && (
            <CardContent className="pt-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.06em] text-muted">
                Sample response
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted">
                {markable.sampleResponse}
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
              {markable.responseText || "(No response submitted.)"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score</CardTitle>
            <CardDescription>
              Out of {markable.availableMarks}{" "}
              {markable.availableMarks === 1 ? "mark" : "marks"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <EssayMarkForm
              sessionId={sessionId}
              questionId={questionId}
              availableMarks={markable.availableMarks}
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

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The legacy branch, unchanged: the attempt read is RLS-scoped, the question
 * comes from the compiled bank, and the ceiling comes from the attempt's own
 * server-computed result.
 */
async function loadLegacyResponse(
  supabase: Supabase,
  attemptId: string | null,
  questionId: string,
): Promise<MarkableResponse | null> {
  if (!attemptId) return null;

  const { data: attemptData } = await supabase
    .from("exam_attempts")
    .select("id, student_id, submitted_at, responses, result")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attemptData) return null;
  const attempt = attemptRowSchema.parse(attemptData);

  const result = resultSchema.safeParse(attempt.result);
  const questionDetail = result.success
    ? result.data.questionDetails.find((detail) => detail.questionId === questionId)
    : undefined;
  if (!questionDetail || !questionDetail.pendingManualReview) return null;

  const question = getQuestionById(questionId);
  if (!question || question.answerKey.kind !== "manual") return null;

  const responses = z.record(z.string(), z.unknown()).safeParse(attempt.responses);
  const studentResponse = responses.success ? responses.data[questionId] : undefined;

  return {
    studentId: attempt.student_id,
    prompt: question.prompt,
    rubric: question.answerKey.rubric,
    sampleResponse: question.answerKey.sampleResponse ?? null,
    responseText: typeof studentResponse === "string" ? studentResponse : "",
    availableMarks: questionDetail.availableMarks,
  };
}

/**
 * The target branch. One definer call, because `session_responses` is not
 * teacher-readable and must not become so: the child's answer reaches the marker
 * through `get_manual_review_response`, which applies the same
 * teacher-of-student gate the write does and returns nothing from the answer
 * table — including the rubric, which lives there.
 *
 * The prompt comes back from the pinned item version rather than from the
 * compiled bank, so a marker sees the revision the child actually sat even if
 * the question has since been revised.
 */
async function loadTargetResponse(
  supabase: Supabase,
  sessionId: string,
  questionId: string,
): Promise<MarkableResponse | null> {
  const { data: question } = await supabase
    .from("visible_sitting_questions")
    .select("session_item_id")
    .eq("session_id", sessionId)
    .eq("question_key", questionId)
    .eq("pending_manual", true)
    .maybeSingle();
  if (!question?.session_item_id) return null;

  const { data, error } = await supabase.rpc("get_manual_review_response", {
    p_session_id: sessionId,
    p_session_item_id: question.session_item_id,
  });
  if (error || !data) return null;

  const body = data as {
    studentId?: unknown;
    prompt?: unknown;
    marksAvailable?: unknown;
    responseValue?: unknown;
  };

  return {
    studentId: String(body.studentId),
    prompt: String(body.prompt),
    /* Absent, not empty. See MarkableResponse.rubric. */
    rubric: null,
    sampleResponse: null,
    responseText: typeof body.responseValue === "string" ? body.responseValue : "",
    availableMarks: Number(body.marksAvailable ?? 0),
  };
}
