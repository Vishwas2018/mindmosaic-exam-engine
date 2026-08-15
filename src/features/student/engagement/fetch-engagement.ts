import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { fetchSittingRows } from "@/server/assessment/read-dispatch";

import { toAttemptSummary, type AttemptSummary } from "./attempts";

/**
 * Reads the signed-in student's attempt history for the engagement page.
 * RLS scopes exam_attempts to student_id = auth.uid(); guests never reach
 * this (their practice is local-only and earns no persisted streaks —
 * matching the security model's "signed-in gets persistence" split).
 */

const rowSchema = z.object({
  submitted_at: z.string(),
  result: z.unknown(),
});

export type FetchEngagementResult =
  | { ok: true; attempts: AttemptSummary[] }
  | { ok: false };

export async function fetchEngagementAttempts(
  studentId: string,
): Promise<FetchEngagementResult> {
  const supabase = await createClient();

  /* Both storage models through the single resolution rule (§12.7 step 8).
     Unlimited on purpose, as this read always was: a streak is a property of a
     student's whole history, and truncating it at a page size would shorten a
     long streak rather than fail visibly.

     Oldest-first, which the dispatcher gives newest-first — reversed here
     rather than adding an ordering knob, because every other consumer wants
     newest-first and one of them would eventually pass the wrong one. */
  const rows = await fetchSittingRows(supabase, { studentIds: [studentId], limit: null });

  const attempts: AttemptSummary[] = [];
  for (const raw of [...rows].reverse()) {
    const parsed = rowSchema.safeParse(raw);
    if (parsed.success) attempts.push(toAttemptSummary(parsed.data));
  }
  return { ok: true, attempts };
}
