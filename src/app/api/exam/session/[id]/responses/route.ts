import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import { autosaveRequestSchema } from "@/features/exam-engine/scoring/server-scoring-contract";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Debounced in-progress answer autosave (feature objective: a browser
 * refresh mid-exam must not lose in-progress responses for a signed-in
 * student — session + final result already persist server-side, this is
 * the missing middle). The client calls this after a quiet period
 * following a change (see exam-store.ts / autosave.ts), never on every
 * keystroke.
 *
 * Only ever receives and stores candidate responses — the same shape the
 * exam UI already collects — never a question or an answer key. See
 * docs/ASSESSMENT_SECURITY_MODEL.md: nothing here crosses the
 * candidate/authoring boundary.
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
  const parsed = autosaveRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { id: sessionId } = await params;
  /* RLS already scopes reads to the caller's own rows; the explicit
     student check below rejects e.g. a stray autosave against a session
     id that resolves to nothing (row simply won't be found) or, in
     principle, another user's id (RLS would already return no row). */
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, student_id, expires_at")
    .eq("id", sessionId)
    .single();
  if (!session || session.student_id !== user.id) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  if (Date.now() > Date.parse(session.expires_at)) {
    return NextResponse.json({ error: "session_expired" }, { status: 410 });
  }

  /* An already-submitted session has nothing left to autosave for — the
     final responses are already recorded in exam_attempts. Rejecting
     rather than silently upserting stops a late, in-flight debounce call
     from writing over a settled attempt's autosave row. */
  const { data: existingAttempt } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("session_id", session.id)
    .maybeSingle();
  if (existingAttempt) {
    return NextResponse.json({ error: "already_submitted" }, { status: 409 });
  }

  const { responses, currentQuestionIndex, flaggedQuestionIds } = parsed.data;
  const { error } = await supabase.from("exam_responses").upsert(
    {
      session_id: session.id,
      student_id: user.id,
      responses,
      current_question_index: currentQuestionIndex,
      flagged_question_ids: flaggedQuestionIds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "session_id" },
  );
  if (error) {
    return NextResponse.json({ error: "autosave_failed" }, { status: 500 });
  }

  return NextResponse.json({ savedAt: new Date().toISOString() });
}
