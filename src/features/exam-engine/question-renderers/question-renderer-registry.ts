import type {
  QuestionRendererComponent,
  QuestionType,
} from "@/features/exam-engine/types";

import { MultipleChoiceRenderer } from "./MultipleChoiceRenderer";
import { NumberEntryRenderer } from "./NumberEntryRenderer";
import { UnsupportedQuestionRenderer } from "./UnsupportedQuestionRenderer";

const renderers = {
  multiple_choice: MultipleChoiceRenderer,
  number_entry: NumberEntryRenderer,
} satisfies Partial<Record<QuestionType, QuestionRendererComponent>>;

export type SupportedQuestionRendererType = keyof typeof renderers;

function isSupportedType(type: string): type is SupportedQuestionRendererType {
  return Object.hasOwn(renderers, type);
}

export const questionRendererRegistry = Object.freeze({
  resolve(type: string): QuestionRendererComponent {
    return isSupportedType(type) ? renderers[type] : UnsupportedQuestionRenderer;
  },

  supports: isSupportedType,

  supportedTypes: Object.freeze(
    Object.keys(renderers) as SupportedQuestionRendererType[],
  ),
});
