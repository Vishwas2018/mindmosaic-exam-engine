import type {
  QuestionRendererComponent,
  QuestionType,
} from "@/features/exam-engine/types";

import { DragDropRenderer } from "./DragDropRenderer";
import { DropdownRenderer } from "./DropdownRenderer";
import { EssayRenderer } from "./EssayRenderer";
import { FillBlankRenderer } from "./FillBlankRenderer";
import { HotspotRenderer } from "./HotspotRenderer";
import { LabelDiagramRenderer } from "./LabelDiagramRenderer";
import { MatchingRenderer } from "./MatchingRenderer";
import { MultipleChoiceRenderer } from "./MultipleChoiceRenderer";
import { MultipleSelectRenderer } from "./MultipleSelectRenderer";
import { NumberEntryRenderer } from "./NumberEntryRenderer";
import { OrderingRenderer } from "./OrderingRenderer";
import { ReadingComprehensionRenderer } from "./ReadingComprehensionRenderer";
import { ShortAnswerRenderer } from "./ShortAnswerRenderer";
import { TrueFalseRenderer } from "./TrueFalseRenderer";
import { UnsupportedQuestionRenderer } from "./UnsupportedQuestionRenderer";

const renderers = {
  multiple_choice: MultipleChoiceRenderer,
  multiple_select: MultipleSelectRenderer,
  number_entry: NumberEntryRenderer,
  fill_blank: FillBlankRenderer,
  dropdown: DropdownRenderer,
  true_false: TrueFalseRenderer,
  matching: MatchingRenderer,
  ordering: OrderingRenderer,
  short_answer: ShortAnswerRenderer,
  reading_comprehension: ReadingComprehensionRenderer,
  essay: EssayRenderer,
  label_diagram: LabelDiagramRenderer,
  hotspot: HotspotRenderer,
  drag_drop: DragDropRenderer,
} satisfies Record<QuestionType, QuestionRendererComponent>;

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
