import type { Question } from "@/schemas/question.schema";

/**
 * Minimal question shapes for exercising pattern selection and readiness.
 *
 * Deliberately built by hand rather than parsed through `questionSchema`:
 * these suites are about which questions get DRAWN, and the selection path
 * reads exactly six fields (id, yearLevel, examStyle, type, stimulus and
 * metadata.subject/strand). Round-tripping every fixture through the schema
 * would mean inventing answer keys, explanations and option sets that no
 * assertion here looks at, and would make a 400-question bank slow to build.
 * The real banks are schema-validated where it matters — by
 * `validate:questions` and the content suites.
 */
export interface BankQuestionSpec {
  id: string;
  yearLevel?: 3 | 5;
  examStyle?: "naplan_style" | "icas_style";
  subject?: string;
  strand?: string;
  type?: string;
  /** Stimulus title; questions sharing one are one selection group. */
  stimulus?: string;
}

export function bankQuestion(spec: BankQuestionSpec): Question {
  return {
    id: spec.id,
    type: spec.type ?? "multiple_choice",
    yearLevel: spec.yearLevel ?? 3,
    examStyle: spec.examStyle ?? "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: `Prompt ${spec.id}`,
    options: [],
    visuals: [],
    stimulus:
      spec.stimulus === undefined
        ? undefined
        : {
            title: spec.stimulus,
            body: `Passage body for ${spec.stimulus}`,
            attribution: "MindMosaic original",
          },
    answerKey: { kind: "single_option", optionId: "a" },
    explanation: `Explanation ${spec.id}`,
    metadata: {
      subject: spec.subject ?? "numeracy",
      strand: spec.strand ?? "Number",
      topic: "Topic",
      difficulty: "easy",
      estimatedTimeSeconds: 60,
    },
  } as unknown as Question;
}

/** `count` questions sharing one stimulus — one whole selection group. */
export function stimulusGroup(
  stimulus: string,
  count: number,
  overrides: Omit<BankQuestionSpec, "id" | "stimulus"> = {},
): Question[] {
  return Array.from({ length: count }, (_, index) =>
    bankQuestion({
      ...overrides,
      id: `${stimulus}-q${index + 1}`,
      stimulus,
    }),
  );
}

/** `count` standalone questions with a shared prefix. */
export function bankQuestions(
  prefix: string,
  count: number,
  overrides: Omit<BankQuestionSpec, "id"> = {},
): Question[] {
  return Array.from({ length: count }, (_, index) =>
    bankQuestion({ ...overrides, id: `${prefix}-${index + 1}` }),
  );
}
