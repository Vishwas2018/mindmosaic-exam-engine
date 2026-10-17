import { z } from "zod";

export const scholarshipExamStyleSchema = z.enum([
  "naplan_style",
  "icas_style",
  "amc_style",
  "scholarship_style",
]);

export const scholarshipSubjectSchema = z.enum([
  "reading",
  "writing",
  "conventions_of_language",
  "numeracy",
  "science",
  "amc_mathematics",
  "verbal_reasoning",
  "numerical_reasoning",
]);

export const draftOptionSchema = z.object({
  id: z.enum(["a", "b", "c", "d", "e"]),
  text: z.string().trim().min(1),
});

export const draftQuestionSchema = z.object({
  id: z.string().regex(/^scholarship-y6-(vr|nr|rc|maths)-\d{3}$/),
  type: z.enum(["multiple_choice", "reading_comprehension"]),
  yearLevel: z.literal(6),
  examStyle: scholarshipExamStyleSchema,
  prompt: z.string().trim().min(5),
  stimulus: z
    .object({
      title: z.string().trim().min(1).optional(),
      body: z.string().trim().min(1),
    })
    .optional(),
  options: z.array(draftOptionSchema).min(4).max(5),
  visuals: z.array(z.unknown()).default([]),
  answerKey: z.object({
    kind: z.literal("single_option"),
    optionId: z.enum(["a", "b", "c", "d", "e"]),
  }),
  explanation: z.string().trim().min(10),
  metadata: z.object({
    subject: scholarshipSubjectSchema,
    strand: z.string().trim().min(1),
    skill: z.string().trim().min(1),
    difficulty: z.enum(["easy", "medium", "challenging"]),
    marks: z.number().int().positive(),
    estimatedTimeSeconds: z.number().int().positive(),
    tags: z.array(z.string()).default([]),
  }),
});

export const draftSidecarSchema = z.object({
  id: z.string(),
  skill: z.string(),
  targetOption: z.enum(["a", "b", "c", "d", "e"]),
  correctValue: z.union([z.string(), z.number()]),
  requiresHumanSemanticCheck: z.boolean().optional(),
  solver: z.enum([
    "number_series",
    "number_matrix",
    "letter_series",
    "coded_words",
    "syllogism",
    "arithmetical_reasoning",
  ]).optional(),
  solverParams: z.record(z.string(), z.unknown()).optional(),
});

export type DraftQuestion = z.infer<typeof draftQuestionSchema>;
export type DraftSidecar = z.infer<typeof draftSidecarSchema>;
