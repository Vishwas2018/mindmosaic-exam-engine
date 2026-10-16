import { z } from "zod";

import {
  MAX_BAR_MODEL_BARS,
  MAX_BAR_MODEL_BRACES,
  MAX_BAR_MODEL_BRACE_SPAN,
  MAX_BAR_MODEL_GROUPS,
  MAX_BAR_MODEL_SEGMENTS_PER_BAR,
  MAX_BAR_MODEL_UNIT_DEFINITIONS,
  MAX_BAR_MODEL_UNITS_PER_SEGMENT,
  MAX_BAR_MODEL_VALUE,
  MAX_COORDINATE_GRID_LINES_PER_AXIS,
  MAX_NUMBER_LINE_TICKS,
  calculateBoundedStepCount,
} from "./visual-safety";

export const VISUAL_TYPES = [
  "bar_chart",
  "line_graph",
  "pie_chart",
  "table",
  "number_line",
  "geometry_shape",
  "coordinate_grid",
  "fraction_model",
  "labelled_svg",
  "hotspot_svg",
  "bar_model",
] as const;

export const visualTypeSchema = z.enum(VISUAL_TYPES);

export const accessibleAltTextSchema = z
  .string()
  .trim()
  .min(10, "Alt text must describe the important visual information.")
  .max(300, "Alt text must be concise enough for assistive technology.");

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
    "Use lower-case letters, numbers, hyphens or underscores.",
  );

const labelSchema = z.string().trim().min(1).max(80);
const optionalLabelSchema = labelSchema.optional();
const finiteNumberSchema = z.number().finite();
const nonNegativeNumberSchema = finiteNumberSchema.nonnegative();
const colourSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Colours must use six-digit hexadecimal notation.");

export const visualBaseSchema = z.object({
  id: identifierSchema,
  altText: accessibleAltTextSchema,
  title: labelSchema.optional(),
  caption: z.string().trim().min(1).max(240).optional(),
});

export const barChartDataSchema = z
  .object({
    labels: z.array(labelSchema).min(1).max(12),
    values: z.array(nonNegativeNumberSchema).min(1).max(12),
    xAxisLabel: optionalLabelSchema,
    yAxisLabel: optionalLabelSchema,
    maxValue: finiteNumberSchema.positive().optional(),
    colour: colourSchema.default("#4B2E83"),
  })
  .superRefine((data, context) => {
    if (data.labels.length !== data.values.length) {
      context.addIssue({
        code: "custom",
        message: "Bar-chart labels and values must have matching lengths.",
        path: ["values"],
      });
    }

    const largestValue = Math.max(0, ...data.values);
    if (data.maxValue !== undefined && data.maxValue < largestValue) {
      context.addIssue({
        code: "custom",
        message: "maxValue cannot be smaller than a plotted value.",
        path: ["maxValue"],
      });
    }
  });

export const barChartVisualSchema = visualBaseSchema.extend({
  type: z.literal("bar_chart"),
  data: barChartDataSchema,
});

export const lineGraphVisualSchema = visualBaseSchema.extend({
  type: z.literal("line_graph"),
  data: z.object({
    points: z
      .array(
        z.object({
          x: finiteNumberSchema,
          y: finiteNumberSchema,
          label: optionalLabelSchema,
        }),
      )
      .min(2)
      .max(30),
    xAxisLabel: optionalLabelSchema,
    yAxisLabel: optionalLabelSchema,
    colour: colourSchema.default("#4B2E83"),
  }),
});

export const pieChartVisualSchema = visualBaseSchema.extend({
  type: z.literal("pie_chart"),
  data: z.object({
    segments: z
      .array(
        z.object({
          label: labelSchema,
          value: finiteNumberSchema.positive(),
          colour: colourSchema.optional(),
        }),
      )
      .min(2)
      .max(10),
  }),
});

const tableCellSchema = z.union([z.string().max(160), finiteNumberSchema]);

export const tableVisualSchema = visualBaseSchema.extend({
  type: z.literal("table"),
  data: z
    .object({
      headers: z.array(labelSchema).min(1).max(10),
      rows: z.array(z.array(tableCellSchema).min(1).max(10)).min(1).max(30),
      rowHeaders: z.boolean().default(false),
    })
    .superRefine((data, context) => {
      data.rows.forEach((row, rowIndex) => {
        if (row.length !== data.headers.length) {
          context.addIssue({
            code: "custom",
            message: "Each table row must match the number of headers.",
            path: ["rows", rowIndex],
          });
        }
      });
    }),
});

