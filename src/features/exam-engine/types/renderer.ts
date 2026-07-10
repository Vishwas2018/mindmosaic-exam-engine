import type { ComponentType } from "react";

import type { Question } from "@/schemas/question.schema";
import type { VisualAsset } from "@/schemas/visual.schema";

import type { CandidateAnswer } from "./response";

export interface QuestionRendererProps {
  question: Question;
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
