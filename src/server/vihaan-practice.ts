import "server-only";
import { VIHAAN_QUESTION_METADATA_BY_ID } from "@/features/scholarship-prep/content/questions/vihaan-pilot-questions";
import {
  extractVihaanOutcomesFromSittings,
  selectPractice,
  type RecordedOutcome,
} from "@/features/scholarship-prep/lib/practice";
import { fetchSittingRows, type DispatchClient } from "@/server/assessment/read-dispatch";
import { getExamBank } from "./exam-bank";

/** Planning seam only: no new student endpoint, draft loader or publication path.
 * The canonical bank checks human approvals and integrity before this filter runs.
 */
export function getVihaanPracticePlan(count: number, options: {subject?:string; weakTopics?:readonly string[]} = {}) {
  return selectPractice(getExamBank("published"), count, options);
}

/**
 * Loads Vihaan-specific attempt outcomes for the parent dashboard from persisted
 * `visible_sittings` rows via the canonical assessment read dispatcher.
 */
export async function loadVihaanParentOutcomes(
  supabase: DispatchClient,
  studentId: string,
  limit: number | null = 200,
): Promise<RecordedOutcome[]> {
  if (!studentId.trim()) return [];
  const sittings = await fetchSittingRows(supabase, {
    studentIds: [studentId],
    limit,
  });
  return extractVihaanOutcomesFromSittings(sittings, VIHAAN_QUESTION_METADATA_BY_ID);
}
