import type { ExamResponses } from "@/features/exam-engine/types";
import type { AuthoringQuestion } from "@/features/exam-engine/types/candidate-question";
import type { ExamBankId, ExamSelectionConfig } from "@/features/exam-engine/selection";

import type { AssessmentScoringService } from "./assessment-scoring-service";
import type { ExamResult, ExamResultContext } from "./exam-report";
import type { CreateSessionResponse } from "./server-scoring-contract";

/** What the service needs to reproduce the session server-side. */
export interface ServerScoringSessionInit {
  config: ExamSelectionConfig;
  seed: string;
  bankId: ExamBankId;
}

/**
 * Scores against the server endpoints from the Phase 0 addendum in
 * docs/ASSESSMENT_SECURITY_MODEL.md: POST /api/exam/session persists a
 * server-selected exam_sessions row (recomputing the same deterministic
 * selection from the server-only bank), then
 * POST /api/exam/session/:id/submit scores the responses server-side with
 * buildExamResult and records the exam_attempts row a parent or teacher
 * can trust. The client neither sends nor receives an answer key at any
 * point in this exchange.
 */
export class ServerAuthoritativeScoringService implements AssessmentScoringService {
  constructor(private readonly session: ServerScoringSessionInit) {}

  async score(
    _questions: readonly AuthoringQuestion[],
    responses: ExamResponses,
    context: ExamResultContext,
  ): Promise<ExamResult> {
    /*
     * The locally recomputed questions are deliberately ignored: the
     * server recomputes its own from the stored session so nothing the
     * client holds (or fabricates) can influence scoring.
     */
    const created = await postJson<CreateSessionResponse>("/api/exam/session", {
      config: this.session.config,
      seed: this.session.seed,
      bankId: this.session.bankId,
    });

    return postJson<ExamResult>(`/api/exam/session/${created.sessionId}/submit`, {
      responses,
      submissionReason: context.submissionReason,
    });
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Server scoring request failed: ${response.status} ${url}`);
  }
  return (await response.json()) as T;
}