export const numberLineVisualSchema = visualBaseSchema.extend({
  type: z.literal("number_line"),
  data: z
    .object({
      min: finiteNumberSchema,
      max: finiteNumberSchema,
      step: finiteNumberSchema.positive(),
      highlightedValues: z.array(finiteNumberSchema).max(12).default([]),
    })
    .superRefine((data, context) => {
      if (data.min >= data.max) {
        context.addIssue({
          code: "custom",
          message: "A number line's minimum must be less than its maximum.",
          path: ["max"],
        });
      }

      data.highlightedValues.forEach((value, index) => {
        if (value < data.min || value > data.max) {
          context.addIssue({
            code: "custom",
            message: "Highlighted values must sit within the number line.",
            path: ["highlightedValues", index],
          });
        }
      });

      /*
       * A tiny step over a huge span is individually schema-valid (min <
       * max, step > 0) but would render thousands of ticks and freeze the
       * tab. Reject before it ever reaches a renderer.
       */
      if (data.min < data.max) {
        const actualCount = calculateBoundedStepCount(
          data.min,
          data.max,
          data.step,
          Number.MAX_SAFE_INTEGER,
        );
        if (actualCount > MAX_NUMBER_LINE_TICKS) {
          context.addIssue({
            code: "custom",
            message: `A number line may show at most ${MAX_NUMBER_LINE_TICKS} ticks; this range and step would produce ${actualCount}. Use a larger step or a smaller range.`,
            path: ["step"],
          });
        }
      }
    }),
});

const measurementSchema = z.object({
  label: labelSchema,
  value: finiteNumberSchema.positive(),
  unit: z.string().trim().min(1).max(20).optional(),
});

export const geometryShapeVisualSchema = visualBaseSchema.extend({
  type: z.literal("geometry_shape"),
  data: z.object({
    shape: z.enum(["circle", "triangle", "rectangle", "square", "polygon"]),
    measurements: z.array(measurementSchema).max(12).default([]),
    vertices: z
      .array(z.object({ x: finiteNumberSchema, y: finiteNumberSchema }))
      .min(3)
      .max(12)
      .optional(),
  }),
});

const numericRangeSchema = z
  .tuple([finiteNumberSchema, finiteNumberSchema])
  .refine(([minimum, maximum]) => minimum < maximum, {
    message: "The first range value must be less than the second.",
  });

export const coordinateGridVisualSchema = visualBaseSchema.extend({
  type: z.literal("coordinate_grid"),
  data: z
    .object({
      xRange: numericRangeSchema,
      yRange: numericRangeSchema,
      points: z
        .array(
          z.object({
            x: finiteNumberSchema,
            y: finiteNumberSchema,
            label: optionalLabelSchema,
          }),
        )
        .max(30)
        .default([]),
      gridStep: finiteNumberSchema.positive().default(1),
    })
    .superRefine((data, context) => {
      /*
       * The same grid step drives both axes, so a tiny step over either a
       * huge x- or y-range is schema-valid in isolation but would render
       * thousands of gridlines and freeze the tab. Reject before it ever
       * reaches a renderer.
       */
      const [minX, maxX] = data.xRange;
      const [minY, maxY] = data.yRange;
      const xLineCount = calculateBoundedStepCount(
        minX,
        maxX,
        data.gridStep,
        Number.MAX_SAFE_INTEGER,
      );
      const yLineCount = calculateBoundedStepCount(
        minY,
        maxY,
        data.gridStep,
        Number.MAX_SAFE_INTEGER,
      );

      if (xLineCount > MAX_COORDINATE_GRID_LINES_PER_AXIS) {
        context.addIssue({
          code: "custom",
          message: `A coordinate grid may show at most ${MAX_COORDINATE_GRID_LINES_PER_AXIS} vertical lines; this x-range and step would produce ${xLineCount}. Use a larger step or a smaller range.`,
          path: ["gridStep"],
        });
      }
      if (yLineCount > MAX_COORDINATE_GRID_LINES_PER_AXIS) {
        context.addIssue({
          code: "custom",
          message: `A coordinate grid may show at most ${MAX_COORDINATE_GRID_LINES_PER_AXIS} horizontal lines; this y-range and step would produce ${yLineCount}. Use a larger step or a smaller range.`,
          path: ["gridStep"],
        });
      }
    }),
});

export const fractionModelVisualSchema = visualBaseSchema.extend({
  type: z.literal("fraction_model"),
  data: z
    .object({
      numerator: z.number().int().nonnegative(),
      denominator: z.number().int().positive().max(24),
      model: z.enum(["bar", "circle", "set"]),
      colour: colourSchema.default("#FF8A00"),
    })
    .refine((data) => data.numerator <= data.denominator, {
      message: "The numerator cannot exceed the denominator in this model.",
      path: ["numerator"],
    }),
});

