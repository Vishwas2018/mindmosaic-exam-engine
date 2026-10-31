import {NextResponse} from "next/server";

import {createClient} from "@/lib/supabase/server";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {parsePilotAnswer} from "@/features/visuals/bar-model/pilot-session";
import {
  sampleExplanation,
  sampleYearOf,
  validateSampleAnswer,
} from "@/content/visual-fixtures/bar-model/sample-practice.server";
import {getSampleStore, SampleStoreUnavailableError} from "@/features/singapore-maths-sample/attempt-store";

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

/**
 * One immutable graded submission per question per attempt (see attempt-store.ts).
 *
 * The response always describes the RECORDED submission: `answer` and `correct` are what the server
 * stored, and `alreadyAnswered` says whether this request was the one that stored it. A later
 * request with a different answer therefore can never be told its own answer was right or wrong:
 * it is told what was recorded, and the client shows that. The worked explanation rides along only
 * when the recorded submission is correct, so the client never needs a second round trip for it.
 */
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
  const year = sampleYearOf(questionId);
  if (year === null || sampleExplanation(questionId) === null) {
    return NextResponse.json({error: "not_found"}, {status: 404});
  }

  const numericAnswer = parsePilotAnswer(String(answer));
  if (numericAnswer === null) {
    return NextResponse.json({error: "invalid_answer"}, {status: 400});
  }

  const verdict = validateSampleAnswer(questionId, numericAnswer).correct === true;

  try {
    const {submission, created} = await getSampleStore().recordSubmission(
      user.id,
      year,
      questionId,
      numericAnswer,
      verdict,
    );
    const explanation = submission.correct ? sampleExplanation(questionId) : null;
    return NextResponse.json({
      correct: submission.correct,
      answer: submission.answer,
      alreadyAnswered: !created,
      ...(explanation !== null ? {workedExplanation: explanation} : {}),
    });
  } catch (error) {
    if (error instanceof SampleStoreUnavailableError) {
      return NextResponse.json({error: "store_unavailable"}, {status: 503});
    }
    throw error;
  }
}
