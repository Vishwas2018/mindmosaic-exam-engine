import {NextResponse} from "next/server";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {parsePilotAnswer} from "@/features/visuals/bar-model/pilot-session";
import {
  sampleExplanation,
  validateSampleAnswer,
} from "@/content/visual-fixtures/bar-model/sample-practice.server";

const submitSchema = (body: unknown) => {
  const parsed = typeof body === "object" && body !== null
    ? {
        questionId: typeof (body as Record<string, unknown>).questionId === "string"
          ? (body as Record<string, unknown>).questionId
          : undefined,
        answer: typeof (body as Record<string, unknown>).answer === "number"
          ? (body as Record<string, unknown>).answer
          : undefined,
      }
    : {questionId: undefined, answer: undefined};
  return parsed;
};

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSingaporeMathsSampleAllowed()) {
    return new NextResponse(null, {status: 404});
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const {questionId, answer} = submitSchema(body);
  if (!questionId || answer === undefined) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const numericAnswer = parsePilotAnswer(String(answer));
  if (numericAnswer === null) {
    return NextResponse.json({error: "invalid_answer"}, {status: 400});
  }

  const result = validateSampleAnswer(questionId, numericAnswer);
  if (!result.correct) {
    return NextResponse.json({correct: false});
  }

  const explanation = sampleExplanation(questionId);
  return NextResponse.json({
    correct: true,
    ...(explanation !== null ? {workedExplanation: explanation} : {}),
  });
}