const pointSchema = z.object({ x: finiteNumberSchema, y: finiteNumberSchema });

export const safeSvgElementSchema = z.discriminatedUnion("kind", [
  z.object({
    id: identifierSchema,
    kind: z.literal("circle"),
    cx: finiteNumberSchema,
    cy: finiteNumberSchema,
    r: finiteNumberSchema.positive(),
    fill: colourSchema.optional(),
    stroke: colourSchema.optional(),
  }),
  z.object({
    id: identifierSchema,
    kind: z.literal("rectangle"),
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    width: finiteNumberSchema.positive(),
    height: finiteNumberSchema.positive(),
    fill: colourSchema.optional(),
    stroke: colourSchema.optional(),
  }),
  z.object({
    id: identifierSchema,
    kind: z.literal("line"),
    x1: finiteNumberSchema,
    y1: finiteNumberSchema,
    x2: finiteNumberSchema,
    y2: finiteNumberSchema,
    stroke: colourSchema.optional(),
  }),
  z.object({
    id: identifierSchema,
    kind: z.literal("polygon"),
    points: z.array(pointSchema).min(3).max(20),
    fill: colourSchema.optional(),
    stroke: colourSchema.optional(),
  }),
  z.object({
    id: identifierSchema,
    kind: z.literal("text"),
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    text: z.string().trim().min(1).max(120),
    colour: colourSchema.optional(),
  }),
]);

const structuredSvgDataSchema = z.object({
  width: z.number().int().positive().max(1200),
  height: z.number().int().positive().max(1200),
  elements: z.array(safeSvgElementSchema).min(1).max(100),
  labels: z
    .array(
      z.object({
        text: labelSchema,
        x: finiteNumberSchema,
        y: finiteNumberSchema,
        targetId: identifierSchema.optional(),
      }),
    )
    .max(30)
    .default([]),
});

export const labelledSvgVisualSchema = visualBaseSchema.extend({
  type: z.literal("labelled_svg"),
  data: structuredSvgDataSchema,
});

export const hotspotRegionSchema = z.discriminatedUnion("shape", [
  z.object({
    id: identifierSchema,
    shape: z.literal("circle"),
    accessibleLabel: labelSchema,
    cx: finiteNumberSchema,
    cy: finiteNumberSchema,
    r: finiteNumberSchema.positive(),
  }),
  z.object({
    id: identifierSchema,
    shape: z.literal("rectangle"),
    accessibleLabel: labelSchema,
    x: finiteNumberSchema,
    y: finiteNumberSchema,
    width: finiteNumberSchema.positive(),
    height: finiteNumberSchema.positive(),
  }),
  z.object({
    id: identifierSchema,
    shape: z.literal("polygon"),
    accessibleLabel: labelSchema,
    points: z.array(pointSchema).min(3).max(20),
  }),
]);

export const hotspotSvgVisualSchema = visualBaseSchema.extend({
  type: z.literal("hotspot_svg"),
  data: structuredSvgDataSchema.extend({
    regions: z.array(hotspotRegionSchema).min(1).max(30),
  }),
});

/* ------------------------------------------------------------------ *
 * bar_model (Model Method) - schematic, independently validated for generation.
 *
 * LAYERING. This schema rejects malformed *shape* only: wrong types,
 * missing fields, bounds, enums, and a blank/unknown element that still
 * carries a number. Broken references (dangling IDs, non-contiguous
 * braces, target count) are caught by the structural validator and bad
 * maths (contradictions, an undetermined target, an answer leak) by the
 * mathematical validator, both in src/features/visuals/bar-model/.
 * Zod alone does NOT prove a bar model is solvable.
 *
 * ANSWER SECRECY. The learner-facing JSON holds givens only. An unknown or
 * blank element has no numeric field, so a "hidden" number can never reach
 * the browser.
 * ------------------------------------------------------------------ */

/** Rule codes the schema layer attaches to its custom issues. */
export type BarModelSchemaRule =
  | "segment_size_form"
  | "units_incomplete"
  | "blank_with_value"
  | "unknown_with_value"
  | "display_mismatch"
  | "target_display"
  | "brace_fields";

const barModelSymbolSchema = z
  .string()
  .trim()
  .regex(
    /^[A-Za-z][A-Za-z0-9]{0,3}$/,
    "An unknown symbol is 1-4 letters or digits starting with a letter (never '?').",
  );

