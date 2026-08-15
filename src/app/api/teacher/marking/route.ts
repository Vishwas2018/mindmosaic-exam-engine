import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { recordManualMarkRequestSchema } from "@/features/teacher/marking-contract";
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
 * Records (or revises) a mark for one manual-review response, on either storage
 * model.
 *
 * THE REQUEST NAMES A SITTING, and the route resolves which model created it
 * (§12.7 step 7's rule, through the one place it lives). That decision is made
 * here and nowhere else: the queue, the deep link and the form all speak session
 * ids, so nothing upstream of this file has to know that two write paths exist.
 *
 *   legacy         → the `essay_marks` upsert this route has always done,
 *                    unchanged, against the sitting's own attempt. RLS
 *                    ("is_teacher_of_student" on the attempt) is the boundary;
 *                    the checks here exist for clear error codes.
 *   version_pinned → `record_manual_mark`, a SECURITY DEFINER function that
 *                    re-derives the teacher, the ceiling and the student
 *                    itself. `manual_marks` grants no INSERT to anyone, so
 *                    there is no direct path for this branch to take.
 *
 * availableMarks is never taken from the client on either branch: legacy reads
 * it back out of the attempt's own server-computed result, and the target
 * branch does not send it at all — the function reads it from the item version
 * the sitting pinned (§14.1).
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
  const parsed = recordManualMarkRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { sessionId, questionId, awardedMarks, feedback } = parsed.data;

  /* One question of the resolution view: which model created this sitting, and
     is it one this teacher may see at all. A sitting outside their classes is
     simply absent here — the view carries the same teacher predicate the base
     policies do — so "not mine" and "no such sitting" give the same 404. */
  const { data: sitting } = await supabase
    .from("visible_sittings")
    .select("origin, session_id, attempt_id")
    .eq("session_id", sessionId)
    .maybeSingle();
  if (!sitting) {
    return NextResponse.json({ error: "sitting_not_found" }, { status: 404 });
  }

  return sitting.origin === "version_pinned"
    ? markTargetSitting(supabase, sessionId, questionId, awardedMarks, feedback ?? null)
    : markLegacySitting(
        supabase,
        sessionId,
        typeof sitting.attempt_id === "string" ? sitting.attempt_id : null,
        questionId,
        awardedMarks,
        feedback ?? null,
        user.id,
      );
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * The target branch. The route looks the served item up so it can answer 404 or
 * 422 precisely; the function re-derives every one of these facts for itself and
 * is the boundary.
 */
async function markTargetSitting(
  supabase: Supabase,
  sessionId: string,
  questionId: string,
  awardedMarks: number,
  feedback: string | null,
): Promise<NextResponse> {
  /* `question_key` is the item code on this side of the union, which is the
     same identifier space the legacy question id lives in — the projection set
     `items.item_code` from the authored question's id. `session_item_id` is
     what the write is keyed by. */
  const { data: question } = await supabase
    .from("visible_sitting_questions")
    .select("session_item_id, available_marks")
    .eq("session_id", sessionId)
    .eq("question_key", questionId)
    .eq("pending_manual", true)
    .maybeSingle();
  if (!question?.session_item_id) {
    return NextResponse.json({ error: "not_a_manual_review_question" }, { status: 422 });
  }

  const { data, error } = await supabase.rpc("record_manual_mark", {
    p_session_id: sessionId,
    p_session_item_id: question.session_item_id,
    p_awarded_marks: awardedMarks,
    p_feedback: feedback,
  });
  if (error) {
    /* MM217 covers absent, legacy-origin and not-mine with one answer, on
       purpose — the function does not distinguish them and neither does this. */
    if (error.code === "MM217") {
      return NextResponse.json({ error: "sitting_not_found" }, { status: 404 });
    }
    if (error.code === "MM218") {
      return NextResponse.json({ error: "not_a_manual_review_question" }, { status: 422 });
    }
    if (error.code === "MM219") {
      return NextResponse.json({ error: "awarded_marks_exceed_available" }, { status: 422 });
    }
    return NextResponse.json({ error: "mark_not_recorded" }, { status: 500 });
  }

  const recorded = data as { maxMarks?: number } | null;
  return NextResponse.json(
    {
      sessionId,
      questionId,
      awardedMarks,
      maxMarks: Number(recorded?.maxMarks ?? question.available_marks ?? 0),
    },
    { status: 200 },
  );
}

/**
 * The legacy branch, unchanged from what this route has always done — same
 * table, same checks, same ceiling from the attempt's own stored result. Only
 * the way the attempt is reached changed: through the sitting rather than from
 * the request, because the request no longer carries an attempt id.
 */
async function markLegacySitting(
  supabase: Supabase,
  sessionId: string,
  attemptId: string | null,
  questionId: string,
  awardedMarks: number,
  feedback: string | null,
  markedBy: string,
): Promise<NextResponse> {
  if (!attemptId) {
    /* A legacy sitting with no attempt has not been submitted, so nothing on it
       has been flagged for review. */
    return NextResponse.json({ error: "sitting_not_found" }, { status: 404 });
  }

  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("id, result")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) {
    return NextResponse.json({ error: "sitting_not_found" }, { status: 404 });
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
      marked_by: markedBy,
      awarded_marks: awardedMarks,
      max_marks: questionDetail.availableMarks,
      feedback,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id,question_id" },
  );
  if (upsertError) {
    return NextResponse.json({ error: "mark_not_recorded" }, { status: 500 });
  }

  return NextResponse.json(
    {
      sessionId,
      questionId,
      awardedMarks,
      maxMarks: questionDetail.availableMarks,
    },
    { status: 200 },
  );
}
