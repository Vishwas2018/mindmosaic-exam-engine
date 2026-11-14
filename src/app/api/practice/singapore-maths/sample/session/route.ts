import {NextResponse} from "next/server";

import {createClient} from "@/lib/supabase/server";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {sampleExplanation} from "@/content/visual-fixtures/bar-model/sample-practice.server";
import {
  getSampleStore,
  SampleStoreUnavailableError,
  type SampleYear,
} from "@/features/singapore-maths-sample/attempt-store";

function parseYear(value: string | null): SampleYear | null {
  return value === "3" ? 3 : value === "5" ? 5 : null;
}

async function signedInUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function storeUnavailable(): NextResponse {
  return NextResponse.json({error: "store_unavailable"}, {status: 503});
}

/**
 * Restores this student's recorded answers for the current attempt, so a refresh, a second tab or a
 * different server instance shows exactly what was recorded. Explanations are included only for
 * questions whose recorded answer is correct.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isSingaporeMathsSampleAllowed()) {
    return new NextResponse(null, {status: 404});
  }
  const year = parseYear(new URL(request.url).searchParams.get("year"));
  if (!year) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }
  const userId = await signedInUserId();
  if (!userId) {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }
  try {
    const submissions = await getSampleStore().listSubmissions(userId, year);
    return NextResponse.json({
      submissions: submissions.map((s) => ({
        questionId: s.questionId,
        answer: s.answer,
        correct: s.correct,
        ...(s.correct ? {workedExplanation: sampleExplanation(s.questionId) ?? undefined} : {}),
      })),
    });
  } catch (error) {
    if (error instanceof SampleStoreUnavailableError) return storeUnavailable();
    throw error;
  }
}

/**
 * Starts a NEW attempt (the only way to retry). Earlier attempts and their submissions are kept, not
 * deleted. `?year=3|5` resets one year; with no year, both. Only the caller's own attempts are touched.
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  if (!isSingaporeMathsSampleAllowed()) {
    return new NextResponse(null, {status: 404});
  }
  const rawYear = new URL(request.url).searchParams.get("year");
  const year = parseYear(rawYear);
  if (rawYear !== null && !year) {
    return NextResponse.json({error: "invalid_request"}, {status: 400});
  }
  const userId = await signedInUserId();
  if (!userId) {
    return NextResponse.json({error: "unauthorized"}, {status: 401});
  }
  try {
    const store = getSampleStore();
    for (const y of year ? [year] : ([3, 5] as const)) await store.startNewAttempt(userId, y);
    return NextResponse.json({ok: true});
  } catch (error) {
    if (error instanceof SampleStoreUnavailableError) return storeUnavailable();
    throw error;
  }
}
