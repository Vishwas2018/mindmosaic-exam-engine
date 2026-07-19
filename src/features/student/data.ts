import "server-only";

import { createClient } from "@/lib/supabase/server";

import { buildOverview, type AttemptRow, type StudentAttemptOverview } from "./attempt-summary";

/**
 * Server-side reads for the signed-in student's screens. Every query runs
 * through the cookie-scoped anon client, so RLS limits rows to
 * `student_id = auth.uid()` — no student id is ever passed from the caller
 * (docs/DATA_MODEL_AND_ROLES.md).
 */

const RECENT_ATTEMPTS_LIMIT = 50;

export async function fetchStudentOverview(): Promise<StudentAttemptOverview> {
  const supabase = await createClient();

  /* The session join pulls the config (subject, style, timing) the attempt
     was sat under; exam_sessions is equally RLS-scoped to the student. */
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id, submitted_at, result, session:exam_sessions(config)")
    .order("submitted_at", { ascending: false })
    .limit(RECENT_ATTEMPTS_LIMIT);

  if (error || !data) {
    /* A read failure renders the empty state rather than crashing the
       page; the attempt history is enrichment, not a hard dependency. */
    return buildOverview([]);
  }

  const rows: AttemptRow[] = data.map((row) => ({
    id: String(row.id),
    submitted_at: String(row.submitted_at),
    result: row.result,
    /* supabase-js types embedded to-one relations as an array; normalise. */
    session: Array.isArray(row.session) ? (row.session[0] ?? null) : row.session,
  }));

  return buildOverview(rows);
}
