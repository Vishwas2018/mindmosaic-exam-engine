import {NextResponse} from "next/server";

import {createClient} from "@/lib/supabase/server";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {sampleExplanation, sampleYearOf} from "@/content/visual-fixtures/bar-model/sample-practice.server";
import {getSampleStore, SampleStoreUnavailableError} from "@/features/singapore-maths-sample/attempt-store";

interface RevealBody {
  questionId: string;
}

function parseRevealBody(body: unknown): RevealBody | null {
  if (typeof body !== "object" || body === null) return null;
  const record = body as Record<string, unknown>;
  if (typeof record.questionId !== "string" || !record.questionId) return null;
  return {questionId: record.questionId};
}

/**
 * Kept for API compatibility and as an access-control boundary. The page no longer calls it: the
 * explanation already arrives with the correct submission (and with the restored state on reload).
 * It reads the same durable record, so it agrees with every other route on every instance.
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

  const parsed = parseRevealBody(body);
  if (!parsed) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }

  const {questionId} = parsed;
  const year = sampleYearOf(questionId);

  try {
    // Explanations are released only when this student's recorded submission for this question is correct.
    const recorded = year ? await getSampleStore().getSubmission(user.id, year, questionId) : null;
    if (!recorded?.correct) {
      return NextResponse.json({error: "forbidden"}, {status: 403});
    }
    const explanation = sampleExplanation(questionId);
    if (explanation === null) {
      return NextResponse.json({error: "not_found"}, {status: 404});
    }
    return NextResponse.json({workedExplanation: explanation});
  } catch (error) {
    if (error instanceof SampleStoreUnavailableError) {
      return NextResponse.json({error: "store_unavailable"}, {status: 503});
    }
    throw error;
  }
}
