import {NextResponse} from "next/server";

import {createClient} from "@/lib/supabase/server";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {sampleExplanation} from "@/content/visual-fixtures/bar-model/sample-practice.server";
import {hasCorrectSampleSubmission} from "@/features/singapore-maths-sample/submission-store";

interface RevealBody {
  questionId: string;
}

function parseRevealBody(body: unknown): RevealBody | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.questionId !== "string" || !record.questionId) return null;
  return {questionId: record.questionId};
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

  const parsed = parseRevealBody(body);
  if (!parsed) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const {questionId} = parsed;

  // Explanations are released only after the caller has already demonstrated
  // knowledge of the answer: a correct submission must exist for this student
  // and this question. Rejects requests with no proof of submission.
  if (!hasCorrectSampleSubmission(user.id, questionId)) {
    return NextResponse.json({error: "forbidden"}, {status: 403});
  }

  const explanation = sampleExplanation(questionId);
  if (explanation === null) {
    return NextResponse.json({error: "not_found"}, {status: 404});
  }

  return NextResponse.json({workedExplanation: explanation});
}
