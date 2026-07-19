import "server-only";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

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

  const { data, error } = await supabase
    .from("exam_attempts")
    .select("submitted_at, result")
    .eq("student_id", studentId)
    .order("submitted_at", { ascending: true });
  if (error || !data) return { ok: false };

  const attempts: AttemptSummary[] = [];
  for (const raw of data) {
    const parsed = rowSchema.safeParse(raw);
    if (parsed.success) attempts.push(toAttemptSummary(parsed.data));
  }
  return { ok: true, attempts };
}
