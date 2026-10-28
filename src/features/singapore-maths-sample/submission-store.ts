import "server-only";

/**
 * Server-authoritative submission state for the Singapore Maths sample practice.
 *
 * Phase 1 keeps sample practice out of Supabase (it is a throwaway sample,
 * separate from production assessment banks), so submission state lives in an
 * in-memory keyed store keyed by `userId\0questionId`. This is only reachable
 * when `isSingaporeMathsSampleAllowed()` is true, which is never the case on
 * a real Vercel production deployment, so the store's process-lifetime scope
 * is acceptable for the intended dev/preview QA surface.
 *
 * All mutations are synchronous with no `await` between the "has" check and
 * the "set", which makes check-then-record race-safe on Node's single-threaded
 * event loop.
 */

export interface SampleSubmission {
  questionId: string;
  answer: number;
  correct: boolean;
  submittedAt: number;
}

const submissions = new Map<string, SampleSubmission>();

function key(userId: string, questionId: string): string {
  return `${userId}\0${questionId}`;
}

/**
 * Records a submission. Returns `null` when this user has already answered
 * this question (duplicate) — no state is changed, making the operation
 * idempotent and safe against concurrent duplicate submissions.
 */
export function recordSampleSubmission(
  userId: string,
  questionId: string,
  answer: number,
  correct: boolean,
): SampleSubmission | null {
  const k = key(userId, questionId);
  if (submissions.has(k)) return null;
  const record: SampleSubmission = {
    questionId,
    answer,
    correct,
    submittedAt: Date.now(),
  };
  submissions.set(k, record);
  return record;
}

export function getSampleSubmission(
  userId: string,
  questionId: string,
): SampleSubmission | undefined {
  return submissions.get(key(userId, questionId));
}

export function hasCorrectSampleSubmission(
  userId: string,
  questionId: string,
): boolean {
  const record = submissions.get(key(userId, questionId));
  return record?.correct === true;
}

export function clearSampleSubmissions(userId: string): void {
  const prefix = `${userId}\0`;
  for (const k of submissions.keys()) {
    if (k.startsWith(prefix)) submissions.delete(k);
  }
}

export function sampleSubmissionCount(userId: string): number {
  const prefix = `${userId}\0`;
  let n = 0;
  for (const k of submissions.keys()) {
    if (k.startsWith(prefix)) n++;
  }
  return n;
}
