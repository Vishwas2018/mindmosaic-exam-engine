import {NextResponse} from "next/server";

import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {sampleExplanation} from "@/content/visual-fixtures/bar-model/sample-practice.server";

const revealSchema = (body: unknown) => {
  const parsed = typeof body === "object" && body !== null
    ? {
        questionId: typeof (body as Record<string, unknown>).questionId === "string"
          ? (body as Record<string, unknown>).questionId
          : undefined,
      }
    : {questionId: undefined};
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

  const {questionId} = revealSchema(body);
  if (!questionId) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const explanation = sampleExplanation(questionId);
  if (explanation === null) {
    return NextResponse.json({error: "not_found"}, {status: 404});
  }

  return NextResponse.json({workedExplanation: explanation});
}
