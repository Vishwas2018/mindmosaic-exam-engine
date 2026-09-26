import type { ComponentType } from "react";

import type { AnswerKey } from "@/schemas/question.schema";
import type { VisualAsset } from "@/schemas/visual.schema";

import type { CandidateQuestion } from "./candidate-question";
import type { CandidateAnswer } from "./response";

/** Mirrors ScoreStatus | "skipped" (scoring/question-scorers.ts's PracticeQuestionStatus) structurally, without importing it — scoring/ already imports from types/, so the reverse import would cycle. */
export type RevealStatus =
  | "correct"
  | "incorrect"
  | "manual_review"
  | "unanswered"
  | "skipped";

/**
 * Practice-mode-only: the full, ungated answer key for a checked question,
 * threaded down so renderers can highlight individual options/elements.
 * Never populated for exam/diagnostic/showcase callers — those never
 * construct one, so `CandidateQuestion`'s stripped, answer-key-free shape
 * stays exactly as withheld as it always was for them (docs/
 * ASSESSMENT_SECURITY_MODEL.md). Practice mode already holds the full
 * `Question` (including `answerKey`) client-side by design — see
 * practice-mode/practice-reducer.ts's own doc comment.
 */
export interface QuestionReveal {
  status: RevealStatus;
  answerKey: AnswerKey;
}

export interface QuestionRendererProps {
  question: CandidateQuestion;
  answer?: CandidateAnswer;
  onAnswerChange?: (answer: CandidateAnswer) => void;
  disabled?: boolean;
  /** Optional, practice-mode-only — see QuestionReveal's doc comment. */
  reveal?: QuestionReveal;
}

export interface VisualRendererProps {
  visual: VisualAsset;
  className?: string;
}

export type QuestionRendererComponent = ComponentType<QuestionRendererProps>;
export type VisualRendererComponent = ComponentType<VisualRendererProps>;
