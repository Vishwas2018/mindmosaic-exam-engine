import { z } from "zod";
import { visualSchema } from "@/schemas/visual.schema";

export const lessonStatusSchema = z.enum(["draft", "in_review", "published", "archived"]);
export type LessonStatus = z.infer<typeof lessonStatusSchema>;

export const keyTermSchema = z.object({
  term: z.string().trim().min(1).max(80),
  definition: z.string().trim().min(1).max(300),
});

export const conceptSectionSchema = z.object({
  kind: z.literal("concept"),
  id: z.string().trim().min(1),
  heading: z.string().trim().min(1).max(120),
  explanation: z.string().trim().min(10).max(3000),
  keyTerms: z.array(keyTermSchema).max(10).optional(),
  visualAsset: visualSchema.optional(),
});

export const workedExampleStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  label: z.string().trim().min(1).max(120),
  working: z.string().trim().min(1).max(1000),
  why: z.string().trim().min(1).max(500),
  visualAsset: visualSchema.optional(),
});

export const commonErrorSchema = z.object({
  mistake: z.string().trim().min(5).max(300),
  whyItHappens: z.string().trim().min(5).max(500),
  howToAvoid: z.string().trim().min(5).max(500),
});

export const workedExampleSectionSchema = z.object({
  kind: z.literal("worked_example"),
  id: z.string().trim().min(1),
  heading: z.string().trim().min(1).max(120),
  problem: z.string().trim().min(10).max(1000),
  visualAsset: visualSchema.optional(),
  steps: z.array(workedExampleStepSchema).min(1).max(10),
  finalAnswer: z.string().trim().min(1).max(500),
  commonError: commonErrorSchema.optional(),
});

export const misconceptionSectionSchema = z.object({
  kind: z.literal("misconception"),
  id: z.string().trim().min(1),
  heading: z.string().trim().min(1).max(120),
  claim: z.string().trim().min(5).max(400),
  whyWrong: z.string().trim().min(10).max(800),
  correction: z.string().trim().min(10).max(800),
  example: z.string().trim().min(5).max(500).optional(),
});

export const checkSectionSchema = z.object({
  kind: z.literal("check"),
  id: z.string().trim().min(1),
  heading: z.string().trim().min(1).max(120),
  prompt: z.string().trim().min(5).max(500),
  curriculumCode: z.string().trim().min(1).max(30),
  practiceCount: z.number().int().positive().max(20).default(5),
});

export const lessonSectionSchema = z.discriminatedUnion("kind", [
  conceptSectionSchema,
  workedExampleSectionSchema,
  misconceptionSectionSchema,
  checkSectionSchema,
]);

export const lessonProvenanceSchema = z.object({
  author: z.string().trim().min(1).max(100),
  version: z.number().int().positive().default(1),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
  originalityStatement: z.string().trim().min(10).max(500),
});

export const lessonSchema = z.object({
  curriculumCode: z.string().trim().min(1).max(30),
  title: z.string().trim().min(3).max(160),
  strand: z.string().trim().min(1).max(60),
  level: z.string().trim().min(1).max(30),
  estimatedMinutes: z.number().int().positive().max(60).default(15),
  learningIntention: z.string().trim().min(10).max(300),
  successCriteria: z.array(z.string().trim().min(5).max(200)).min(1).max(8),
  prerequisites: z.array(z.string().trim().min(1).max(30)).default([]),
  sections: z.array(lessonSectionSchema).min(2),
  status: lessonStatusSchema.default("draft"),
  provenance: lessonProvenanceSchema,
});

export type Lesson = z.infer<typeof lessonSchema>;
export type LessonSection = z.infer<typeof lessonSectionSchema>;
export type ConceptSectionData = z.infer<typeof conceptSectionSchema>;
export type ConceptSection = ConceptSectionData;
export type WorkedExampleSectionData = z.infer<typeof workedExampleSectionSchema>;
export type WorkedExampleSection = WorkedExampleSectionData;
export type WorkedExampleStep = z.infer<typeof workedExampleStepSchema>;
export type MisconceptionSectionData = z.infer<typeof misconceptionSectionSchema>;
export type MisconceptionSection = MisconceptionSectionData;
export type CheckSectionData = z.infer<typeof checkSectionSchema>;
export type CheckSection = CheckSectionData;
export type KeyTerm = z.infer<typeof keyTermSchema>;
export type CommonError = z.infer<typeof commonErrorSchema>;
export type LessonProvenance = z.infer<typeof lessonProvenanceSchema>;
