import { z } from "zod";

/**
 * Request contract for recording an essay/manual-review mark. Client-safe:
 * only zod, no Supabase or question-bank import.
 *
 * `availableMarks` is deliberately not part of the request — the server derives
 * it from the sitting's own record (the legacy attempt's `result.questionDetails`
 * on one model, the pinned item version's `marks_available` on the other) so a
 * client can never inflate the ceiling a mark is checked against (§14.1).
 *
 * The identity is the SITTING, not the legacy attempt. A target-model sitting
 * has no attempt id, so an attempt-keyed request could only ever mark legacy
 * work; the session id is the identity both models carry and the one the
 * resolution rule is expressed in. The route resolves which model a session
 * belongs to and writes through that model's own path.
 */
export const recordManualMarkRequestSchema = z.object({
  sessionId: z.uuid(),
  questionId: z.string().trim().min(1).max(100),
  awardedMarks: z.number().min(0),
  feedback: z.string().trim().max(4000).optional().nullable(),
});

export type RecordManualMarkRequest = z.infer<typeof recordManualMarkRequestSchema>;

export interface RecordManualMarkResponse {
  sessionId: string;
  questionId: string;
  awardedMarks: number;
  maxMarks: number;
}
