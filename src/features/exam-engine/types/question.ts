/*
 * No `YEAR_LEVELS` re-export. The product's year range is
 * `src/features/taxonomy/year-registry.ts` `YEAR_LEVELS` and nothing else
 * (ADR-001 §1); what this barrel used to re-export under that name was the
 * content-availability gate now called `SUPPORTED_CONTENT_YEAR_LEVELS`, which
 * is imported from `@/schemas/question.schema` directly by the one test that
 * asserts it. Re-exporting it here is what made the collision reachable from
 * exam-engine code.
 */
export {
  EXAM_STYLES,
  QUESTION_ORIGINS,
  QUESTION_STATUSES,
  QUESTION_TYPES,
  QuestionSchema,
  answerKeySchema,
  examStyleSchema,
  interactionSchema,
  questionMetadataSchema,
  questionOptionSchema,
  questionOriginSchema,
  questionSchema,
  questionStatusSchema,
  questionTypeSchema,
  yearLevelSchema,
} from "@/schemas/question.schema";

export type {
  AnswerKey,
  AnswerKind,
  DragDropInteraction,
  DropdownInteraction,
  ExamStyle,
  FillBlankInteraction,
  Interaction,
  InteractionType,
  LabelDiagramInteraction,
  MatchingInteraction,
  OrderingInteraction,
  Question,
  QuestionInput,
  QuestionMetadata,
  QuestionOption,
  QuestionOrigin,
  QuestionStatus,
  QuestionType,
  YearLevel,
} from "@/schemas/question.schema";
