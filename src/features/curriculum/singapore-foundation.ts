import { z } from "zod";

/** Internal model-method authoring contract; not an official syllabus alignment
 * or a timed assessment. Deliberately absent from the student pattern registry. */
export const singaporeFoundationContractSchema = z.object({
  programmeId: z.literal("singapore_primary_mathematics"),
  familyId: z.literal("singapore_curriculum"),
  examStyle: z.literal("singapore_style"),
  subject: z.literal("singapore_mathematics"),
  status: z.literal("coming_soon"),
  studentDelivery: z.literal(false),
  yearLevels: z.tuple([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  curriculumBasis: z.literal("internal_model_method_foundation"),
  pattern: z.object({
    mode: z.literal("authoring_only"),
    questionCount: z.null(),
    durationMinutes: z.null(),
    questionTypes: z.tuple([z.literal("number_entry"), z.literal("multiple_choice")]),
    visualType: z.literal("bar_model"),
  }).strict(),
  skills: z.tuple([z.literal("sg.math.part-whole"), z.literal("sg.math.comparison"), z.literal("sg.math.equal-units")]),
  blueprintId: z.literal("singapore-y3-part-whole-foundation-seed-001"),
}).strict();

export const SINGAPORE_FOUNDATION_CONTRACT = singaporeFoundationContractSchema.parse({
  programmeId: "singapore_primary_mathematics",
  familyId: "singapore_curriculum",
  examStyle: "singapore_style",
  subject: "singapore_mathematics",
  status: "coming_soon",
  studentDelivery: false,
  yearLevels: [3, 4, 5, 6],
  curriculumBasis: "internal_model_method_foundation",
  pattern: {
    mode: "authoring_only", questionCount: null, durationMinutes: null,
    questionTypes: ["number_entry", "multiple_choice"], visualType: "bar_model",
  },
  skills: ["sg.math.part-whole", "sg.math.comparison", "sg.math.equal-units"],
  blueprintId: "singapore-y3-part-whole-foundation-seed-001",
});
