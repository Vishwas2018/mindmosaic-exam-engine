import type { ComponentType } from "react";

import type { VisualAsset } from "@/schemas/visual.schema";

import type { CandidateQuestion } from "./candidate-question";
import type { CandidateAnswer } from "./response";

export interface QuestionRendererProps {
  question: CandidateQuestion;
  answer?: CandidateAnswer;
  onAnswerChange?: (answer: CandidateAnswer) => void;
  disabled?: boolean;
}

export interface VisualRendererProps {
  visual: VisualAsset;
  className?: string;
}

export type QuestionRendererComponent = ComponentType<QuestionRendererProps>;
export type VisualRendererComponent = ComponentType<VisualRendererProps>;
