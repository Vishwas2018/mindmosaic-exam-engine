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
  "hot_text",
  "matrix_choice",
  "structured_response",
] as const;

/**
 * The year levels the SHIPPED QUESTION BANK actually holds — a
 * content-availability gate, not the product's supported year range.
 *
 * Renamed from `YEAR_LEVELS` by spec Phase 0 (ADR-001 §4). Under its old name
 * it collided with `YEAR_LEVELS` in `src/features/taxonomy/year-registry.ts`,
 * which is the canonical product range ([1..12]) and the one authority any
 * "which years does this product support" question resolves to. Two exported
 * constants with the same name and different meanings is how a Year 7 feature
 * ends up silently gated to Years 3 and 5.
 *
 * This is NOT the schema's validation authority: `yearLevelSchema` below
 * accepts Years 1-12, and has since expansion-plan T0a. Widening the schema did
 * not make content appear, and this constant is the honest record of that — the
 * curated, published and practice banks together hold Years 3 and 5 and nothing
 * else.
 *
 * Deliberately NOT derived from the registry by import: `question.schema.ts` ->
 * `year-registry.ts` would close a module cycle, because the registry imports
 * `ExamStyle`/`YearLevel` from here and `subject-registry.ts` (imported by this
 * file) imports the registry. That type-only edge is erased at runtime; a value
 * edge would not be. The relationship is enforced instead by
 * `src/tests/unit/year-authority.test.ts`, which asserts both that this is a
 * subset of the registry range and that it equals the distinct year levels
 * actually present in the published bank — so publishing Year 7 content fails
 * the suite until someone updates this deliberately.
 *
 * Surfaces that offer a year to a human derive their list from real coverage
 * (`src/features/taxonomy/coverage.ts`), never from this constant.
 */
export const SUPPORTED_CONTENT_YEAR_LEVELS = [3, 5] as const;
export const EXAM_STYLES = ["naplan_style", "icas_style"] as const;
export const QUESTION_STATUSES = [
  "draft",
  "reviewed",
  "published",
  "rejected",
] as const;
export const QUESTION_ORIGINS = ["original_seed"] as const;

export const questionTypeSchema = z.enum(QUESTION_TYPES);
/**
 * Years 1-12 (expansion-plan T0a). Was `3 | 5`, which is what the curated
 * bank happens to contain — not what the product addresses.
 *
 * Widening the schema does not make content appear: every existing question
 * is still Year 3 or Year 5, and every surface that offers a year to a
 * human derives its list from real coverage
 * (src/features/taxonomy/coverage.ts), not from this range. What this
 * changes is that a Year 7 question is now representable at all.
 *
 * The literal union is spelled out rather than built from a numeric range
 * so `YearLevel` stays a union of literals — `Record<YearLevel, ...>`
 * exhaustiveness checks in the factory depend on it.
 */
export const yearLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
  z.literal(10),
  z.literal(11),
  z.literal(12),
]);
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

export const questionOptionSchema = z
  .object({
    id: identifierSchema,
    // Empty is reserved for a visual-only option. Keeping the parsed output a
    // string preserves every existing text-option consumer.
    text: z.string().trim().max(300).default(""),
    visualId: identifierSchema.optional(),
    accessibleLabel: z.string().trim().min(1).max(300).optional(),
  })
  .superRefine((option, context) => {
    if (!option.text && !option.visualId) {
      context.addIssue({
        code: "custom",
        message: "An option requires text, a structured visual, or both.",
      });
    }
    if (!option.text && option.visualId && !option.accessibleLabel) {
      context.addIssue({
        code: "custom",
        message: "Visual-only options require an accessible label.",
        path: ["accessibleLabel"],
      });
    }
  });

export const AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/wav",
] as const;

const governedLocalAudioSourceSchema = z.object({
  kind: z.literal("governed_local"),
  path: z
    .string()
    .regex(
      /^\/media\/assessment\/[a-z0-9][a-z0-9/_-]*\.(?:mp3|m4a|ogg|wav)$/,
      "Local audio must use the governed /media/assessment namespace.",
    ),
});

