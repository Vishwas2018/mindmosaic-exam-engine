import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

import { scoreResponse, type ScoreStatus } from "./question-scorers";

export type { ScoreStatus } from "./question-scorers";

export interface QuestionScore {
  questionId: string;
  status: ScoreStatus;
  awardedMarks: number;
  availableMarks: number;
  /** True for manually marked question types, attempted or not. */
  requiresManualMarking: boolean;
}

/**
 * Score a single question by delegating to the pure per-type scorer and
 * adapting its result into the aggregate-friendly QuestionScore shape.
 * Manual-review outcomes award no marks until an assessor reviews them.
 */
export function scoreQuestion(
  question: Question,
  answer: CandidateAnswer | undefined,
): QuestionScore {
  const result = scoreResponse(question, answer);
  return {
    questionId: question.id,
    status: result.status,
    awardedMarks: result.earnedMarks ?? 0,
    availableMarks: result.availableMarks,
    requiresManualMarking: result.requiresManualMarking,
  };
}
