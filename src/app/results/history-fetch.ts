"use server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AttemptSummary } from "@/features/student/attempt-summary";
import { fetchSittingHistory } from "@/server/assessment/read-dispatch";
import type { SubjectFilter } from "@/features/exam-engine/selection";

/**
 * Cross-attempt history for the results screen: personal-best and
 * previous-attempt comparison, scoped to the just-submitted exam's subject.
 *
 * Both fetchers below source their rows from `read-dispatch`, which resolves a
 * sitting to the one model that created it (§12.7 step 7). They used to query
 * `exam_attempts` directly, which was the whole history until step 6 made it
 * possible for a session to be created on the target model. RLS is still the
 * only access control and no student id is ever passed in.
 */

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

/* `emptyStats` used to sit here as the fail-soft return for a query error. The
   dispatcher fails soft itself — an unreadable model contributes no rows rather
   than throwing — and the computation below already produces exactly those
   values from an empty list: zero attempts, no personal best, no previous
   attempt. A second copy of the empty state would be a second thing to keep
   true. */

export type AttemptHistoryOutcome =
  | { kind: "guest" }
  | { kind: "ready"; attempts: readonly AttemptSummary[] };

/**
 * The signed-in student's finished attempts, newest first — the same rows
 * RecentAttemptsCard shows on the dashboard.
 *
 * Exists because /results reads the in-memory exam store, so a page refresh
 * (or following the Results nav item at any other time) left a student with
 * five finished sessions looking at "No results to show yet". The dashboard
 * proved the history was there; the results screen just never asked for it.
 *
 * Same access model as fetchResultsHistory above: RLS on exam_attempts
 * (student_id = auth.uid()) is the control, and no student id is passed in.
 */
export async function fetchAttemptHistory(): Promise<AttemptHistoryOutcome> {
  if (!isSupabaseConfigured) return { kind: "guest" };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { kind: "guest" };

  /* Both storage models, resolved by origin and de-duplicated there (§12.7 step
     7, ADR-005 Amendment A3). This used to read `exam_attempts` alone, which
     stopped being the whole history the moment step 6 could route a session to
     the target model. Fails soft the same way: the dispatcher returns an empty
     list rather than throwing, and an empty list renders the same honest
     "nothing yet" state a student with no history sees. */
  const attempts = await fetchSittingHistory(supabase);
  return { kind: "ready", attempts };
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

  /* Both models, one source per sitting, newest first (§12.7 step 7). The
     exclusion and the subject filter work off the summary's own fields rather
     than off a legacy row shape, which is what lets the same two lines cover a
     sitting from either model. */
  const history = await fetchSittingHistory(supabase);

  /* History arrived ordered newest-first, and filtering preserves that order. */
  const summaries = history.filter(
    (sitting) =>
      sitting.sessionId !== params.excludeSessionId && sitting.subject === params.subject,
  );

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
