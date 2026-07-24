import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { recordEssayMarkRequestSchema } from "@/features/teacher/marking-contract";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const attemptResultSchema = z.object({
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

/**
 * Records (or revises) a mark for one manual-review response. Runs as the
 * signed-in teacher: the attempt read below is itself RLS-scoped ("exam_attempts:
 * teacher reads own class students"), so a foreign student's attempt id reads
 * as not_found rather than forbidden. The essay_marks upsert is re-checked
 * independently by its own RLS policies (docs/DATA_MODEL_AND_ROLES.md-style
 * is_teacher_of_student gate) — this route's checks exist for clear error
 * codes, not as the security boundary.
 *
 * availableMarks is never taken from the client: it is read back out of the
 * attempt's own server-computed result so a request can never raise its own
 * ceiling.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const originCheck = checkOrigin(request);
  if (!originCheck.ok) {
    return originCheck.response;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "teacher") {
    return NextResponse.json({ error: "teachers_only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recordEssayMarkRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { attemptId, questionId, awardedMarks, feedback } = parsed.data;

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, result")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) {
    return NextResponse.json({ error: "attempt_not_found" }, { status: 404 });
  }

  const result = attemptResultSchema.safeParse(attempt.result);
  const questionDetail = result.success
    ? result.data.questionDetails.find((detail) => detail.questionId === questionId)
    : undefined;
  if (!questionDetail || !questionDetail.pendingManualReview) {
    return NextResponse.json({ error: "not_a_manual_review_question" }, { status: 422 });
  }
  if (awardedMarks > questionDetail.availableMarks) {
    return NextResponse.json({ error: "awarded_marks_exceed_available" }, { status: 422 });
  }

  const { error: upsertError } = await supabase.from("essay_marks").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      marked_by: user.id,
      awarded_marks: awardedMarks,
      max_marks: questionDetail.availableMarks,
      feedback: feedback ?? null,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id,question_id" },
  );
  if (upsertError) {
    return NextResponse.json({ error: "mark_not_recorded" }, { status: 500 });
  }

  return NextResponse.json(
    {
      attemptId,
      questionId,
      awardedMarks,
      maxMarks: questionDetail.availableMarks,
    },
    { status: 200 },
  );
}
