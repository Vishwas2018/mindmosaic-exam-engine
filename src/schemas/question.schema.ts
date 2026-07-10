import { z } from "zod";

import { visualSchema } from "@/schemas/visual.schema";

export const QUESTION_TYPES = [
  "multiple_choice",
  "multiple_select",
  "number_entry",
  "fill_blank",
  "dropdown",
  "true_false",
  "matching",
  "ordering",
  "short_answer",
  "reading_comprehension",
  "essay",
  "label_diagram",
  "hotspot",
  "drag_drop",
] as const;

export const YEAR_LEVELS = [3, 5] as const;
export const EXAM_MODES = ["naplan", "icas"] as const;
export const QUESTION_STATUSES = ["draft", "published"] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const yearLevelSchema = z.union([z.literal(3), z.literal(5)]);
export const examModeSchema = z.enum(EXAM_MODES);
export const questionStatusSchema = z.enum(QUESTION_STATUSES);

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    "Use lower-case letters, numbers, hyphens or underscores.",
  );

function uniqueIdentifierArraySchema(minimumLength: number) {
  return z
    .array(identifierSchema)
    .min(minimumLength)
    .refine((values) => new Set(values).size === values.length, {
      message: "Identifiers must be unique.",
    });
}

export const questionOptionSchema = z.object({
  id: identifierSchema,
  text: z.string().trim().min(1).max(300),
  accessibleLabel: z.string().trim().min(1).max(300).optional(),
});

export const questionMetadataSchema = z.object({
  subject: z.enum(["numeracy", "reading", "writing", "language_conventions"]),
  strand: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(100),
  difficulty: z.enum(["easy", "medium", "challenging"]),
  marks: z.number().int().positive().max(20).default(1),
  estimatedTimeSeconds: z.number().int().positive().max(3600),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  locale: z.literal("en-AU").default("en-AU"),
  source: z.literal("original").default("original"),
  schemaVersion: z.number().int().positive().default(1),
});

const singleOptionAnswerKeySchema = z.object({
  kind: z.literal("single_option"),
  optionId: identifierSchema,
});

const multipleOptionsAnswerKeySchema = z.object({
  kind: z.literal("multiple_options"),
  optionIds: uniqueIdentifierArraySchema(1),
});

const numberAnswerKeySchema = z.object({
  kind: z.literal("number"),
  value: z.number().finite(),
  tolerance: z.number().finite().nonnegative().default(0),
  unit: z.string().trim().min(1).max(40).optional(),
});

const textAnswerKeySchema = z.object({
  kind: z.literal("text"),
  acceptableAnswers: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
  caseSensitive: z.boolean().default(false),
  trimWhitespace: z.boolean().default(true),
});

const booleanAnswerKeySchema = z.object({
  kind: z.literal("boolean"),
  value: z.boolean(),
});

const matchingAnswerKeySchema = z.object({
  kind: z.literal("matching"),
  pairs: z
    .array(
      z.object({
        sourceId: identifierSchema,
        targetId: identifierSchema,
      }),
    )
    .min(1)
    .superRefine((pairs, context) => {
      const sourceIds = pairs.map((pair) => pair.sourceId);
      if (new Set(sourceIds).size !== sourceIds.length) {
        context.addIssue({
          code: "custom",
          message: "Each matching source may appear only once.",
        });
      }
    }),
});

const orderingAnswerKeySchema = z.object({
  kind: z.literal("ordering"),
  optionIds: uniqueIdentifierArraySchema(2),
});

const manualAnswerKeySchema = z.object({
  kind: z.literal("manual"),
  rubric: z.string().trim().min(10).max(3000),
  sampleResponse: z.string().trim().min(1).max(3000).optional(),
});

const hotspotAnswerKeySchema = z.object({
  kind: z.literal("hotspot"),
  regionIds: uniqueIdentifierArraySchema(1),
});

const dragDropAnswerKeySchema = z.object({
  kind: z.literal("drag_drop"),
  placements: z
    .record(identifierSchema, identifierSchema)
    .refine((placements) => Object.keys(placements).length > 0, {
      message: "At least one drag-and-drop placement is required.",
    }),
});

export const answerKeySchema = z.discriminatedUnion("kind", [
  singleOptionAnswerKeySchema,
  multipleOptionsAnswerKeySchema,
  numberAnswerKeySchema,
  textAnswerKeySchema,
  booleanAnswerKeySchema,
  matchingAnswerKeySchema,
  orderingAnswerKeySchema,
  manualAnswerKeySchema,
  hotspotAnswerKeySchema,
  dragDropAnswerKeySchema,
]);

const stimulusSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  body: z.string().trim().min(1).max(8000),
  attribution: z.literal("MindMosaic original").default("MindMosaic original"),
});