const privateStorageAudioSourceSchema = z.object({
  kind: z.literal("private_storage"),
  bucket: z.literal("assessment-media"),
  objectPath: z
    .string()
    .regex(
      /^audio\/[a-z0-9][a-z0-9/_-]*\.(?:mp3|m4a|ogg|wav)$/,
      "Private audio must use the audio/ namespace and a supported extension.",
    ),
});

export const mediaAssetSchema = z.object({
  id: identifierSchema,
  kind: z.literal("audio"),
  source: z.discriminatedUnion("kind", [
    governedLocalAudioSourceSchema,
    privateStorageAudioSourceSchema,
  ]),
  mimeType: z.enum(AUDIO_MIME_TYPES),
  durationSeconds: z.number().positive().max(3600),
  title: z.string().trim().min(1).max(160),
  instruction: z.string().trim().min(1).max(400).optional(),
  playback: z.object({
    autoplay: z.literal(false).default(false),
    maxPlays: z.number().int().positive().max(20).optional(),
  }),
  transcript: z.object({
    visibility: z.enum(["learner", "review_only", "accommodation_only"]),
    text: z.string().trim().min(1).max(8000),
  }),
  accessibility: z.object({
    fallbackMessage: z.string().trim().min(1).max(400),
    accommodationRequiredWhenUnavailable: z.boolean().default(true),
  }),
  provenance: z.object({
    creator: z.string().trim().min(1).max(160),
    licence: z.string().trim().min(1).max(160),
    copyright: z.string().trim().min(1).max(240),
  }),
  integrity: z.object({
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sizeBytes: z.number().int().positive().max(50_000_000),
  }),
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

const hotTextAnswerKeySchema = z.object({
  kind: z.literal("hot_text"),
  regionIds: uniqueIdentifierArraySchema(1),
});

const matrixAnswerKeySchema = z.object({
  kind: z.literal("matrix"),
  cellIds: uniqueIdentifierArraySchema(1),
});

const automaticNumberPartKeySchema = z.object({
  id: identifierSchema,
  responseKind: z.literal("number"),
  marking: z.literal("automatic"),
  marks: z.number().int().positive().max(20),
  value: z.number().finite(),
  tolerance: z.number().finite().nonnegative().default(0),
});

const automaticTextPartKeySchema = z.object({
  id: identifierSchema,
  responseKind: z.literal("short_text"),
  marking: z.literal("automatic"),
  marks: z.number().int().positive().max(20),
  acceptableAnswers: z.array(z.string().trim().min(1).max(500)).min(1).max(30),
  caseSensitive: z.boolean().default(false),
  trimWhitespace: z.boolean().default(true),
});

const manualStructuredPartKeySchema = z.object({
  id: identifierSchema,
  responseKind: z.enum(["number", "short_text"]),
  marking: z.literal("manual"),
  marks: z.number().int().positive().max(20),
  rubric: z.string().trim().min(10).max(3000),
  rubricVersion: z.string().trim().min(1).max(80),
});

const structuredAnswerKeySchema = z.object({
  kind: z.literal("structured"),
  markingMode: z.enum(["automatic", "manual", "hybrid"]),
  parts: z
    .array(z.union([automaticNumberPartKeySchema, automaticTextPartKeySchema, manualStructuredPartKeySchema]))
    .min(1)
    .max(12)
    .refine(hasUniqueIds, { message: "Structured answer part IDs must be unique." }),
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
  hotTextAnswerKeySchema,
  matrixAnswerKeySchema,
  structuredAnswerKeySchema,
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
  presentation: z.enum(["select", "draw_lines"]).optional(),
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

const inlineGapSegmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().min(1).max(1000) }),
  z.object({ kind: z.literal("gap"), zoneId: identifierSchema }),
]);

