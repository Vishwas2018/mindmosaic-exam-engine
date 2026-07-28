import { describeConfig } from "@/features/exam-engine/components/describe-config";
import { isUnanswered } from "@/features/exam-engine/scoring";
import type { ActiveSessionResponse } from "@/features/exam-engine/scoring/server-scoring-contract";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { ActiveSession } from "@/features/session-recovery";

/**
 * Pure view-model mapper: the raw GET /api/exam/session/active payload
 * (already fetched by the exam store's resumeServerExam for the /exam
 * route) into the generic ActiveSession shape SessionRecoveryBanner
 * renders. Kept separate from the fetching hook so it is trivially
 * unit-testable without a network mock.
 */
export function toActiveSession(active: ActiveSessionResponse): ActiveSession {
  const questionsAnswered = active.questions.filter(
    (question) =>
      !isUnanswered(active.responses[question.id] as CandidateAnswer | undefined),
  ).length;

  return {
    id: active.sessionId,
    examTitle: describeConfig(active.config),
    resumeHref: "/exam",
    startedAt: active.startedAt,
    expiresAt:
      active.durationSeconds !== null
        ? new Date(
            Date.parse(active.startedAt) + active.durationSeconds * 1000,
          ).toISOString()
        : undefined,
    questionsAnswered,
    totalQuestions: active.questions.length,
  };
}
