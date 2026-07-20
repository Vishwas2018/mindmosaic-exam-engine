import { z } from "zod";

/**
 * Request contract for recording an essay/manual-review mark. Client-safe:
 * only zod, no Supabase or question-bank import. availableMarks is
 * deliberately not part of the request — the server derives it from the
 * attempt's own result.questionDetails so a client can never inflate the
 * ceiling a mark is checked against.
 */
export const recordEssayMarkRequestSchema = z.object({
  attemptId: z.uuid(),
  questionId: z.string().trim().min(1).max(100),
  awardedMarks: z.number().min(0),
  feedback: z.string().trim().max(4000).optional().nullable(),
});

export type RecordEssayMarkRequest = z.infer<typeof recordEssayMarkRequestSchema>;

export interface RecordEssayMarkResponse {
  attemptId: string;
  questionId: string;
  awardedMarks: number;
  maxMarks: number;
}