const dragDropInteractionSchema = z
  .object({
    type: z.literal("drag_drop"),
    presentation: z
      .enum(["category_zones", "inline_gap", "graphic_gap"])
      .optional(),
    items: z
      .array(interactionItemSchema)
      .min(1)
      .max(10)
      .refine(hasUniqueIds, { message: "Drag item IDs must be unique." }),
    zones: z
      .array(
        interactionSlotSchema.extend({
          capacity: z.enum(["one", "multiple"]).optional(),
          visualId: identifierSchema.optional(),
          regionId: identifierSchema.optional(),
        }),
      )
      .min(1)
      .max(10)
      .refine(hasUniqueIds, { message: "Drop zone IDs must be unique." }),
    segments: z.array(inlineGapSegmentSchema).min(1).max(100).optional(),
  })
  .superRefine((interaction, context) => {
    if (interaction.presentation === "inline_gap") {
      if (!interaction.segments) {
        context.addIssue({ code: "custom", message: "Inline gap matching requires ordered text and gap segments.", path: ["segments"] });
        return;
      }
      const zoneIds = new Set(interaction.zones.map((zone) => zone.id));
      const referenced = interaction.segments
        .filter((segment): segment is Extract<z.infer<typeof inlineGapSegmentSchema>, { kind: "gap" }> => segment.kind === "gap")
        .map((segment) => segment.zoneId);
      if (referenced.length === 0) {
        context.addIssue({ code: "custom", message: "Inline gap matching requires at least one gap segment.", path: ["segments"] });
      }
      referenced.forEach((zoneId, index) => {
        if (!zoneIds.has(zoneId)) context.addIssue({ code: "custom", message: `Inline gap references unknown zone '${zoneId}'.`, path: ["segments", index] });
      });
      if (new Set(referenced).size !== referenced.length) {
        context.addIssue({ code: "custom", message: "Each inline gap zone may appear only once.", path: ["segments"] });
      }
      for (const zoneId of zoneIds) {
        if (!referenced.includes(zoneId)) context.addIssue({ code: "custom", message: `Inline gap zone '${zoneId}' is not placed in the segment sequence.`, path: ["segments"] });
      }
    }

    if (interaction.presentation === "graphic_gap") {
      const visualIds = new Set<string>();
      interaction.zones.forEach((zone, index) => {
        if (!zone.visualId || !zone.regionId) {
          context.addIssue({ code: "custom", message: "Every graphic gap zone requires visualId and regionId.", path: ["zones", index] });
        }
        if (zone.visualId) visualIds.add(zone.visualId);
      });
      if (visualIds.size > 1) {
        context.addIssue({ code: "custom", message: "All graphic gap zones must belong to one visual.", path: ["zones"] });
      }
    }
  });

const labelDiagramInteractionSchema = z
  .object({
    type: z.literal("label_diagram"),
    presentation: z.enum(["select", "direct_placement"]).optional(),
    labels: z
      .array(interactionItemSchema)
      .min(1)
      .max(12)
      .refine(hasUniqueIds, { message: "Diagram label IDs must be unique." }),
    targets: z
      .array(
        interactionSlotSchema.extend({
          visualId: identifierSchema.optional(),
          regionId: identifierSchema.optional(),
        }),
      )
      .min(1)
      .max(12)
      .refine(hasUniqueIds, { message: "Diagram target IDs must be unique." }),
  })
  .superRefine((interaction, context) => {
    if (interaction.presentation !== "direct_placement") return;
    const visualIds = new Set<string>();
    interaction.targets.forEach((target, index) => {
      if (!target.visualId || !target.regionId) {
        context.addIssue({ code: "custom", message: "Every direct-placement target requires visualId and regionId.", path: ["targets", index] });
      }
      if (target.visualId) visualIds.add(target.visualId);
    });
    if (visualIds.size > 1) {
      context.addIssue({ code: "custom", message: "All direct-placement targets must belong to one visual.", path: ["targets"] });
    }
  });

const hotTextSegmentSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), text: z.string().min(1).max(1000) }),
  z.object({
    kind: z.literal("selectable"),
    id: identifierSchema,
    text: z.string().min(1).max(500),
    accessibleLabel: z.string().trim().min(1).max(500).optional(),
  }),
]);

