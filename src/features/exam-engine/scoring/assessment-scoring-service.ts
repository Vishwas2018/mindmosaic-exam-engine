import type { ExamResponses } from "@/features/exam-engine/types";
import type { AuthoringQuestion } from "@/features/exam-engine/types/candidate-question";

import { buildExamResult, type ExamResult, type ExamResultContext } from "./exam-report";

/**
 * Boundary between "an exam attempt was answered" and "here is the
 * score". Scoring always needs the full authoring question set — answer
 * keys included — so this interface exists to name that dependency
 * explicitly and make it swappable: ServerAuthoritativeScoringService
 * implements this same interface against the server endpoints without the
 * store or UI that calls it changing at all.
 *
 * The return type admits a Promise because a server-authoritative
 * implementation is necessarily asynchronous; the local implementation
 * stays synchronous and the store handles both.
 */
export interface AssessmentScoringService {
  score(
    questions: readonly AuthoringQuestion[],
    responses: ExamResponses,
    context: ExamResultContext,
  ): ExamResult | Promise<ExamResult>;
}

/**
 * Scores entirely in the browser, against a question bank shipped in the
 * client bundle.
 *
 * This is NOT tamper-resistant. A candidate can read the bank — including
 * every answer key — directly from application code or dev tools; nothing
 * server-side verifies a submitted response. It is suitable only for the
 * low-stakes local practice this app currently offers.
 *
 * Do not wire this into any mode that claims to be a trusted, proctored,
 * or graded assessment without first replacing it with a server-side
 * implementation of AssessmentScoringService. See
 * docs/ASSESSMENT_SECURITY_MODEL.md for the full threat model and the
 * planned Phase 4 server-authoritative path.
 */
export const localPracticeScoringService: AssessmentScoringService = {
  score: buildExamResult,
};