/** A given number: non-negative, at most three decimal places, bounded. */
const barModelValueSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(MAX_BAR_MODEL_VALUE)
  .refine((value) => /^\d+(\.\d{1,3})?$/.test(String(value)), {
    message: "Use a plain decimal with at most three decimal places.",
  });

export const barModelDisplaySchema = z.enum(["value", "unknown", "blank"]);

function addBarModelIssue(
  context: z.RefinementCtx,
  rule: BarModelSchemaRule,
  message: string,
  path: (string | number)[] = [],
) {
  context.addIssue({ code: "custom", message, path, params: { rule } });
}

/** Display-versus-size rules shared by segments, braces and quantities. */
function checkBarModelDisplay(
  element: {
    value?: number;
    unknown?: string;
    display: "value" | "unknown" | "blank";
    target?: true;
  },
  context: z.RefinementCtx,
) {
  const { value, unknown, display, target } = element;
  if (value !== undefined && display === "blank") {
    addBarModelIssue(context, "blank_with_value", "A blank element must not carry a numeric value.", ["value"]);
  } else if (value !== undefined && display === "unknown") {
    addBarModelIssue(context, "unknown_with_value", "An unknown element must not carry a numeric value.", ["value"]);
  }
  if (unknown !== undefined && display === "value") {
    addBarModelIssue(context, "display_mismatch", "An unknown element cannot display a value.", ["display"]);
  }
  if (target && display !== "unknown") {
    addBarModelIssue(context, "target_display", 'The target must have display "unknown".', ["display"]);
  }
}

const barModelUnitSchema = z.strictObject({
  id: identifierSchema,
  label: optionalLabelSchema,
  value: barModelValueSchema.optional(),
});

/** A change amount stated once; segments and braces reference it by ID. */
const barModelQuantitySchema = z
  .strictObject({
    id: identifierSchema,
    label: optionalLabelSchema,
    value: barModelValueSchema.optional(),
    unknown: barModelSymbolSchema.optional(),
    display: barModelDisplaySchema,
    target: z.literal(true).optional(),
  })
  .superRefine((quantity, context) => {
    if ((quantity.value === undefined) === (quantity.unknown === undefined)) {
      addBarModelIssue(context, "segment_size_form", "A quantity has exactly one of value or unknown.");
      return;
    }
    checkBarModelDisplay(quantity, context);
  });

const barModelSegmentSchema = z
  .strictObject({
    id: identifierSchema,
    label: optionalLabelSchema,
    value: barModelValueSchema.optional(),
    units: z.number().int().min(1).max(MAX_BAR_MODEL_UNITS_PER_SEGMENT).optional(),
    unitId: identifierSchema.optional(),
    unknown: barModelSymbolSchema.optional(),
    quantityId: identifierSchema.optional(),
    display: barModelDisplaySchema,
    target: z.literal(true).optional(),
    /** Marks a segment that shows a change amount; it must use quantityId. */
    role: z.literal("change").optional(),
  })
  .superRefine((segment, context) => {
    if ((segment.units === undefined) !== (segment.unitId === undefined)) {
      addBarModelIssue(context, "units_incomplete", "units and unitId go together.", [
        segment.units === undefined ? "units" : "unitId",
      ]);
    }
    const forms = [
      segment.value !== undefined,
      segment.units !== undefined || segment.unitId !== undefined,
      segment.unknown !== undefined,
      segment.quantityId !== undefined,
    ].filter(Boolean).length;
    if (forms !== 1) {
      addBarModelIssue(
        context,
        "segment_size_form",
        "A segment's size is exactly one of value, units + unitId, unknown or quantityId.",
      );
      return;
    }
    checkBarModelDisplay(segment, context);
    if (segment.units !== undefined && segment.display !== "blank") {
      addBarModelIssue(context, "display_mismatch", 'A unit-based segment is drawn with display "blank".', ["display"]);
    }
  });

const barModelBarSchema = z.strictObject({
  id: identifierSchema,
  label: labelSchema,
  stage: z.enum(["before", "after"]).optional(),
  segments: z.array(barModelSegmentSchema).min(1).max(MAX_BAR_MODEL_SEGMENTS_PER_BAR),
});

