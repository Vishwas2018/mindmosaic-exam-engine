import type { DifficultyBand } from "@/features/adaptive-prototype";
import type { ExamStyle, Question, YearLevel } from "@/schemas/question.schema";

/** A minimal, valid multiple_choice/single_option Question literal. */
export function buildQuestion(params: {
  readonly id: string;
  readonly yearLevel: YearLevel;
  readonly examStyle: ExamStyle;
  readonly subject: string;
  readonly difficulty: DifficultyBand;
}): Question {
  return {
    id: params.id,
    type: "multiple_choice",
    yearLevel: params.yearLevel,
    examStyle: params.examStyle,
    status: "published",
    origin: "original_seed",
    prompt: `Prompt for ${params.id}`,
    options: [
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
    ],
    visuals: [],
    answerKey: { kind: "single_option", optionId: "a" },
    explanation: "Because A is correct.",
    metadata: {
      subject: params.subject as Question["metadata"]["subject"],
      strand: "test-strand",
      topic: "test-topic",
      difficulty: params.difficulty,
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  };
}

/** `count` questions for one (year, style, subject, band) cell, ids `${prefix}-1..count`. */
export function buildBand(
  prefix: string,
  count: number,
  params: {
    readonly yearLevel: YearLevel;
    readonly examStyle: ExamStyle;
    readonly subject: string;
    readonly difficulty: DifficultyBand;
  },
): Question[] {
  return Array.from({ length: count }, (_, index) => buildQuestion({ id: `${prefix}-${index + 1}`, ...params }));
}
