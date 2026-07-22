import { z } from "zod";

import { SUBJECT_IDS } from "@/features/taxonomy/subject-registry";
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
export const EXAM_STYLES = ["naplan_style", "icas_style"] as const;
export const QUESTION_STATUSES = [
  "draft",
  "reviewed",
  "published",
  "rejected",
] as const;
export const QUESTION_ORIGINS = ["original_seed"] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
export const yearLevelSchema = z.union([z.literal(3), z.literal(5)]);
export const examStyleSchema = z.enum(EXAM_STYLES);
export const questionStatusSchema = z.enum(QUESTION_STATUSES);
export const questionOriginSchema = z.enum(QUESTION_ORIGINS);

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

function hasUniqueIds<T extends { id: string }>(items: readonly T[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

export const questionOptionSchema = z.object({
  id: identifierSchema,
  text: z.string().trim().min(1).max(300),
  accessibleLabel: z.string().trim().min(1).max(300).optional(),
});

export const questionMetadataSchema = z.object({
  subject: z.enum(SUBJECT_IDS),
  strand: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(100),
  skill: z.string().trim().min(1).max(100).optional(),
  difficulty: z.enum(["easy", "medium", "challenging"]),
  marks: z.number().int().positive().max(20).default(1),
  estimatedTimeSeconds: z.number().int().positive().max(3600),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  locale: z.literal("en-AU").default("en-AU"),
  source: z.literal("original").default("original"),
  schemaVersion: z.number().int().positive().default(1),
});

/* Answer keys */

const singleOptionAnswerKeySchema = z.object({
  kind: z.literal("single_option"),
  optionId: identifierSchema,
});

const multipleOptionsAnswerKeySchema = z.object({
  kind: z.literal("multiple_options"),
  optionIds: uniqueIdentifierArraySchema(2),
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

const fillBlankAnswerKeySchema = z.object({
  kind: z.literal("fill_blank"),
  blanks: z
    .array(
      z.object({
        id: identifierSchema,
        acceptedAnswers: z
          .array(z.string().trim().min(1).max(200))
          .min(1)
          .max(20),
      }),
    )
    .min(1)
    .max(10)
    .refine(hasUniqueIds, { message: "Blank IDs must be unique." }),
  caseSensitive: z.boolean().default(false),
  trimWhitespace: z.boolean().default(true),
});

const dropdownAnswerKeySchema = z.object({
  kind: z.literal("dropdown"),
  fields: z
    .array(
      z.object({
        id: identifierSchema,
        correctOptionId: identifierSchema,
      }),
    )
    .min(1)
    .max(8)
    .refine(hasUniqueIds, { message: "Dropdown field IDs must be unique." }),
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
  minWords: z.number().int().positive().max(2000).optional(),
  maxWords: z.number().int().positive().max(5000).optional(),
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
  fillBlankAnswerKeySchema,
  dropdownAnswerKeySchema,
  booleanAnswerKeySchema,
  matchingAnswerKeySchema,
  orderingAnswerKeySchema,
  manualAnswerKeySchema,
  hotspotAnswerKeySchema,
  dragDropAnswerKeySchema,
]);

/* Interaction configuration (presentation for complex types) */

const interactionItemSchema = z.object({
  id: identifierSchema,
  text: z.string().trim().min(1).max(240),
});

const interactionSlotSchema = z.object({
  id: identifierSchema,
  label: z.string().trim().min(1).max(240),
});

const fillBlankInteractionSchema = z.object({
  type: z.literal("fill_blank"),
  segments: z
    .array(z.string().max(400))
    .max(20)
    .default([]),
  blanks: z
    .array(
      z.object({
        id: identifierSchema,
        label: z.string().trim().min(1).max(120),
      }),
    )
    .min(1)
    .max(10)
    .refine(hasUniqueIds, { message: "Blank IDs must be unique." }),
});

const dropdownInteractionSchema = z.object({
  type: z.literal("dropdown"),
  fields: z
    .array(
      z.object({
        id: identifierSchema,
        label: z.string().trim().min(1).max(120),
        options: z
          .array(interactionItemSchema)
          .min(2)
          .max(8)
          .refine(hasUniqueIds, {
            message: "Dropdown option IDs must be unique.",
          }),
      }),
    )
    .min(1)
    .max(8)
    .refine(hasUniqueIds, { message: "Dropdown field IDs must be unique." }),
});

const matchingInteractionSchema = z.object({
  type: z.literal("matching"),
  sources: z
    .array(interactionItemSchema)
    .min(1)
    .max(10)
    .refine(hasUniqueIds, { message: "Matching source IDs must be unique." }),
  targets: z
    .array(interactionItemSchema)
    .min(2)
    .max(10)
    .refine(hasUniqueIds, { message: "Matching target IDs must be unique." }),
});

const orderingInteractionSchema = z.object({
  type: z.literal("ordering"),
  items: z
    .array(interactionItemSchema)
    .min(2)
    .max(10)
    .refine(hasUniqueIds, { message: "Ordering item IDs must be unique." }),
});

const dragDropInteractionSchema = z.object({
  type: z.literal("drag_drop"),
  items: z
    .array(interactionItemSchema)
    .min(1)
    .max(10)
    .refine(hasUniqueIds, { message: "Drag item IDs must be unique." }),
  zones: z
    .array(interactionSlotSchema)
    .min(1)
    .max(10)
    .refine(hasUniqueIds, { message: "Drop zone IDs must be unique." }),
});

const labelDiagramInteractionSchema = z.object({
  type: z.literal("label_diagram"),
  labels: z
    .array(interactionItemSchema)
    .min(1)
    .max(12)
    .refine(hasUniqueIds, { message: "Diagram label IDs must be unique." }),
  targets: z
    .array(interactionSlotSchema)
    .min(1)
    .max(12)
    .refine(hasUniqueIds, { message: "Diagram target IDs must be unique." }),
});

export const interactionSchema = z.discriminatedUnion("type", [
  fillBlankInteractionSchema,
  dropdownInteractionSchema,
  matchingInteractionSchema,
  orderingInteractionSchema,
  dragDropInteractionSchema,
  labelDiagramInteractionSchema,
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
  examStyle: examStyleSchema,
  status: questionStatusSchema,
  origin: questionOriginSchema.default("original_seed"),
  prompt: z.string().trim().min(1).max(2000),
  instructions: z.string().trim().min(1).max(800).optional(),
  stimulus: stimulusSchema.optional(),
  options: z.array(questionOptionSchema).max(30).default([]),
  interaction: interactionSchema.optional(),
  visuals: z.array(visualSchema).max(6).default([]),
  answerKey: answerKeySchema,
  explanation: z.string().trim().min(1).max(3000),
  metadata: questionMetadataSchema,
});

type AnswerKindInternal = z.infer<typeof answerKeySchema>["kind"];
type InteractionTypeInternal = z.infer<typeof interactionSchema>["type"];

const compatibleAnswerKinds: Record<
  (typeof QUESTION_TYPES)[number],
  readonly AnswerKindInternal[]
> = {
  multiple_choice: ["single_option"],
  multiple_select: ["multiple_options"],
  number_entry: ["number"],
  fill_blank: ["fill_blank"],
  dropdown: ["dropdown"],
  true_false: ["boolean"],
  matching: ["matching"],
  ordering: ["ordering"],
  short_answer: ["text", "manual"],
  reading_comprehension: ["single_option", "multiple_options", "text", "boolean"],
  essay: ["manual"],
  label_diagram: ["matching"],
  hotspot: ["hotspot"],
  drag_drop: ["drag_drop"],
};

const requiredInteractionType: Partial<
  Record<(typeof QUESTION_TYPES)[number], InteractionTypeInternal>
> = {
  fill_blank: "fill_blank",
  dropdown: "dropdown",
  matching: "matching",
  ordering: "ordering",
  drag_drop: "drag_drop",
  label_diagram: "label_diagram",
};

const typesRequiringOptions = new Set(["multiple_choice", "multiple_select"]);

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
      : question.answerKey.kind === "multiple_options"
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

  const expectedInteraction = requiredInteractionType[question.type];
  if (expectedInteraction) {
    if (!question.interaction) {
      context.addIssue({
        code: "custom",
        message: `${question.type} questions require an '${expectedInteraction}' interaction configuration.`,
        path: ["interaction"],
      });
    } else if (question.interaction.type !== expectedInteraction) {
      context.addIssue({
        code: "custom",
        message: `${question.type} questions require an '${expectedInteraction}' interaction, not '${question.interaction.type}'.`,
        path: ["interaction", "type"],
      });
    }
  }

  const { interaction, answerKey } = question;

  if (interaction?.type === "fill_blank" && answerKey.kind === "fill_blank") {
    const blankIds = new Set(interaction.blanks.map((blank) => blank.id));
    const keyIds = new Set(answerKey.blanks.map((blank) => blank.id));
    if (
      blankIds.size !== keyIds.size ||
      [...keyIds].some((id) => !blankIds.has(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "Answer-key blanks must match the interaction blanks.",
        path: ["answerKey", "blanks"],
      });
    }
  }

  if (interaction?.type === "dropdown" && answerKey.kind === "dropdown") {
    const fieldById = new Map(interaction.fields.map((field) => [field.id, field]));
    if (interaction.fields.length !== answerKey.fields.length) {
      context.addIssue({
        code: "custom",
        message: "Each dropdown field requires exactly one correct value.",
        path: ["answerKey", "fields"],
      });
    }
    answerKey.fields.forEach((field, index) => {
      const definition = fieldById.get(field.id);
      if (!definition) {
        context.addIssue({
          code: "custom",
          message: `Answer key references unknown dropdown field '${field.id}'.`,
          path: ["answerKey", "fields", index],
        });
        return;
      }
      if (!definition.options.some((option) => option.id === field.correctOptionId)) {
        context.addIssue({
          code: "custom",
          message: `Dropdown field '${field.id}' has no option '${field.correctOptionId}'.`,
          path: ["answerKey", "fields", index],
        });
      }
    });
  }

  if (interaction?.type === "matching" && answerKey.kind === "matching") {
    const sourceIds = new Set(interaction.sources.map((source) => source.id));
    const targetIds = new Set(interaction.targets.map((target) => target.id));
    if (answerKey.pairs.length !== interaction.sources.length) {
      context.addIssue({
        code: "custom",
        message: "Every matching source must have exactly one correct pair.",
        path: ["answerKey", "pairs"],
      });
    }
    answerKey.pairs.forEach((pair, index) => {
      if (!sourceIds.has(pair.sourceId)) {
        context.addIssue({
          code: "custom",
          message: `Matching pair references unknown source '${pair.sourceId}'.`,
          path: ["answerKey", "pairs", index, "sourceId"],
        });
      }
      if (!targetIds.has(pair.targetId)) {
        context.addIssue({
          code: "custom",
          message: `Matching pair references unknown target '${pair.targetId}'.`,
          path: ["answerKey", "pairs", index, "targetId"],
        });
      }
    });
  }

  if (interaction?.type === "ordering" && answerKey.kind === "ordering") {
    const itemIds = new Set(interaction.items.map((item) => item.id));
    if (
      itemIds.size !== answerKey.optionIds.length ||
      answerKey.optionIds.some((id) => !itemIds.has(id))
    ) {
      context.addIssue({
        code: "custom",
        message: "Ordering answer key must list every interaction item exactly once.",
        path: ["answerKey", "optionIds"],
      });
    }
  }

  if (interaction?.type === "drag_drop" && answerKey.kind === "drag_drop") {
    const itemIds = new Set(interaction.items.map((item) => item.id));
    const zoneIds = new Set(interaction.zones.map((zone) => zone.id));
    Object.entries(answerKey.placements).forEach(([itemId, zoneId]) => {
      if (!itemIds.has(itemId)) {
        context.addIssue({
          code: "custom",
          message: `Drag-drop placement references unknown item '${itemId}'.`,
          path: ["answerKey", "placements", itemId],
        });
      }
      if (!zoneIds.has(zoneId)) {
        context.addIssue({
          code: "custom",
          message: `Drag-drop placement references unknown zone '${zoneId}'.`,
          path: ["answerKey", "placements", itemId],
        });
      }
    });
  }

  if (interaction?.type === "label_diagram" && answerKey.kind === "matching") {
    const labelIds = new Set(interaction.labels.map((label) => label.id));
    const targetIds = new Set(interaction.targets.map((target) => target.id));
    answerKey.pairs.forEach((pair, index) => {
      if (!labelIds.has(pair.sourceId)) {
        context.addIssue({
          code: "custom",
          message: `Label mapping references unknown label '${pair.sourceId}'.`,
          path: ["answerKey", "pairs", index, "sourceId"],
        });
      }
      if (!targetIds.has(pair.targetId)) {
        context.addIssue({
          code: "custom",
          message: `Label mapping references unknown target '${pair.targetId}'.`,
          path: ["answerKey", "pairs", index, "targetId"],
        });
      }
    });
  }

  if (question.type === "reading_comprehension" && !question.stimulus) {
    context.addIssue({
      code: "custom",
      message: "Reading comprehension questions require a passage stimulus.",
      path: ["stimulus"],
    });
  }

  if (
    (question.answerKey.kind === "single_option" ||
      question.answerKey.kind === "multiple_options") &&
    question.type === "reading_comprehension" &&
    question.options.length < 2
  ) {
    context.addIssue({
      code: "custom",
      message: "Option-based reading comprehension requires at least two options.",
      path: ["options"],
    });
  }

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
export type ExamStyle = z.infer<typeof examStyleSchema>;
export type QuestionStatus = z.infer<typeof questionStatusSchema>;
export type QuestionOrigin = z.infer<typeof questionOriginSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type QuestionMetadata = z.infer<typeof questionMetadataSchema>;
export type AnswerKey = z.infer<typeof answerKeySchema>;
export type AnswerKind = AnswerKey["kind"];
export type Interaction = z.infer<typeof interactionSchema>;
export type InteractionType = Interaction["type"];
export type FillBlankInteraction = z.infer<typeof fillBlankInteractionSchema>;
export type DropdownInteraction = z.infer<typeof dropdownInteractionSchema>;
export type MatchingInteraction = z.infer<typeof matchingInteractionSchema>;
export type OrderingInteraction = z.infer<typeof orderingInteractionSchema>;
export type DragDropInteraction = z.infer<typeof dragDropInteractionSchema>;
export type LabelDiagramInteraction = z.infer<typeof labelDiagramInteractionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionInput = z.input<typeof questionSchema>;
