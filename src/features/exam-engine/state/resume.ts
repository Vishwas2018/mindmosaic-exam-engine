import type { ExamBankId, ExamSelectionConfig } from "@/features/exam-engine/selection";
import type { CandidateQuestion, ExamResponses } from "@/features/exam-engine/types";

import { getEffectiveRemainingSeconds, hasDeadlineExpired } from "./deadline";

/** Raw resumable-session shape as reported by GET /api/exam/session/active. */
export interface ResumableSession {
  sessionId: string;
  bankId: ExamBankId;
  config: ExamSelectionConfig;
  questions: readonly CandidateQuestion[];
  /** exam_sessions.created_at — the one authoritative start instant. */
  startedAt: number;
  durationSeconds: number | null;
  /** From the exam_responses row; empty/zero/none if no autosave happened yet. */
  responses: ExamResponses;
  currentQuestionIndex: number;
  flaggedQuestionIds: readonly string[];
}

export interface ReconciledResume {
  sessionId: string;
  bankId: ExamBankId;
  config: ExamSelectionConfig;
  questions: readonly CandidateQuestion[];
  responses: ExamResponses;
  currentQuestionIndex: number;
  flaggedQuestionIds: readonly string[];
  startedAt: number;
  durationSeconds: number | null;
  deadlineAt: number | null;
  remainingSeconds: number | null;
  /** True if the original deadline has already passed by `now`. */
  expired: boolean;
}

/**
 * Reconciles a server-reported resumable session into exam-store state.
 * The deadline is always *recomputed* from the session's original
 * `startedAt` — never reset to "now" — so resuming late can only shrink
 * remaining time, never grant a resumed attempt more time than the
 * original deadline allowed. `currentQuestionIndex` is clamped defensively
 * in case the saved index and the question count ever disagree.
 */
export function reconcileResumedSession(
  session: ResumableSession,
  now: number,
): ReconciledResume {
  const deadlineAt =
    session.durationSeconds === null
      ? null
      : session.startedAt + session.durationSeconds * 1000;
  const currentQuestionIndex = Math.max(
    0,
    Math.min(session.currentQuestionIndex, Math.max(0, session.questions.length - 1)),
  );
  return {
    sessionId: session.sessionId,
    bankId: session.bankId,
    config: session.config,
    questions: session.questions,
    responses: session.responses,
    currentQuestionIndex,
    flaggedQuestionIds: session.flaggedQuestionIds,
    startedAt: session.startedAt,
    durationSeconds: session.durationSeconds,
    deadlineAt,
    remainingSeconds: getEffectiveRemainingSeconds(deadlineAt, now),
    expired: hasDeadlineExpired(deadlineAt, now),
  };
}
