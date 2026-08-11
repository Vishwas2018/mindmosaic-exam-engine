import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { buildExamResult } from "@/features/exam-engine/scoring";
import {
  examBankIdSchema,
  examSelectionConfigSchema,
  submitSessionRequestSchema,
} from "@/features/exam-engine/scoring/server-scoring-contract";
import { durationSecondsFor } from "@/features/exam-engine/selection";
import type { ExamResponses } from "@/features/exam-engine/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

/**
 * Scores a submitted exam session server-side and records the attempt
 * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum). The questions are
 * recomputed from the session's stored selected_question_ids against the
 * server-only bank and scored with the existing pure buildExamResult —
 * nothing the client sends can change how its attempt is scored, and the
 * client never receives an answer key before this response.
 *
 * MM-AUD-SEC-001: the attempt is written by the SECURITY DEFINER function
 * public.record_exam_attempt (see
 * supabase/migrations/20260811090000_exam_write_rpcs.sql), not by an insert
 * through the caller's own JWT. `authenticated` no longer holds INSERT on
 * exam_attempts (20260811091000): the old insert policy constrained only
 * ownership and left `result` — the score itself — unconstrained, so a
 * student could write a finished, full-marks attempt straight over
 * PostgREST without sitting anything. Routing the write through the
 * function makes the buildExamResult() call below the only origin a
 * `result` can have.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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

  const body = await request.json().catch(() => null);
  const parsed = submitSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { id: sessionId } = await params;
  /* RLS already scopes reads to the caller's own (or linked) rows; the
     explicit student check below rejects e.g. a parent poking at a linked
     child's session id. */
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, student_id, config, seed, selected_question_ids, created_at, expires_at")
    .eq("id", sessionId)
    .single();
  if (!session || session.student_id !== user.id) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  const now = Date.now();
  if (now > Date.parse(session.expires_at)) {
    return NextResponse.json({ error: "session_expired" }, { status: 410 });
  }

  const { data: existingAttempt } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("session_id", session.id)
    .maybeSingle();
  if (existingAttempt) {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 });
  }

  const config = examSelectionConfigSchema.safeParse(session.config);
  const bankId = examBankIdSchema.safeParse(
    (session.config as Record<string, unknown> | null)?.bankId,
  );
  if (!config.success || !bankId.success) {
    return NextResponse.json({ error: "corrupt_session" }, { status: 500 });
  }

  /* Recompute the authoring questions from the server's own stored ids —
     order preserved — never from anything the client sent. */
  const bank = getExamBank(bankId.data);
  const byId = new Map(bank.map((question) => [question.id, question]));
  const questions = (session.selected_question_ids as string[]).map((questionId) =>
    byId.get(questionId),
  );
  if (questions.some((question) => question === undefined)) {
    return NextResponse.json({ error: "corrupt_session" }, { status: 500 });
  }
  const authoringQuestions = questions as NonNullable<(typeof questions)[number]>[];

  /*
   * Server timestamps are authoritative: startedAt is the session's
   * creation time and a submission past the timed deadline is clamped to
   * it and recorded as timer_expired, mirroring the client store's own
   * deadline rules.
   */
  const startedAt = Date.parse(session.created_at);
  const durationSeconds =
    config.data.timing === "timed"
      ? durationSecondsFor(config.data.questionCount, authoringQuestions)
      : null;
  const deadlineAt = durationSeconds === null ? null : startedAt + durationSeconds * 1000;
  const expired = deadlineAt !== null && now > deadlineAt;
  const submittedAt = expired ? deadlineAt : now;
  const submissionReason = expired ? "timer_expired" : parsed.data.submissionReason;

  let result;
  try {
    result = buildExamResult(authoringQuestions, parsed.data.responses as ExamResponses, {
      startedAt,
      submittedAt,
      submissionReason,
    });
  } catch {
    return NextResponse.json({ error: "invalid_responses" }, { status: 400 });
  }

  /* student_id is not passed: record_exam_attempt takes it from auth.uid()
     and re-derives session ownership and expiry itself, so the checks above
     are the clear-error path and the function is the boundary. */
  const { error } = await supabase.rpc("record_exam_attempt", {
    p_session_id: session.id,
    p_responses: parsed.data.responses,
    p_result: result,
  });
  if (error) {
    /* MM-SEC-02: the maybeSingle() pre-check above is only a fast path —
       a concurrent submit for this same session can insert its own
       attempt row between that check and this insert. The unique
       constraint on exam_attempts.session_id (see the accompanying
       migration) is the real guarantee; a unique-violation here means
       this request lost that race, so it gets the same idempotent 409
       the pre-check returns, never a 500. The function deliberately does
       not catch 23505, so it still surfaces here unchanged. */
    if (error.code === "23505") {
      return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    }
    /* The function's own ownership/expiry gates. Both are already checked
       above against the same row, so these fire only if the state changed
       mid-request — mapped to the same statuses those checks return so a
       race is indistinguishable to the client from losing it earlier. */
    if (error.code === "MM003") {
      return NextResponse.json({ error: "session_not_found" }, { status: 404 });
    }
    if (error.code === "MM004") {
      return NextResponse.json({ error: "session_expired" }, { status: 410 });
    }
    return NextResponse.json({ error: "attempt_not_recorded" }, { status: 500 });
  }

  /* Full questions ride back only now, after the attempt is recorded —
     the one sanctioned reveal (ReviewQuestion) so the review screen can
     show correct answers and explanations. */
  return NextResponse.json({ result, reviewQuestions: authoringQuestions });
}
