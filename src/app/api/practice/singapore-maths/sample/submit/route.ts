import {NextResponse} from "next/server";

import {createClient} from "@/lib/supabase/server";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {parsePilotAnswer} from "@/features/visuals/bar-model/pilot-session";
import {
  sampleExplanation,
  validateSampleAnswer,
} from "@/content/visual-fixtures/bar-model/sample-practice.server";
import {recordSampleSubmission, getSampleSubmission} from "@/features/singapore-maths-sample/submission-store";

interface SubmitBody {
  questionId: string;
  answer: number;
}

function parseSubmitBody(body: unknown): SubmitBody | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.questionId !== "string" || !record.questionId) return null;
  if (typeof record.answer !== "number" || !Number.isFinite(record.answer)) return null;
  return {questionId: record.questionId, answer: record.answer};
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSingaporeMathsSampleAllowed()) {
    return new NextResponse(null, {status: 404});
  }

  const supabase = await createClient();

  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const parsed = parseSubmitBody(body);
  if (!parsed) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const {questionId, answer} = parsed;

  // Reject unrecognised question ids before touching the answer key.
  if (sampleExplanation(questionId) === null) {
    return NextResponse.json({error: "not_found"}, {status: 404});
  }

  const numericAnswer = parsePilotAnswer(String(answer));
  if (numericAnswer === null) {
    return NextResponse.json({error: "invalid_answer"}, {status: 400});
  }

  const result = validateSampleAnswer(questionId, numericAnswer);
  const submittedCorrect = result.correct === true;

  // Idempotent: re-submitting the same question returns the recorded result
  // instead of creating a duplicate. The first submitted answer wins, which
  // also makes concurrent duplicate submissions race-safe (the check + set
  // are synchronous with no await between them).
  const recorded =
    recordSampleSubmission(user.id, questionId, numericAnswer, submittedCorrect) ??
    getSampleSubmission(user.id, questionId);
  const isCorrect = recorded?.correct ?? submittedCorrect;

  if (!isCorrect) {
    return NextResponse.json({correct: false});
  }

  const explanation = sampleExplanation(questionId);
  return NextResponse.json({
    correct: true,
    ...(explanation !== null ? {workedExplanation: explanation} : {}),
  });
}
