import type { ExamResponses } from "@/features/exam-engine/types";
import type { AuthoringQuestion } from "@/features/exam-engine/types/candidate-question";

import type {
  AssessmentScoringService,
  ScoredSubmission,
} from "./assessment-scoring-service";
import type { ExamResultContext } from "./exam-report";
import type { SubmitSessionResponse } from "./server-scoring-contract";

/**
 * Scores a server-created exam session (docs/ASSESSMENT_SECURITY_MODEL.md,
 * Phase 0 addendum). The session — with its server-chosen seed and stored
 * question ids — already exists before the student saw a question
 * (startServerExam created it via POST /api/exam/session);
 * POST /api/exam/session/:id/submit scores the raw responses against the
 * server's own stored selection with buildExamResult and records the
 * exam_attempts row a parent or teacher can trust. Only the submit
 * response reveals the full questions, for the post-submission review
 * screen.
 */
export class ServerAuthoritativeScoringService implements AssessmentScoringService {
  constructor(private readonly serverSessionId: string) {}

  async score(
    _questions: readonly AuthoringQuestion[],
    responses: ExamResponses,
    context: ExamResultContext,
  ): Promise<ScoredSubmission> {
    /*
     * Anything computed client-side is deliberately ignored: the server
     * recomputes its own questions from the stored session so nothing the
     * client holds (or fabricates) can influence scoring.
     */
    const response = await fetch(
      `/api/exam/session/${this.serverSessionId}/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          submissionReason: context.submissionReason,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`Server scoring request failed: ${response.status}`);
    }
    const submission = (await response.json()) as SubmitSessionResponse;
    return {
      result: submission.result,
      reviewQuestions: submission.reviewQuestions,
    };
  }
}