const hotTextInteractionSchema = z
  .object({
    type: z.literal("hot_text"),
    selectionMode: z.enum(["single", "multiple"]),
    minSelections: z.number().int().nonnegative().optional(),
    maxSelections: z.number().int().positive().optional(),
    segments: z.array(hotTextSegmentSchema).min(1).max(100),
  })
  .superRefine((interaction, context) => {
    const selectable = interaction.segments.filter(
      (segment): segment is Extract<z.infer<typeof hotTextSegmentSchema>, { kind: "selectable" }> =>
        segment.kind === "selectable",
    );
    const ids = selectable.map((segment) => segment.id);
    if (ids.length === 0) {
      context.addIssue({ code: "custom", message: "Hot text requires at least one selectable region.", path: ["segments"] });
    }
    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: "custom", message: "Hot-text region IDs must be unique.", path: ["segments"] });
    }
    if (interaction.selectionMode === "single" && interaction.maxSelections !== undefined && interaction.maxSelections !== 1) {
      context.addIssue({ code: "custom", message: "Single-selection hot text must have maxSelections equal to 1.", path: ["maxSelections"] });
    }
    const maximum = interaction.selectionMode === "single" ? 1 : (interaction.maxSelections ?? selectable.length);
    const minimum = interaction.minSelections ?? (interaction.selectionMode === "single" ? 1 : 1);
    if (minimum > maximum || maximum > selectable.length) {
      context.addIssue({ code: "custom", message: "Hot-text selection constraints exceed the available regions.", path: ["maxSelections"] });
    }
  });

const matrixChoiceInteractionSchema = z
  .object({
    type: z.literal("matrix_choice"),
    selectionMode: z.enum(["single_per_row", "multiple_per_row"]),
    rows: z.array(interactionItemSchema).min(1).max(20).refine(hasUniqueIds, {
      message: "Matrix row IDs must be unique.",
    }),
    columns: z.array(interactionItemSchema).min(2).max(12).refine(hasUniqueIds, {
      message: "Matrix column IDs must be unique.",
    }),
    cells: z
      .array(
        z.object({
          id: identifierSchema,
          rowId: identifierSchema,
          columnId: identifierSchema,
          selectable: z.boolean().default(true),
          accessibleLabel: z.string().trim().min(1).max(300).optional(),
        }),
      )
      .min(1)
      .max(240)
      .refine(hasUniqueIds, { message: "Matrix cell IDs must be unique." }),
    minSelections: z.number().int().nonnegative().optional(),
    maxSelections: z.number().int().positive().optional(),
    minSelectionsPerRow: z.number().int().nonnegative().optional(),
    maxSelectionsPerRow: z.number().int().positive().optional(),
  })
  .superRefine((interaction, context) => {
    const rowIds = new Set(interaction.rows.map((row) => row.id));
    const columnIds = new Set(interaction.columns.map((column) => column.id));
    const coordinates = new Set<string>();
    interaction.cells.forEach((cell, index) => {
      if (!rowIds.has(cell.rowId)) context.addIssue({ code: "custom", message: `Matrix cell references unknown row '${cell.rowId}'.`, path: ["cells", index, "rowId"] });
      if (!columnIds.has(cell.columnId)) context.addIssue({ code: "custom", message: `Matrix cell references unknown column '${cell.columnId}'.`, path: ["cells", index, "columnId"] });
      const coordinate = `${cell.rowId}\0${cell.columnId}`;
      if (coordinates.has(coordinate)) context.addIssue({ code: "custom", message: "Matrix coordinates may appear only once.", path: ["cells", index] });
      coordinates.add(coordinate);
    });
    const selectableCount = interaction.cells.filter((cell) => cell.selectable).length;
    const minimum = interaction.minSelections ?? interaction.rows.length;
    const maximum = interaction.maxSelections ?? selectableCount;
    if (minimum > maximum || maximum > selectableCount) context.addIssue({ code: "custom", message: "Matrix selection constraints exceed selectable cells.", path: ["maxSelections"] });
    interaction.rows.forEach((row, index) => {
      const rowSelectableCount = interaction.cells.filter((cell) => cell.rowId === row.id && cell.selectable).length;
      if (rowSelectableCount === 0) {
        context.addIssue({ code: "custom", message: `Matrix row '${row.id}' has no selectable cells.`, path: ["rows", index] });
      }
      const rowMinimum = interaction.minSelectionsPerRow ?? 1;
      const rowMaximum = interaction.selectionMode === "single_per_row"
        ? 1
        : (interaction.maxSelectionsPerRow ?? rowSelectableCount);
      if (rowMinimum > rowMaximum || rowMaximum > rowSelectableCount) {
        context.addIssue({ code: "custom", message: `Matrix row constraints exceed selectable cells in row '${row.id}'.`, path: ["rows", index] });
      }
    });
  });

