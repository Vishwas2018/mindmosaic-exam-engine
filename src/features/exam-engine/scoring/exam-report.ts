import type { ExamResponses } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

import { isUnanswered, scoreResponse } from "./question-scorers";
import type { ScoreStatus } from "./question-scorers";

export type SubmissionReason = "user_submitted" | "timer_expired";

export interface QuestionResultDetail {
  questionId: string;
  status: ScoreStatus;
  attempted: boolean;
  /** This question type is never auto-marked, attempted or not. */
  requiresManualMarking: boolean;
  /** Attempted and awaiting a person's review; false for a blank essay. */
  pendingManualReview: boolean;
  awardedMarks: number;
  availableMarks: number;
}

export interface BreakdownRow {
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  manualReview: number;
  objectiveMarksEarned: number;
  objectiveMarksAvailable: number;
}

export interface ExamResult {
  totalQuestions: number;
  attemptedQuestions: number;
  autoMarkedQuestions: number;
  manualReviewQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  objectiveMarksEarned: number;
  objectiveMarksAvailable: number;
  /** Whole-number percentage of objective marks; 0 when none are available. */
  objectivePercentage: number;
  pendingManualMarks: number;
  timeTakenSeconds: number;
  submissionReason: SubmissionReason;
  startedAt: number;
  submittedAt: number;
  questionDetails: readonly QuestionResultDetail[];
  breakdowns: {
    byQuestionType: Readonly<Record<string, BreakdownRow>>;
    bySubject: Readonly<Record<string, BreakdownRow>>;
    bySkill: Readonly<Record<string, BreakdownRow>>;
    byDifficulty: Readonly<Record<string, BreakdownRow>>;
    byYearLevel: Readonly<Record<string, BreakdownRow>>;
    byExamStyle: Readonly<Record<string, BreakdownRow>>;
  };
}

function emptyRow(): BreakdownRow {
  return {
    total: 0,
    attempted: 0,
    correct: 0,
    incorrect: 0,
    unanswered: 0,
    manualReview: 0,
    objectiveMarksEarned: 0,
    objectiveMarksAvailable: 0,
  };
}

function accumulate(
  rows: Record<string, BreakdownRow>,
  dimension: string,
  detail: QuestionResultDetail,
): void {
  const row = (rows[dimension] ??= emptyRow());
  row.total += 1;
  if (detail.attempted) row.attempted += 1;
  if (detail.status === "correct") row.correct += 1;
  if (detail.status === "incorrect") row.incorrect += 1;
  if (detail.status === "unanswered") row.unanswered += 1;
  if (detail.pendingManualReview) row.manualReview += 1;
  if (!detail.requiresManualMarking) {
    row.objectiveMarksEarned += detail.awardedMarks;
    row.objectiveMarksAvailable += detail.availableMarks;
  }
}

export interface ExamResultContext {
  startedAt: number;
  submittedAt: number;
  submissionReason: SubmissionReason;
}

/**
 * Build the complete result for a submitted exam. Pure and side-effect free:
 * per-question outcomes come from the established scoring dispatcher, and
 * manual-review (essay) marks are excluded from every objective figure.
 */
export function buildExamResult(
  questions: readonly Question[],
  responses: ExamResponses,
  context: ExamResultContext,
): ExamResult {
  const questionDetails: QuestionResultDetail[] = questions.map((question) => {
    const answer = responses[question.id];
    const scored = scoreResponse(question, answer);
    return {
      questionId: question.id,
      status: scored.status,
      attempted: !isUnanswered(answer),
      requiresManualMarking: scored.requiresManualMarking,
      pendingManualReview: scored.manualReviewRequired,
      awardedMarks: scored.earnedMarks ?? 0,
      availableMarks: scored.availableMarks,
    };
  });

  const byQuestionType: Record<string, BreakdownRow> = {};
  const bySubject: Record<string, BreakdownRow> = {};
  const bySkill: Record<string, BreakdownRow> = {};
  const byDifficulty: Record<string, BreakdownRow> = {};
  const byYearLevel: Record<string, BreakdownRow> = {};
  const byExamStyle: Record<string, BreakdownRow> = {};

  questions.forEach((question, index) => {
    const detail = questionDetails[index];
    accumulate(byQuestionType, question.type, detail);
    accumulate(bySubject, question.metadata.subject, detail);
    accumulate(bySkill, question.metadata.skill ?? question.metadata.topic, detail);
    accumulate(byDifficulty, question.metadata.difficulty, detail);
    accumulate(byYearLevel, `year-${question.yearLevel}`, detail);
    accumulate(byExamStyle, question.examStyle, detail);
  });

  const manualDetails = questionDetails.filter((detail) => detail.pendingManualReview);
  const objectiveDetails = questionDetails.filter(
    (detail) => !detail.requiresManualMarking,
  );

  const objectiveMarksEarned = objectiveDetails.reduce(
    (sum, detail) => sum + detail.awardedMarks,
    0,
  );
  const objectiveMarksAvailable = objectiveDetails.reduce(
    (sum, detail) => sum + detail.availableMarks,
    0,
  );
  const pendingManualMarks = manualDetails.reduce(
    (sum, detail) => sum + detail.availableMarks,
    0,
  );

  return {
    totalQuestions: questions.length,
    attemptedQuestions: questionDetails.filter((detail) => detail.attempted).length,
    autoMarkedQuestions: objectiveDetails.length,
    manualReviewQuestions: manualDetails.length,
    correctCount: questionDetails.filter((detail) => detail.status === "correct").length,
    incorrectCount: questionDetails.filter((detail) => detail.status === "incorrect")
      .length,
    unansweredCount: questionDetails.filter((detail) => detail.status === "unanswered")
      .length,
    objectiveMarksEarned,
    objectiveMarksAvailable,
    objectivePercentage:
      objectiveMarksAvailable === 0
        ? 0
        : Math.round((objectiveMarksEarned / objectiveMarksAvailable) * 100),
    pendingManualMarks,
    timeTakenSeconds: Math.max(
      0,
      Math.round((context.submittedAt - context.startedAt) / 1000),
    ),
    submissionReason: context.submissionReason,
    startedAt: context.startedAt,
    submittedAt: context.submittedAt,
    questionDetails,
    breakdowns: {
      byQuestionType,
      bySubject,
      bySkill,
      byDifficulty,
      byYearLevel,
      byExamStyle,
    },
  };
}
