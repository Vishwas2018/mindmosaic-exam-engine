import { NextResponse } from "next/server";
import { toCandidateQuestions } from "@/features/exam-engine/types";
import { selectDiagnosticQuestions } from "@/features/student/onboarding/diagnostic-selector";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getExamBank } from "@/server/exam-bank";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<NextResponse> {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const yearLevel = yearParam ? parseInt(yearParam, 10) : 3;

  if (yearLevel !== 3 && yearLevel !== 5) {
    return NextResponse.json({ error: "invalid_year_level" }, { status: 400 });
  }

  const publishedBank = getExamBank("published");
  const selection = selectDiagnosticQuestions(publishedBank, yearLevel);

  if (!selection.ok) {
    return NextResponse.json(
      { error: selection.reason, message: selection.message },
      { status: 500 },
    );
  }

  // Strip answer keys for the client
  const candidateQuestions = toCandidateQuestions(selection.questions);

  return NextResponse.json({
    ok: true,
    yearLevel,
    questions: candidateQuestions,
  });
}
