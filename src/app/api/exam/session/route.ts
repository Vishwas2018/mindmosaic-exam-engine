import { NextResponse } from "next/server";

import { createSessionRequestSchema } from "@/features/exam-engine/scoring/server-scoring-contract";
import { durationSecondsFor, selectExamQuestions } from "@/features/exam-engine/selection";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

/**
 * Creates a server-selected exam session for a signed-in student
 * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum). Runs the same
 * deterministic selection as the client, against the server-only bank,
 * persists the chosen question ids to exam_sessions (never
 * client-supplied), and returns only answer-stripped CandidateQuestions.
 * Guests never call this endpoint — their practice stays local.
 */

/* Submission grace beyond the timed deadline; late submissions are clamped
   and recorded as timer_expired, not rejected, within this window. */
const TIMED_GRACE_SECONDS = 5 * 60;
const UNTIMED_LIFETIME_SECONDS = 24 * 60 * 60;

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { config, bankId, seed: requestedSeed } = parsed.data;

  /* Server sessions belong to students; other roles read results, they
     don't sit exams. RLS would still scope the row — this is the clearer
     error for a mis-wired client. */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") {
    return NextResponse.json({ error: "students_only" }, { status: 403 });
  }

  const seed = requestedSeed ?? crypto.randomUUID();
  const selection = selectExamQuestions(getExamBank(bankId), config, seed);
  if (!selection.ok) {
    return NextResponse.json(
      {
        error: "insufficient_questions",
        eligibleCount: selection.eligibleCount,
        requestedCount: selection.requestedCount,
      },
      { status: 422 },
    );
  }

  const durationSeconds =
    config.timing === "timed"
      ? durationSecondsFor(config.questionCount, selection.questions)
      : null;
  const lifetimeSeconds =
    durationSeconds === null
      ? UNTIMED_LIFETIME_SECONDS
      : durationSeconds + TIMED_GRACE_SECONDS;
  const expiresAt = new Date(Date.now() + lifetimeSeconds * 1000);

  const { data: session, error } = await supabase
    .from("exam_sessions")
    .insert({
      student_id: user.id,
      config: { ...config, bankId },
      seed,
      selected_question_ids: selection.questions.map((question) => question.id),
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();
  if (error || !session) {
    return NextResponse.json({ error: "session_not_created" }, { status: 500 });
  }

  return NextResponse.json({
    sessionId: session.id,
    questions: toCandidateQuestions(selection.questions),
  });
}
