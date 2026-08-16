import { NextResponse } from "next/server";

import { checkOrigin } from "@/features/auth/require-origin";
import {
  getExamPattern,
  patternExamConfig,
  selectPatternQuestions,
  sessionDurationSeconds,
} from "@/features/exam-engine/exam-patterns";
import { createSessionRequestSchema } from "@/features/exam-engine/scoring/server-scoring-contract";
import { selectExamQuestions, type ExamSelectionConfig } from "@/features/exam-engine/selection";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createTargetSession } from "@/server/assessment/target-session-writes";
import { resolveSessionStorageModel } from "@/server/assessment/storage-model";
import { getExamBank } from "@/server/exam-bank";

/**
 * Creates a server-selected exam session for a signed-in student
 * (docs/ASSESSMENT_SECURITY_MODEL.md, Phase 0 addendum). Runs the same
 * deterministic selection as the client, against the server-only bank,
 * persists the chosen question ids to exam_sessions (never
 * client-supplied), and returns only answer-stripped CandidateQuestions.
 * Guests never call this endpoint — their practice stays local.
 *
 * MM-AUTH-01: every profile role has an auth.users row and therefore
 * *could* insert an exam_sessions row with student_id = their own id — the
 * RLS insert policy ("exam_sessions: student creates own") only ever
 * checked ownership (student_id = auth.uid()), never role, so a teacher or
 * parent calling this endpoint used to get a genuine session recorded
 * under their own id. The explicit role === "student" check below is the
 * fix. See tests/rls/exam-attempts.test.ts (MM-AUTH-01 cases) and
 * src/tests/unit/exam-session-create-route.test.ts.
 *
 * MM-AUD-SEC-001: the session row is written by the SECURITY DEFINER
 * function public.create_exam_session (see
 * supabase/migrations/20260811090000_exam_write_rpcs.sql), not by an
 * insert through the caller's own JWT. `authenticated` no longer holds
 * INSERT on exam_sessions at all (20260811091000), because the policy that
 * used to guard it could only constrain WHO the row belonged to — never
 * that selected_question_ids was the server's own selection rather than a
 * paper the student picked for themselves over PostgREST. The role check
 * below still runs first so a non-student gets a clear 403; the function
 * re-checks it independently (SQLSTATE MM002) as the actual boundary.
 */

/* Submission grace beyond the timed deadline; late submissions are clamped
   and recorded as timer_expired, not rejected, within this window. */
