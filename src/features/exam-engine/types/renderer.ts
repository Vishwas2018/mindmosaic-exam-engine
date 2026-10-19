import type { ComponentType } from "react";

import type { VisualAsset } from "@/schemas/visual.schema";

import type { CandidateQuestion } from "./candidate-question";
import type { CandidateAnswer } from "./response";

// Presentation-only fields may describe draft programmes. Student allocation
// still accepts CandidateQuestion and the governed Question schema exclusively.
export type PresentationQuestion = Omit<CandidateQuestion, "examStyle" | "metadata"> & {
  examStyle: string;
  metadata: Omit<CandidateQuestion["metadata"], "subject" | "difficulty"> & { subject: string; difficulty: string };
};

export interface QuestionRendererProps {
  question: PresentationQuestion;
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