const structuredResponseInteractionSchema = z
  .object({
    type: z.literal("structured_response"),
    parts: z
      .array(
        z.object({
          id: identifierSchema,
          label: z.string().trim().min(1).max(160),
          responseKind: z.enum(["number", "short_text"]),
          placeholder: z.string().trim().min(1).max(160).optional(),
          required: z.boolean().default(true),
        }),
      )
      .min(1)
      .max(12)
      .refine(hasUniqueIds, { message: "Structured response part IDs must be unique." }),
    finalAnswerPartId: identifierSchema.optional(),
    workingArea: z.object({
      enabled: z.boolean().default(false),
      label: z.string().trim().min(1).max(160).default("Working"),
      maxLength: z.number().int().positive().max(8000).default(3000),
    }).default({ enabled: false, label: "Working", maxLength: 3000 }),
  })
  .superRefine((interaction, context) => {
    if (interaction.finalAnswerPartId && !interaction.parts.some((part) => part.id === interaction.finalAnswerPartId)) {
      context.addIssue({ code: "custom", path: ["finalAnswerPartId"], message: "Final answer must reference a declared part." });
    }
  });

export const interactionSchema = z.discriminatedUnion("type", [
  fillBlankInteractionSchema,
  dropdownInteractionSchema,
  matchingInteractionSchema,
  orderingInteractionSchema,
  dragDropInteractionSchema,
  labelDiagramInteractionSchema,
  hotTextInteractionSchema,
  matrixChoiceInteractionSchema,
  structuredResponseInteractionSchema,
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
  media: z.array(mediaAssetSchema).max(4).optional(),
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
  hot_text: ["hot_text"],
  matrix_choice: ["matrix"],
  structured_response: ["structured"],
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
  hot_text: "hot_text",
  matrix_choice: "matrix_choice",
  structured_response: "structured_response",
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

  if (question.media && !hasUniqueIds(question.media)) {
    context.addIssue({
      code: "custom",
      message: "Question media IDs must be unique.",
      path: ["media"],
    });
  }

  question.options.forEach((option, index) => {
    if (option.visualId && !visualIds.includes(option.visualId)) {
      context.addIssue({
        code: "custom",
        message: `Option '${option.id}' references unknown visual '${option.visualId}'.`,
        path: ["options", index, "visualId"],
      });
    }
  });

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
    interaction.zones.forEach((zone, index) => {
      if (zone.capacity === "one") {
        const count = Object.values(answerKey.placements).filter((zoneId) => zoneId === zone.id).length;
        if (count > 1) context.addIssue({ code: "custom", message: `Drop zone '${zone.id}' accepts only one item.`, path: ["answerKey", "placements"] });
      }
      if (zone.visualId && !visualIds.includes(zone.visualId)) context.addIssue({ code: "custom", message: `Drop zone '${zone.id}' references unknown visual '${zone.visualId}'.`, path: ["interaction", "zones"] });
      if (interaction.presentation === "graphic_gap" && zone.visualId && zone.regionId) {
        const visual = question.visuals.find((candidate) => candidate.id === zone.visualId);
        if (visual?.type !== "hotspot_svg") {
          context.addIssue({ code: "custom", message: `Graphic gap zone '${zone.id}' must reference a hotspot_svg visual.`, path: ["interaction", "zones", index] });
        } else if (!visual.data.regions.some((region) => region.id === zone.regionId)) {
          context.addIssue({ code: "custom", message: `Graphic gap zone '${zone.id}' references unknown region '${zone.regionId}'.`, path: ["interaction", "zones", index, "regionId"] });
        }
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
    interaction.targets.forEach((target, index) => {
      if (target.visualId && !visualIds.includes(target.visualId)) {
        context.addIssue({ code: "custom", message: `Diagram target '${target.id}' references unknown visual '${target.visualId}'.`, path: ["interaction", "targets", index, "visualId"] });
      }
      if (interaction.presentation === "direct_placement" && target.visualId && target.regionId) {
        const visual = question.visuals.find((candidate) => candidate.id === target.visualId);
        if (visual?.type !== "hotspot_svg") {
          context.addIssue({ code: "custom", message: `Direct-placement target '${target.id}' must reference a hotspot_svg visual.`, path: ["interaction", "targets", index] });
        } else if (!visual.data.regions.some((region) => region.id === target.regionId)) {
          context.addIssue({ code: "custom", message: `Diagram target '${target.id}' references unknown region '${target.regionId}'.`, path: ["interaction", "targets", index, "regionId"] });
        }
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

  if (interaction?.type === "hot_text" && answerKey.kind === "hot_text") {
    const regionIds = new Set(interaction.segments.filter((segment) => segment.kind === "selectable").map((segment) => segment.id));
    answerKey.regionIds.forEach((id, index) => {
      if (!regionIds.has(id)) context.addIssue({ code: "custom", message: `Hot-text answer references unknown region '${id}'.`, path: ["answerKey", "regionIds", index] });
    });
    const maximum = interaction.selectionMode === "single" ? 1 : (interaction.maxSelections ?? regionIds.size);
    const minimum = interaction.minSelections ?? 1;
    if (answerKey.regionIds.length < minimum || answerKey.regionIds.length > maximum) context.addIssue({ code: "custom", message: "Hot-text answer does not satisfy the selection constraints.", path: ["answerKey", "regionIds"] });
  }

  if (interaction?.type === "matrix_choice" && answerKey.kind === "matrix") {
    const selectable = new Map(interaction.cells.map((cell) => [cell.id, cell]));
    answerKey.cellIds.forEach((id, index) => {
      const cell = selectable.get(id);
      if (!cell || !cell.selectable) context.addIssue({ code: "custom", message: `Matrix answer references unknown or disabled cell '${id}'.`, path: ["answerKey", "cellIds", index] });
    });
    if (interaction.selectionMode === "single_per_row") {
      const seenRows = new Set<string>();
      answerKey.cellIds.forEach((id) => {
        const rowId = selectable.get(id)?.rowId;
        if (rowId && seenRows.has(rowId)) context.addIssue({ code: "custom", message: `Matrix row '${rowId}' has more than one answer.`, path: ["answerKey", "cellIds"] });
        if (rowId) seenRows.add(rowId);
      });
    }
    const minimum = interaction.minSelections ?? interaction.rows.length;
    const maximum = interaction.maxSelections ?? interaction.cells.filter((cell) => cell.selectable).length;
    if (answerKey.cellIds.length < minimum || answerKey.cellIds.length > maximum) context.addIssue({ code: "custom", message: "Matrix answer does not satisfy the global selection constraints.", path: ["answerKey", "cellIds"] });
    interaction.rows.forEach((row) => {
      const rowSelectableCount = interaction.cells.filter((cell) => cell.rowId === row.id && cell.selectable).length;
      const rowAnswerCount = answerKey.cellIds.filter((id) => selectable.get(id)?.rowId === row.id).length;
      const rowMinimum = interaction.minSelectionsPerRow ?? 1;
      const rowMaximum = interaction.selectionMode === "single_per_row"
        ? 1
        : (interaction.maxSelectionsPerRow ?? rowSelectableCount);
      if (rowAnswerCount < rowMinimum || rowAnswerCount > rowMaximum) {
        context.addIssue({ code: "custom", message: `Matrix answer does not satisfy selection constraints for row '${row.id}'.`, path: ["answerKey", "cellIds"] });
      }
    });
  }

  if (interaction?.type === "structured_response" && answerKey.kind === "structured") {
    const definitions = new Map(interaction.parts.map((part) => [part.id, part]));
    const keyIds = new Set(answerKey.parts.map((part) => part.id));
    if (definitions.size !== keyIds.size || [...definitions.keys()].some((id) => !keyIds.has(id))) {
      context.addIssue({ code: "custom", path: ["answerKey", "parts"], message: "Structured answer parts must exactly match the interaction parts." });
    }
    answerKey.parts.forEach((part, index) => {
      if (definitions.get(part.id)?.responseKind !== part.responseKind) {
        context.addIssue({ code: "custom", path: ["answerKey", "parts", index, "responseKind"], message: `Structured part '${part.id}' has a mismatched response kind.` });
      }
    });
    const totalMarks = answerKey.parts.reduce((total, part) => total + part.marks, 0);
    if (totalMarks !== question.metadata.marks) {
      context.addIssue({ code: "custom", path: ["metadata", "marks"], message: `Structured part marks (${totalMarks}) must equal metadata marks (${question.metadata.marks}).` });
    }
    const automaticCount = answerKey.parts.filter((part) => part.marking === "automatic").length;
    const expectedMode = automaticCount === answerKey.parts.length ? "automatic" : automaticCount === 0 ? "manual" : "hybrid";
    if (answerKey.markingMode !== expectedMode) {
      context.addIssue({ code: "custom", path: ["answerKey", "markingMode"], message: `Structured markingMode must be '${expectedMode}' for these parts.` });
    }
  }
});

export const QuestionSchema = questionSchema;

export type QuestionType = z.infer<typeof questionTypeSchema>;
export type YearLevel = z.infer<typeof yearLevelSchema>;
export type ExamStyle = z.infer<typeof examStyleSchema>;
export type QuestionStatus = z.infer<typeof questionStatusSchema>;
export type QuestionOrigin = z.infer<typeof questionOriginSchema>;
export type QuestionOption = z.infer<typeof questionOptionSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type QuestionMetadata = z.infer<typeof questionMetadataSchema>;
export type AnswerKey = z.infer<typeof answerKeySchema>;
export type AnswerKind = AnswerKey["kind"];

/**
 * The answer key's discriminant on its own, validatable without the key.
 *
 * Needed because the discriminant is candidate-visible metadata — the exam UI
 * has always received it, `toCandidateQuestion` puts it on every candidate
 * question, and Phase 2 projects it onto `item_versions` so a version-pinned
 * session can produce the same DTO without any runtime path reading an answer
 * row (ADR-006 Amendment D).
 *
 * Derived from `answerKeySchema` rather than retyped, so a new answer kind
 * cannot be added to the union and forgotten here.
 */
export const answerKindSchema = z.enum(
  answerKeySchema.options.map((option) => option.shape.kind.value) as [
    AnswerKind,
    ...AnswerKind[],
  ],
);
export type Interaction = z.infer<typeof interactionSchema>;
export type InteractionType = Interaction["type"];
export type FillBlankInteraction = z.infer<typeof fillBlankInteractionSchema>;
export type DropdownInteraction = z.infer<typeof dropdownInteractionSchema>;
export type MatchingInteraction = z.infer<typeof matchingInteractionSchema>;
export type OrderingInteraction = z.infer<typeof orderingInteractionSchema>;
export type DragDropInteraction = z.infer<typeof dragDropInteractionSchema>;
export type LabelDiagramInteraction = z.infer<typeof labelDiagramInteractionSchema>;
export type HotTextInteraction = z.infer<typeof hotTextInteractionSchema>;
export type MatrixChoiceInteraction = z.infer<typeof matrixChoiceInteractionSchema>;
export type StructuredResponseInteraction = z.infer<typeof structuredResponseInteractionSchema>;
export type Question = z.infer<typeof questionSchema>;
export type QuestionInput = z.input<typeof questionSchema>;
