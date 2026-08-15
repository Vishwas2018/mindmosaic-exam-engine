import "server-only";

import { createClient } from "@/lib/supabase/server";

import { fetchSittingRows } from "@/server/assessment/read-dispatch";

import { buildOverview, type StudentAttemptOverview } from "./attempt-summary";

/**
 * Server-side reads for the signed-in student's screens. Every query runs
 * through the cookie-scoped anon client, so RLS limits rows to
 * `student_id = auth.uid()` — no student id is ever passed from the caller
 * (docs/DATA_MODEL_AND_ROLES.md).
 */

const RECENT_ATTEMPTS_LIMIT = 50;

export async function fetchStudentOverview(): Promise<StudentAttemptOverview> {
  const supabase = await createClient();

  /* Both storage models, each sitting once, from the model that created it
     (§12.7 step 8, ADR-005 Amendment A). This read `exam_attempts` directly
     until step 8; the resolution rule now lives in one place and every
     dependent surface reaches it through the dispatcher rather than through a
     copy of the union.

     The rows come back in the shape these reducers already consume, so
     `buildOverview` — and the mastery aggregation under it — is unchanged. A
     read failure still renders the empty state rather than crashing: the
     dispatcher returns no rows rather than throwing, and attempt history is
     enrichment, not a hard dependency. */
  const rows = await fetchSittingRows(supabase, { limit: RECENT_ATTEMPTS_LIMIT });

  return buildOverview(rows);
}
