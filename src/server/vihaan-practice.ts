import "server-only";
import {
  getVerifiedVihaanAllPublishedQuestions,
  getVerifiedVihaanPilotPublication,
  VIHAAN_QUESTION_METADATA_BY_ID,
} from "@/features/scholarship-prep/content/questions/vihaan-pilot-questions";
import {
  extractVihaanOutcomesFromSittings,
  isReservedMockExamQuestion,
  selectPractice,
  type RecordedOutcome,
} from "@/features/scholarship-prep/lib/practice";
import {
  isVihaanScholarshipPrepEnabledFor,
  type VihaanAvailabilityEnv,
} from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import type { Question } from "@/schemas/question.schema";
import { fetchSittingRows, type DispatchClient } from "@/server/assessment/read-dispatch";
import { getExamBank } from "./exam-bank";

/**
 * Merges the verified 500-item published scholarship bank (20 pilot + 480
 * expansion) onto a base bank strictly for an allowlisted Vihaan student when
 * the DEV feature flag is active. Fails closed when any manifest integrity
 * check or allowlist fails.
 */
export function withApprovedVihaanPilot(
  baseBank: readonly Question[],
  userId: string | null | undefined,
  env?: VihaanAvailabilityEnv,
): readonly Question[] {
  if (!isVihaanScholarshipPrepEnabledFor(userId, env)) {
    return baseBank;
  }
  const approved = getVerifiedVihaanAllPublishedQuestions();
  if (approved.length === 0) {
    return baseBank;
  }
  const seen = new Set(baseBank.map((q) => q.id));
  const merged = [...baseBank];
  for (const question of approved) {
    if (!seen.has(question.id)) {
      seen.add(question.id);
      merged.push(question);
    }
  }
  return merged;
}

/**
 * Returns the full 500 verified published Vihaan questions (20 pilot + 480
 * expansion) strictly for an allowlisted DEV user. Fails closed otherwise.
 */
export function getVihaanApprovedBank(
  userId?: string | null,
  env?: VihaanAvailabilityEnv,
): readonly Question[] {
  if (!isVihaanScholarshipPrepEnabledFor(userId, env)) {
    return [];
  }
  return getVerifiedVihaanAllPublishedQuestions();
}

/**
 * Returns the verified published questions (334 less any withdrawn) eligible for daily adaptive
 * practice, concept drills, diagnostic, writing practice, and timed sectional
 * drills. Includes the 166 publicly exposed former mock items (practice-only, see EXPOSED_MOCK_ITEMS_PRACTICE_ONLY).
 */
export function getVihaanPracticePool(
  userId?: string | null,
  env?: VihaanAvailabilityEnv,
): readonly Question[] {
  return getVihaanApprovedBank(userId, env).filter((q) => !isReservedMockExamQuestion(q.id));
}

/**
 * Returns the questions reserved exclusively for unseen timed Mock Examinations.
 * Empty while the exposed set is practice-only: no unseen mock paper exists yet.
 */
export function getVihaanMockPool(
  userId?: string | null,
  env?: VihaanAvailabilityEnv,
): readonly Question[] {
  return getVihaanApprovedBank(userId, env).filter((q) => isReservedMockExamQuestion(q.id));
}

/**
 * Returns the 20 verified published Vihaan pilot diagnostic questions in
 * canonical order strictly for an allowlisted student when DEV is active.
 */
export function getVihaanDiagnosticQuestions(
  userId?: string | null,
  env?: VihaanAvailabilityEnv,
): readonly Question[] {
  if (!isVihaanScholarshipPrepEnabledFor(userId, env)) {
    return [];
  }
  const verified = getVerifiedVihaanPilotPublication();
  if (!verified.ok) {
    return [];
  }
  return verified.questions;
}

/**
 * Planning seam: returns `[]` unless an allowlisted `userId` with an active
 * DEV environment flag is passed. Excludes all 166 reserved mock-exam items.
 */
export function getVihaanPracticePlan(
  count: number,
  options: {
    subject?: string;
    weakTopics?: readonly string[];
    userId?: string | null;
    env?: VihaanAvailabilityEnv;
  } = {},
) {
  const bank = options.userId
    ? withApprovedVihaanPilot(getExamBank("published"), options.userId, options.env)
    : getExamBank("published");
  return selectPractice(bank, count, options);
}

/**
 * Loads Vihaan-specific attempt outcomes for the student and parent dashboards
 * from persisted `visible_sittings` rows via the canonical assessment read
 * dispatcher, excluding synthetic E2E verification sittings by default.
 */
export async function loadVihaanParentOutcomes(
  supabase: DispatchClient,
  studentId: string,
  limit: number | null = 200,
  options: { readonly includeSyntheticE2e?: boolean } = {},
): Promise<RecordedOutcome[]> {
  if (!studentId.trim()) return [];
  const sittings = await fetchSittingRows(supabase, {
    studentIds: [studentId],
    limit,
  });
  return extractVihaanOutcomesFromSittings(sittings, VIHAAN_QUESTION_METADATA_BY_ID, options);
}