const TIMED_GRACE_SECONDS = 5 * 60;
const UNTIMED_LIFETIME_SECONDS = 24 * 60 * 60;

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

  const body = await request.json().catch(() => null);
  const parsed = createSessionRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const { patternId, asPracticeModule, form, formCount, bankId, idempotencyKey } = parsed.data;

  /* MM-AUTH-01: only a genuine student may create an exam session — a
     parent or teacher signed in under their own account is not the
     student the session would be recorded for. Every real student profile
     reaches this point already parent-provisioned (see
     ./features/auth/provision-child.ts / roles.ts), so "student" is the
     complete set of authorised identities; nothing else is a student
     acting on their own behalf. */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") {
    return NextResponse.json({ error: "students_only" }, { status: 403 });
  }

  /* Spec §12.7 step 6: a server-side flag chooses the storage model for a NEWLY
     created session, and only for a new one. The answer comes from the database
     (ADR-006 Amendment C) so this route and `create_assessment_session` cannot
     disagree — the RPC asks the same predicate and refuses an out-of-cohort
     caller itself, which is what makes the gate hold for a client calling it
     directly over PostgREST rather than only for requests that come through
     here.

     The cohort is empty and the flag is off, so this resolves to "legacy" for
     everyone today and the block below is unreachable in practice. It is here
     rather than deferred because the decision belongs at creation, and because
     wiring it now is what makes the mechanism testable before a real learner
     depends on it. */
  const storageModel = await resolveSessionStorageModel(supabase);
  if (storageModel === "version_pinned") {
    /* THE STEP 7 SEAM, closed (Gate A item A9). Read dispatch (steps 7/8) and
       the target write RPCs (A1-A3, A10-A13) are done and tested, so a
       target-cohort caller now gets a real, server-selected paper on the
       target model instead of the placeholder refusal this branch used to
       return unconditionally. The cohort stays empty and this flag stays off
       (ADR-006 Amendment C5) — nothing about closing this seam opens one; it
       only makes the mechanism reachable once someone deliberately does. */
    const created = await createTargetSession(supabase, {
      config: patternId === undefined ? parsed.data.config : undefined,
      patternId,
      /* A server-generated fallback when the caller sends none, so an
         un-updated client still gets a working (if not retry-safe) create
         rather than a 400. Wiring the client to generate and persist its own
         key across a retry is unchanged by this route and is not done here —
         see server-scoring-contract.ts's note on the field. */
      idempotencyKey: idempotencyKey ?? crypto.randomUUID(),
    });

    switch (created.kind) {
      case "ok":
        return NextResponse.json({ sessionId: created.sessionId, questions: created.questions });
      case "no_eligible_content":
        return NextResponse.json(
          { error: "insufficient_questions", eligibleCount: 0, requestedCount: 0 },
          { status: 422 },
        );
      case "pattern_not_supported":
        /* Exam-simulation papers have no target-model equivalent yet
           (create_assessment_session is deliberately blueprint-blind,
           20260812120000). Named rather than silently falling back to
           legacy, which would make "this student is on the target model"
           stop being true for one request only. */
        return NextResponse.json({ error: "pattern_not_supported_on_target_model" }, { status: 422 });
      case "idempotency_conflict":
        return NextResponse.json({ error: "idempotency_key_reused" }, { status: 409 });
      case "corrupt":
        return NextResponse.json({ error: "session_not_created" }, { status: 500 });
    }
  }

  /* Server-chosen, never client-supplied: the client cannot pick or
     predict its own question selection for a signed-in session. */
  const seed = crypto.randomUUID();
  const bank = getExamBank(bankId);

  let config: ExamSelectionConfig;
  let selectedQuestions: readonly AuthoringQuestion[];

  if (patternId !== undefined) {
    /* A full-length practice paper. The paper's shape comes from the
       server's own copy of the registry, so the only thing the request
       decides is WHICH pattern — never how many questions or how long. */
    const pattern = getExamPattern(patternId);
    if (!pattern) {
      return NextResponse.json({ error: "unknown_pattern" }, { status: 404 });
    }
    /* Deferred patterns (the writing tasks) are listed in the picker and are
       never startable, whatever a client asks for. */
    if (pattern.status !== "available") {
      return NextResponse.json({ error: "pattern_deferred" }, { status: 422 });
    }
    const selection = selectPatternQuestions(bank, pattern, seed, {
      asPracticeModule,
      form,
      formCount,
    });
    if (!selection.ok) {
      return NextResponse.json(
        {
          error: "insufficient_questions",
          eligibleCount: selection.availableCount,
          requestedCount: selection.requestedCount,
        },
        { status: 422 },
      );
    }
    selectedQuestions = selection.questions;
    config = patternExamConfig(pattern, selection.questions.length, selection.reduced);
  } else {
    /* parsed.data guarantees exactly one of config/patternId is present. */
    config = parsed.data.config!;
    const selection = selectExamQuestions(bank, config, seed);
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
    selectedQuestions = selection.questions;
  }

  const durationSeconds = sessionDurationSeconds(config, selectedQuestions);
  const lifetimeSeconds =
    durationSeconds === null
      ? UNTIMED_LIFETIME_SECONDS
      : durationSeconds + TIMED_GRACE_SECONDS;
  const expiresAt = new Date(Date.now() + lifetimeSeconds * 1000);

  /* student_id is not passed: create_exam_session takes it from auth.uid()
     inside the database, so this route cannot record a session against
     anyone but the caller even if it wanted to. Returns the new id. */
  const { data: sessionId, error } = await supabase.rpc("create_exam_session", {
    p_config: { ...config, bankId },
    p_seed: seed,
    p_selected_question_ids: selectedQuestions.map((question) => question.id),
    p_expires_at: expiresAt.toISOString(),
  });
  if (error || !sessionId) {
    /* MM002 is the function's own role gate firing. The profile check above
       should have caught it already, so reaching here means the two
       disagreed (e.g. the role changed mid-request) — surface the same
       403 the client knows how to handle rather than a generic 500. */
    if (error?.code === "MM002") {
      return NextResponse.json({ error: "students_only" }, { status: 403 });
    }
    return NextResponse.json({ error: "session_not_created" }, { status: 500 });
  }

  return NextResponse.json({
    sessionId,
    questions: toCandidateQuestions(selectedQuestions),
  });
}
