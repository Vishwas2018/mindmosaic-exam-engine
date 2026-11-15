import "server-only";
import {
  getVerifiedVihaanPilotPublication,
  VIHAAN_QUESTION_METADATA_BY_ID,
} from "@/features/scholarship-prep/content/questions/vihaan-pilot-questions";
import {
  extractVihaanOutcomesFromSittings,
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
 * Merges the verified `vihaan-pilot-01` published manifest items onto a base
 * bank strictly for an allowlisted Vihaan student when the DEV feature flag is
 * active. Fails closed when any manifest integrity check or allowlist fails.
 */
export function withApprovedVihaanPilot(
  baseBank: readonly Question[],
  userId: string | null | undefined,
  env?: VihaanAvailabilityEnv,
): readonly Question[] {
  if (!isVihaanScholarshipPrepEnabledFor(userId, env)) {
    return baseBank;
  }
  const verified = getVerifiedVihaanPilotPublication();
  if (!verified.ok || verified.questions.length === 0) {
    return baseBank;
  }
  const seen = new Set(baseBank.map((q) => q.id));
  const merged = [...baseBank];
  for (const question of verified.questions) {
    if (!seen.has(question.id)) {
      seen.add(question.id);
      merged.push(question);
    }
  }
  return merged;
}

/**
 * Returns the 20 verified published Vihaan pilot questions in canonical order
 * strictly for an allowlisted student when the DEV feature flag is active.
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
 * Planning seam only: returns `[]` unless an allowlisted `userId` with an
 * active DEV environment flag is passed and the governed pilot publication
 * manifest passes cryptographic verification.
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
