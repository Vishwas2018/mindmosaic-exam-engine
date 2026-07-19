import type { ExamResponses } from "@/features/exam-engine/types";
import type {
  AuthoringQuestion,
  ReviewQuestion,
} from "@/features/exam-engine/types/candidate-question";

import { buildExamResult, type ExamResult, type ExamResultContext } from "./exam-report";

/**
 * Everything a finished attempt yields: the score, and the full questions
 * the review screen may now reveal (ReviewQuestion marks that one
 * sanctioned reveal). Local scoring echoes back the questions it was
 * given; server scoring returns the server's own copy, because a
 * signed-in client holds no bank to recompute review content from.
 */
export interface ScoredSubmission {
  result: ExamResult;
  reviewQuestions: readonly ReviewQuestion[];
}

/**
 * Boundary between "an exam attempt was answered" and "here is the
 * score". Scoring always needs the full authoring question set — answer
 * keys included — so this interface exists to name that dependency
 * explicitly and make it swappable: ServerAuthoritativeScoringService
 * implements this same interface against the server submit endpoint
 * without the store or UI that calls it changing at all.
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
  ): ScoredSubmission | Promise<ScoredSubmission>;
}

/**
 * Scores entirely in the browser, against a question bank the guest flow
 * fetched client-side.
 *
 * This is NOT tamper-resistant. A guest can read the bank — including
 * every answer key — from the network response that delivered it; nothing
 * server-side verifies a submitted response. It is suitable only for the
 * low-stakes local practice guests get.
 *
 * Do not wire this into any mode that claims to be a trusted, proctored,
 * or graded assessment: signed-in sessions must use
 * ServerAuthoritativeScoringService. See docs/ASSESSMENT_SECURITY_MODEL.md
 * for the full threat model.
 */
export const localPracticeScoringService: AssessmentScoringService = {
  score: (questions, responses, context) => ({
    result: buildExamResult(questions, responses, context),
    reviewQuestions: questions,
  }),
};
