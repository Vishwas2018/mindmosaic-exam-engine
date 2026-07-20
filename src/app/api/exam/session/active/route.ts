import { NextResponse } from "next/server";

import type { ActiveSessionResponse } from "@/features/exam-engine/scoring/server-scoring-contract";
import {
  examBankIdSchema,
  examSelectionConfigSchema,
} from "@/features/exam-engine/scoring/server-scoring-contract";
import { durationSecondsFor } from "@/features/exam-engine/selection";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

/**
 * Resume lookup for a signed-in student: "what, if anything, is my active
 * exam session?" A browser refresh wipes the client's in-memory session
 * id along with everything else in the Zustand store, so resume cannot
 * start from a known session id the way autosave/submit do — it has to
 * start here. Returns the most recently created, not-yet-expired,
 * not-yet-submitted session, reconstructed from the server's own stored
 * selection plus whatever the debounced autosave last recorded (both
 * server-side, never trusted from anything the client might still hold).
 */
export async function GET(): Promise<NextResponse> {
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

  const nowIso = new Date().toISOString();
  /* Most recent unexpired session for this student. If more than one is
     somehow still open (e.g. two tabs), the most recent is the one worth
     resuming; an older abandoned one is simply not offered. */
  const { data: session } = await supabase
    .from("exam_sessions")
    .select("id, config, selected_question_ids, created_at, expires_at")
    .eq("student_id", user.id)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!session) {
    return NextResponse.json({ error: "no_active_session" }, { status: 404 });
  }

  /* Already submitted — nothing to resume; the student should start a new
     exam, not reopen a settled one. */
  const { data: existingAttempt } = await supabase
    .from("exam_attempts")
    .select("id")
    .eq("session_id", session.id)
    .maybeSingle();
  if (existingAttempt) {
    return NextResponse.json({ error: "no_active_session" }, { status: 404 });
  }

  const config = examSelectionConfigSchema.safeParse(session.config);
  const bankId = examBankIdSchema.safeParse(
    (session.config as Record<string, unknown> | null)?.bankId,
  );
  if (!config.success || !bankId.success) {
    return NextResponse.json({ error: "corrupt_session" }, { status: 500 });
  }

  /* Recompute the authoring questions from the server's own stored ids,
     order preserved — same pattern as the submit route. */
  const bank = getExamBank(bankId.data);
  const byId = new Map(bank.map((question) => [question.id, question]));
  const questions = (session.selected_question_ids as string[]).map((questionId) =>
    byId.get(questionId),
  );
  if (questions.some((question) => question === undefined)) {
    return NextResponse.json({ error: "corrupt_session" }, { status: 500 });
  }
  const authoringQuestions = questions as NonNullable<(typeof questions)[number]>[];

  const { data: autosave } = await supabase
    .from("exam_responses")
    .select("responses, current_question_index, flagged_question_ids")
    .eq("session_id", session.id)
    .maybeSingle();

  const durationSeconds =
    config.data.timing === "timed"
      ? durationSecondsFor(config.data.questionCount, authoringQuestions)
      : null;

  const payload: ActiveSessionResponse = {
    sessionId: session.id,
    bankId: bankId.data,
    config: config.data,
    questions: toCandidateQuestions(authoringQuestions),
    responses: (autosave?.responses as Record<string, unknown> | undefined) ?? {},
    currentQuestionIndex: autosave?.current_question_index ?? 0,
    flaggedQuestionIds: autosave?.flagged_question_ids ?? [],
    startedAt: session.created_at,
    durationSeconds,
  };
  return NextResponse.json(payload);
}