export const questionBaseSchema = z.object({
  id: identifierSchema,
  type: questionTypeSchema,
  yearLevel: yearLevelSchema,
  examMode: examModeSchema,
  status: questionStatusSchema,
  prompt: z.string().trim().min(1).max(2000),
  instructions: z.string().trim().min(1).max(800).optional(),
  stimulus: stimulusSchema.optional(),
  options: z.array(questionOptionSchema).max(30).default([]),
  visuals: z.array(visualSchema).max(6).default([]),
  answerKey: answerKeySchema,
  explanation: z.string().trim().min(1).max(3000),
  metadata: questionMetadataSchema,
});

const compatibleAnswerKinds: Record<
  (typeof QUESTION_TYPES)[number],
  readonly z.infer<typeof answerKeySchema>["kind"][]
> = {
  multiple_choice: ["single_option"],
  multiple_select: ["multiple_options"],
  number_entry: ["number"],
  fill_blank: ["text"],
  dropdown: ["single_option"],
  true_false: ["boolean"],
  matching: ["matching"],
  ordering: ["ordering"],
  short_answer: ["text", "manual"],
  reading_comprehension: ["single_option", "multiple_options", "text", "boolean"],
  essay: ["manual"],
  label_diagram: ["matching", "text"],
  hotspot: ["hotspot"],
  drag_drop: ["drag_drop"],
};

const typesRequiringOptions = new Set([
  "multiple_choice",
  "multiple_select",
  "dropdown",
  "ordering",
]);

export const questionSchema = questionBaseSchema.superRefine((question, context) => {
  const optionIds = question.options.map((option) => option.id);
  const uniqueOptionIds = new Set(optionIds);
  const visualIds = question.visuals.map((visual) => visual.id);

  if (optionIds.length !== uniqueOptionIds.size) {
    context.addIssue({
      code: "custom",
      message: "Question option IDs must be unique.",
      path: ["options"],
    });
  }

  if (new Set(visualIds).size !== visualIds.length) {
    context.addIssue({
      code: "custom",
      message: "Question visual IDs must be unique.",
      path: ["visuals"],
    });
  }

  if (typesRequiringOptions.has(question.type) && question.options.length < 2) {
    context.addIssue({
      code: "custom",
      message: `${question.type} questions require at least two options.`,
      path: ["options"],
    });
  }

  if (!compatibleAnswerKinds[question.type].includes(question.answerKey.kind)) {
    context.addIssue({
      code: "custom",
      message: `${question.answerKey.kind} is not a compatible answer key for ${question.type}.`,
      path: ["answerKey", "kind"],
    });
  }

  const referencedOptionIds =
    question.answerKey.kind === "single_option"
      ? [question.answerKey.optionId]
      : question.answerKey.kind === "multiple_options" ||
          question.answerKey.kind === "ordering"
        ? question.answerKey.optionIds
        : [];

  referencedOptionIds.forEach((optionId) => {
    if (!uniqueOptionIds.has(optionId)) {
      context.addIssue({
        code: "custom",
        message: `Answer key references unknown option '${optionId}'.`,
        path: ["answerKey"],
      });
    }
  });

  if (question.type === "hotspot" && question.answerKey.kind === "hotspot") {
    const hotspotVisuals = question.visuals.filter(
      (visual) => visual.type === "hotspot_svg",
    );

    if (hotspotVisuals.length === 0) {
      context.addIssue({
        code: "custom",
        message: "Hotspot questions require a hotspot_svg visual.",
        path: ["visuals"],
      });
      return;
    }

    const availableRegionIds = hotspotVisuals.flatMap((visual) =>
      visual.data.regions.map((region) => region.id),
    );
    const uniqueRegionIds = new Set(availableRegionIds);

    if (uniqueRegionIds.size !== availableRegionIds.length) {
      context.addIssue({
        code: "custom",
        message: "Hotspot region IDs must be unique across the question.",
        path: ["visuals"],
      });
    }

    question.answerKey.regionIds.forEach((regionId) => {
      if (!uniqueRegionIds.has(regionId)) {
        context.addIssue({
          code: "custom",
          message: `Answer key references unknown hotspot region '${regionId}'.`,
          path: ["answerKey", "regionIds"],
        });
      }
    });
  }
});

export const QuestionSchema = questionSchema;

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type YearLevel = z.infer<typeof yearLevelSchema>;
export type ExamMode = z.infer<typeof examModeSchema>;
export type QuestionStatus = z.infer<typeof questionStatusSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type QuestionMetadata = z.infer<typeof questionMetadataSchema>;
export type AnswerKey = z.infer<typeof answerKeySchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionInput = z.input<typeof questionSchema>;