const barModelBraceSchema = z
  .strictObject({
    id: identifierSchema,
    kind: z.enum(["total", "part", "difference"]),
    label: optionalLabelSchema,
    value: barModelValueSchema.optional(),
    unknown: barModelSymbolSchema.optional(),
    quantityId: identifierSchema.optional(),
    display: barModelDisplaySchema,
    target: z.literal(true).optional(),
    role: z.literal("change").optional(),
    side: z.enum(["above", "below"]).optional(),
    /** part / total: contiguous segment IDs of one bar. */
    spans: z.array(identifierSchema).min(1).max(MAX_BAR_MODEL_BRACE_SPAN).optional(),
    /** total only: a combined total across whole bars. */
    barIds: z.array(identifierSchema).min(2).max(MAX_BAR_MODEL_BARS).optional(),
    /** difference only: the gap between two aligned bars. */
    longerBarId: identifierSchema.optional(),
    shorterBarId: identifierSchema.optional(),
  })
  .superRefine((brace, context) => {
    const forms = [
      brace.value !== undefined,
      brace.unknown !== undefined,
      brace.quantityId !== undefined,
    ].filter(Boolean).length;
    if (forms !== 1) {
      addBarModelIssue(context, "segment_size_form", "A brace has exactly one of value, unknown or quantityId.");
      return;
    }
    checkBarModelDisplay(brace, context);
    const hasSpans = brace.spans !== undefined;
    const hasBars = brace.barIds !== undefined;
    const hasDifference = brace.longerBarId !== undefined || brace.shorterBarId !== undefined;
    const ok =
      brace.kind === "part"
        ? hasSpans && !hasBars && !hasDifference
        : brace.kind === "total"
          ? hasSpans !== hasBars && !hasDifference
          : brace.longerBarId !== undefined &&
            brace.shorterBarId !== undefined &&
            !hasSpans &&
            !hasBars;
    if (!ok) {
      addBarModelIssue(
        context,
        "brace_fields",
        "part needs spans; total needs spans or barIds; difference needs longerBarId and shorterBarId.",
      );
    }
  });

const barModelGroupSchema = z.strictObject({
  id: identifierSchema,
  barIds: z.array(identifierSchema).min(2).max(MAX_BAR_MODEL_BARS),
});

const barModelRelationshipSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("add"),
    fromStage: identifierSchema,
    toStage: identifierSchema,
    quantityId: identifierSchema,
  }),
  z.strictObject({
    kind: z.literal("remove"),
    fromStage: identifierSchema,
    toStage: identifierSchema,
    quantityId: identifierSchema,
  }),
  z.strictObject({
    kind: z.literal("transfer"),
    fromBar: identifierSchema,
    toBar: identifierSchema,
    quantityId: identifierSchema,
    beforeBars: z.array(identifierSchema).min(2).max(MAX_BAR_MODEL_BARS),
    afterBars: z.array(identifierSchema).min(2).max(MAX_BAR_MODEL_BARS),
  }),
  z.strictObject({
    kind: z.literal("equal"),
    barIds: z.array(identifierSchema).min(2).max(MAX_BAR_MODEL_BARS),
  }),
]);

export const barModelDataSchema = z.strictObject({
  layout: z.strictObject({ mode: z.literal("schematic") }),
  units: z.array(barModelUnitSchema).max(MAX_BAR_MODEL_UNIT_DEFINITIONS).default([]),
  quantities: z.array(barModelQuantitySchema).max(MAX_BAR_MODEL_BRACES).default([]),
  bars: z.array(barModelBarSchema).min(1).max(MAX_BAR_MODEL_BARS),
  braces: z.array(barModelBraceSchema).max(MAX_BAR_MODEL_BRACES).default([]),
  groups: z.array(barModelGroupSchema).max(MAX_BAR_MODEL_GROUPS).default([]),
  relationships: z.array(barModelRelationshipSchema).max(MAX_BAR_MODEL_BRACES).default([]),
});

export const barModelVisualSchema = visualBaseSchema.extend({
  type: z.literal("bar_model"),
  data: barModelDataSchema,
});

export const visualSchema = z.discriminatedUnion("type", [
  barChartVisualSchema,
  lineGraphVisualSchema,
  pieChartVisualSchema,
  tableVisualSchema,
  numberLineVisualSchema,
  geometryShapeVisualSchema,
  coordinateGridVisualSchema,
  fractionModelVisualSchema,
  labelledSvgVisualSchema,
  hotspotSvgVisualSchema,
  barModelVisualSchema,
]);

export const structuredVisualSchema = visualSchema;
export const visualAssetSchema = visualSchema;
export const VisualSchema = visualSchema;

export type VisualType = z.infer<typeof visualTypeSchema>;
export type VisualAsset = z.infer<typeof visualSchema>;
export type StructuredVisual = VisualAsset;
export type BarChartVisual = z.infer<typeof barChartVisualSchema>;
export type BarModelVisual = z.infer<typeof barModelVisualSchema>;
export type BarModelData = z.infer<typeof barModelDataSchema>;
