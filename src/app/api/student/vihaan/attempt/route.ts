import { NextResponse } from "next/server";
import { z } from "zod";

import { checkOrigin } from "@/features/auth/require-origin";
import { buildExamResult } from "@/features/exam-engine/scoring";
import type { ExamResponses } from "@/features/exam-engine/types";
import { isVihaanScholarshipPrepEnabledFor } from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { createLegacyExamSession, recordLegacyExamAttempt } from "@/server/exam-write/legacy-exam-writes";
import { getVihaanApprovedBank } from "@/server/vihaan-practice";
import { startWritingAttempt, submitWritingAttempt } from "@/server/writing/service";

export const dynamic = "force-dynamic";

const ALLOWED_SESSION_SUBJECTS = new Set([
  "numeracy",
  "reading",
  "language",
  "science",
  "digital_technologies",
  "spelling",
  "amc_mathematics",
  "verbal_reasoning",
  "numerical_reasoning",
  "mixed",
]);

const attemptRequestSchema = z.object({
  questionIds: z.array(z.string().min(1)).min(1).max(200).optional(),
  subject: z.string().trim().min(1).max(60).optional().default("mixed"),
  mode: z
    .enum(["diagnostic", "practice", "sectional", "mock", "writing", "local", "server"])
    .optional()
    .default("diagnostic"),
  title: z.string().trim().min(1).max(120).optional(),
  isSyntheticE2e: z.boolean().optional().default(false),
  responses: z.record(z.string(), z.unknown()).default({}),
  startedAt: z.number().int().positive().optional(),
  submittedAt: z.number().int().positive().optional(),
});

function toSessionSubject(subject: string): string {
  const mapped = subject === "mathematics" ? "numeracy" : subject === "reading_comprehension" ? "reading" : subject;
  return ALLOWED_SESSION_SUBJECTS.has(mapped) ? mapped : "mixed";
}

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

  if (!isVihaanScholarshipPrepEnabledFor(user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "student") {
    return NextResponse.json({ error: "students_only" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = attemptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", details: parsed.error.issues },
      { status: 400 },
    );
  }

  const approvedBank = getVihaanApprovedBank(user.id);
  if (approvedBank.length === 0) {
    return NextResponse.json({ error: "no_approved_questions" }, { status: 403 });
  }

  const byId = new Map(approvedBank.map((q) => [q.id, q]));
  let selectedQuestions = [...approvedBank];
  if (parsed.data.questionIds) {
    const uniqueIds = new Set(parsed.data.questionIds);
    if (uniqueIds.size !== parsed.data.questionIds.length) {
      return NextResponse.json({ error: "duplicate_question_id" }, { status: 400 });
    }
    const resolved = [];
    for (const id of parsed.data.questionIds) {
      const match = byId.get(id);
      if (!match) {
        return NextResponse.json({ error: "invalid_question_id", questionId: id }, { status: 400 });
      }
      resolved.push(match);
    }
    selectedQuestions = resolved;
  } else if (parsed.data.subject !== "mixed") {
    const filtered = approvedBank.filter((q) => q.metadata.subject === parsed.data.subject);
    if (filtered.length === 0) {
      return NextResponse.json({ error: "no_matching_questions" }, { status: 400 });
    }
    selectedQuestions = filtered;
  }

  const now = Date.now();
  const submittedAt =
    parsed.data.submittedAt && parsed.data.submittedAt <= now ? parsed.data.submittedAt : now;
  const startedAt =
    parsed.data.startedAt && parsed.data.startedAt <= submittedAt
      ? parsed.data.startedAt
      : submittedAt - 60_000;

  let result;
  try {
    result = buildExamResult(selectedQuestions, parsed.data.responses as ExamResponses, {
      startedAt,
      submittedAt,
      submissionReason: "user_submitted",
    });
  } catch {
    return NextResponse.json({ error: "invalid_responses" }, { status: 400 });
  }

  const sessionConfig = {
    examStyle: "scholarship_style" as const,
    subject: toSessionSubject(parsed.data.subject),
    yearLevel: 6 as const,
    questionCount: selectedQuestions.length,
    timing: "timed" as const,
    bankId: "published" as const,
    exam_package_id: "vihaan-scholarship-500",
    vihaanMode: parsed.data.mode,
    requestedSubject: parsed.data.subject,
    isSyntheticE2e: parsed.data.isSyntheticE2e,
    title:
      parsed.data.title ??
      (parsed.data.subject === "mixed"
        ? "Vihaan Scholarship Diagnostic"
        : `Vihaan ${parsed.data.mode} — ${parsed.data.subject}`),
  };

  const seed = `vihaan-500-${user.id}-${now}`;
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000).toISOString();

  const { sessionId, error: sessionError } = await createLegacyExamSession({
    studentId: user.id,
    config: sessionConfig,
    seed,
    selectedQuestionIds: selectedQuestions.map((q) => q.id),
    expiresAt,
  });

  if (sessionError || !sessionId) {
    if (sessionError?.code === "MM002") {
      return NextResponse.json({ error: "students_only" }, { status: 403 });
    }
    return NextResponse.json(
      { persisted: false, error: sessionError?.message ?? "session_create_failed" },
      { status: 500 },
    );
  }

  const { attemptId, error: attemptError } = await recordLegacyExamAttempt({
    studentId: user.id,
    sessionId,
    responses: parsed.data.responses,
    result,
  });

  if (attemptError || !attemptId) {
    return NextResponse.json(
      { persisted: false, sessionId, error: attemptError?.message ?? "attempt_record_failed" },
      { status: 500 },
    );
  }

  // Persist non-empty writing responses into writing_attempts so linked parents
  // can mark every criterion on the 1–5 scholarship rubric without duplicate tables.
  const writingAttemptIds: string[] = [];
  for (const question of selectedQuestions) {
    if (question.metadata.subject !== "writing") continue;
    const rawResponse = parsed.data.responses[question.id];
    const responseText = typeof rawResponse === "string" ? rawResponse.trim() : "";
    if (!responseText) continue;
    const taskId = parsed.data.isSyntheticE2e ? `e2e-${question.id}` : question.id;
    const started = await startWritingAttempt(supabase, {
      taskId,
      mode: "untimed",
      durationSeconds: null,
    });
    if (started.ok) {
      const submitted = await submitWritingAttempt(supabase, started.value.id, {
        text: responseText,
        reason: "user_submitted",
      });
      if (submitted.ok) {
        writingAttemptIds.push(submitted.value.id);
      }
    }
  }

  return NextResponse.json({
    persisted: true,
    sessionId,
    attemptId,
    writingAttemptIds,
    result,
  });
}
