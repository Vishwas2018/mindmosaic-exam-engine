import { NextResponse } from "next/server";
import { z } from "zod";
import { checkOrigin } from "@/features/auth/require-origin";
import { buildExamResult } from "@/features/exam-engine/scoring";
import type { ExamResponses } from "@/features/exam-engine/types";
import { selectDiagnosticQuestions } from "@/features/student/onboarding/diagnostic-selector";
import { buildDiagnosticBaseline } from "@/features/student/onboarding/baseline-contract";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

export const dynamic = "force-dynamic";

const completeOnboardingSchema = z.object({
  yearLevel: z.union([z.literal(3), z.literal(5)]),
  interests: z.array(z.string().trim().max(100)).max(20).optional().default([]),
  weeklyGoalMinutes: z.number().int().min(15).max(600).optional().default(60),
  responses: z.record(z.string(), z.unknown()).default({}),
  startedAt: z.number().int().positive().optional(),
});

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
  const parsed = completeOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { yearLevel, interests, weeklyGoalMinutes, responses, startedAt: clientStartedAt } =
    parsed.data;

  // Verify student role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "student") {
    return NextResponse.json({ error: "students_only" }, { status: 403 });
  }

  // Authoritative selection from published bank
  const publishedBank = getExamBank("published");
  const selection = selectDiagnosticQuestions(publishedBank, yearLevel);

  if (!selection.ok) {
    return NextResponse.json(
      { error: selection.reason, message: selection.message },
      { status: 500 },
    );
  }

  const authoringQuestions = selection.questions;
  const now = Date.now();
  const startedAt = clientStartedAt && clientStartedAt <= now ? clientStartedAt : now - 60000;
  const submittedAt = now;

  // Score responses via pure scoring engine
  const result = buildExamResult(
    authoringQuestions,
    responses as ExamResponses,
    {
      startedAt,
      submittedAt,
      submissionReason: "user_submitted",
    },
  );

  // Generate the canonical baseline report (G3)
  const baselineReport = buildDiagnosticBaseline(
    result,
    authoringQuestions,
    user.id,
    yearLevel,
  );

  // Server-authoritative exam session config
  const sessionConfig = {
    examStyle: "naplan_style",
    subject: "mixed",
    yearLevel,
    questionCount: 5,
    timing: "untimed",
    bankId: "published",
    title: "Diagnostic Warmup",
  };

  const seed = `diagnostic-${user.id}-${yearLevel}`;
  const selectedQuestionIds = authoringQuestions.map((q) => q.id);
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();

  // Create session and attempt row in Supabase
  let sessionId: string | null = null;
  const { data: createdSessionId, error: sessionError } = await supabase.rpc(
    "create_exam_session",
    {
      p_config: sessionConfig,
      p_seed: seed,
      p_selected_question_ids: selectedQuestionIds,
      p_expires_at: expiresAt,
    },
  );

  if (!sessionError && createdSessionId) {
    sessionId = createdSessionId as string;
    await supabase.rpc("record_exam_attempt", {
      p_session_id: sessionId,
      p_responses: responses,
      p_result: result,
    });
  }

  // Idempotently update profile flags and preferences (G1)
  const nowIso = new Date().toISOString();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      year_level: yearLevel,
      interests,
      weekly_goal_minutes: weeklyGoalMinutes,
      onboarding_completed_at: nowIso,
      diagnostic_completed_at: nowIso,
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json(
      { error: "profile_update_failed", message: profileError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    result,
    baseline: baselineReport,
  });
}
