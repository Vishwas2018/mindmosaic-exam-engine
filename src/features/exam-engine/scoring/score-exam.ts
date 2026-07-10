import type { ExamResponses } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

import { scoreQuestion, type QuestionScore } from "./score-question";

export interface ExamScore {
  awardedMarks: number;
  availableMarks: number;
  scoredAvailableMarks: number;
  pendingManualMarks: number;
  percentage: number;
  isProvisional: boolean;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  manualReviewCount: number;
  questionScores: readonly QuestionScore[];
}

export function scoreExam(
  questions: readonly Question[],
  responses: ExamResponses,
): ExamScore {
  const questionScores = questions.map((question) =>
    scoreQuestion(question, responses[question.id]),
  );
  const awardedMarks = questionScores.reduce(
    (total, result) => total + result.awardedMarks,
    0,
  );
  const availableMarks = questionScores.reduce(
    (total, result) => total + result.availableMarks,
    0,
  );
  const scoredAvailableMarks = questionScores.reduce(
    (total, result) =>
      result.status === "manual_review"
        ? total
        : total + result.availableMarks,
    0,
  );
  const pendingManualMarks = availableMarks - scoredAvailableMarks;

  return {
    awardedMarks,
    availableMarks,
    scoredAvailableMarks,
    pendingManualMarks,
    percentage:
      scoredAvailableMarks === 0
        ? 0
        : Math.round((awardedMarks / scoredAvailableMarks) * 100),
    correctCount: questionScores.filter((result) => result.status === "correct")
      .length,
    incorrectCount: questionScores.filter(
      (result) => result.status === "incorrect",
    ).length,
    unansweredCount: questionScores.filter(
      (result) => result.status === "unanswered",
    ).length,
    manualReviewCount: questionScores.filter(
      (result) => result.status === "manual_review",
    ).length,
    isProvisional: pendingManualMarks > 0,
    questionScores,
  };
}

export const scoreAssessment = scoreExam;
