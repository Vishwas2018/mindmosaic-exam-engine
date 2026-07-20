"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { summarizeAttempt, type AttemptRow } from "@/features/student/attempt-summary";
import type { SubjectFilter } from "@/features/exam-engine/selection";

/**
 * Cross-attempt history for the results screen: personal-best and
 * previous-attempt comparison, scoped to the just-submitted exam's subject.
 * Reuses attempt-summary.ts's summarizeAttempt for score extraction rather
 * than re-parsing result jsonb. RLS on exam_attempts (student_id =
 * auth.uid()) is the only access control — no student id is ever passed in.
 */

const HISTORY_LIMIT = 200;

export interface ResultsHistoryStats {
  /** Prior attempts of this subject, not counting the one just submitted. */
  subjectAttemptCount: number;
  /** Best objective percentage from a prior attempt of this subject; null with no scored prior attempts. */
  personalBestPercent: number | null;
  previousAttempt: { scorePercent: number | null; submittedAt: string } | null;
}

export type ResultsHistoryOutcome =
  | { kind: "guest" }
  | { kind: "ready"; stats: ResultsHistoryStats };

const emptyStats: ResultsHistoryStats = {
  subjectAttemptCount: 0,
  personalBestPercent: null,
  previousAttempt: null,
};

function rowSubject(row: AttemptRow): SubjectFilter | null {
  const config = row.session?.config;
  if (typeof config !== "object" || config === null) return null;
  const subject = (config as Record<string, unknown>).subject;
  return subject === "numeracy" ||
    subject === "reading" ||
    subject === "language" ||
    subject === "mixed"
    ? subject
    : null;
}

export async function fetchResultsHistory(params: {
  subject: SubjectFilter;
  /** The exam_sessions.id the current attempt belongs to; excluded from history. */
  excludeSessionId: string | null;
}): Promise<ResultsHistoryOutcome> {
  /* Unconfigured Supabase (no .env.local on this device) means no one can
     be signed in — same as the guest case below, fail soft rather than
     throwing from createClient(). */
  if (!isSupabaseConfigured) return { kind: "guest" };

  const supabase = await createClient();

  /* A guest has no persisted attempts at all (see e2e note in
     src/features/student/data.ts): distinguishing "guest" from "signed-in,
     no history yet" needs an explicit identity check, since both would
     otherwise return the same empty row set through RLS. */
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { kind: "guest" };

  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id, submitted_at, result, session_id, session:exam_sessions(config)")
    .order("submitted_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error || !data) {
    /* Fail soft, same as fetchStudentOverview: history is enrichment, not
       a hard dependency for the results screen. */
    return { kind: "ready", stats: emptyStats };
  }

  const rows: AttemptRow[] = data
    .filter((row) => String(row.session_id) !== params.excludeSessionId)
    .map((row) => ({
      id: String(row.id),
      submitted_at: String(row.submitted_at),
      result: row.result,
      session: Array.isArray(row.session) ? (row.session[0] ?? null) : row.session,
    }));

  /* Rows arrived ordered newest-first, and filtering preserves that order. */
  const sameSubject = rows.filter((row) => rowSubject(row) === params.subject);
  const summaries = sameSubject.map(summarizeAttempt);

  const scoredPercentages = summaries
    .map((summary) => summary.scorePercent)
    .filter((percent): percent is number => percent !== null);

  return {
    kind: "ready",
    stats: {
      subjectAttemptCount: summaries.length,
      personalBestPercent:
        scoredPercentages.length > 0 ? Math.max(...scoredPercentages) : null,
      previousAttempt: summaries[0]
        ? { scorePercent: summaries[0].scorePercent, submittedAt: summaries[0].submittedAt }
        : null,
    },
  };
}
