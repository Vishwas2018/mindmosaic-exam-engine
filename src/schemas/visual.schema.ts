import { z } from "zod";

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
  data: z.object({
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
]);

export const structuredVisualSchema = visualSchema;
export const visualAssetSchema = visualSchema;
export const VisualSchema = visualSchema;

export type VisualType = z.infer<typeof visualTypeSchema>;
export type VisualAsset = z.infer<typeof visualSchema>;
export type StructuredVisual = VisualAsset;
export type BarChartVisual = z.infer<typeof barChartVisualSchema>;
