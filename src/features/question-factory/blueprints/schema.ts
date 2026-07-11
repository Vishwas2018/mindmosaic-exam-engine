import { z } from "zod";

import { questionMetadataSchema } from "@/features/exam-engine/types";
import { examStyleSchema } from "@/schemas/question.schema";

import { factoryIdentifierSchema } from "../shared/identifiers";
import { BLUEPRINT_LIMITS } from "./limits";
import { BLUEPRINT_YEAR_LEVELS } from "./types";

// Reused directly from the question metadata schema so subject/difficulty
// stay a single source of truth with the exam engine.
const subjectSchema = questionMetadataSchema.shape.subject;
const difficultySchema = questionMetadataSchema.shape.difficulty;

// A taxonomy id's shape (dot-namespaced), not its existence — resolving the
// id against the live registry is a blueprint-validator concern, not a
// schema concern, so the taxonomy registry never has to be imported here.
const taxonomySkillIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(150)
  .regex(
    /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/,
    "Skill must be a taxonomy id (lower-case letters, numbers, hyphens, underscores or dots).",
  );

const constraintTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(BLUEPRINT_LIMITS.MAX_CONSTRAINT_TEXT_LENGTH);

function constraintListSchema(maxItems: number) {
  return z.array(constraintTextSchema).max(maxItems).default([]);
}

function optionalConstraintListSchema(maxItems: number) {
  return z.array(constraintTextSchema).max(maxItems).optional();
}

export const blueprintYearLevelSchema = z.enum(BLUEPRINT_YEAR_LEVELS);

export const blueprintSchema = z.object({
  id: factoryIdentifierSchema,
  batchId: factoryIdentifierSchema,
  yearLevel: blueprintYearLevelSchema,
  examStyle: examStyleSchema,
  subject: subjectSchema,
  strand: z.string().trim().min(1).max(80),
  skill: taxonomySkillIdSchema,
  difficulty: difficultySchema,
  questionType: z.string().trim().min(1).max(60),
  visualType: z.string().trim().min(1).max(60).optional(),
  targetCount: z
    .number()
    .int()
    .min(BLUEPRINT_LIMITS.MIN_TARGET_COUNT)
    .max(BLUEPRINT_LIMITS.MAX_TARGET_COUNT),
  marks: z.number().int().min(BLUEPRINT_LIMITS.MIN_MARKS).max(BLUEPRINT_LIMITS.MAX_MARKS),
  estimatedTimeSeconds: z
    .number()
    .int()
    .min(BLUEPRINT_LIMITS.MIN_ESTIMATED_TIME_SECONDS)
    .max(BLUEPRINT_LIMITS.MAX_ESTIMATED_TIME_SECONDS),
  learningObjective: z
    .string()
    .trim()
    .min(1)
    .max(BLUEPRINT_LIMITS.MAX_LEARNING_OBJECTIVE_LENGTH),
  misconceptionTargets: constraintListSchema(BLUEPRINT_LIMITS.MAX_MISCONCEPTION_TARGETS),
  reasoningSteps: z
    .number()
    .int()
    .min(BLUEPRINT_LIMITS.MIN_REASONING_STEPS)
    .max(BLUEPRINT_LIMITS.MAX_REASONING_STEPS),
  vocabularyConstraints: optionalConstraintListSchema(
    BLUEPRINT_LIMITS.MAX_VOCABULARY_CONSTRAINTS,
  ),
  accessibilityConstraints: constraintListSchema(BLUEPRINT_LIMITS.MAX_ACCESSIBILITY_CONSTRAINTS),
  originalityConstraints: constraintListSchema(BLUEPRINT_LIMITS.MAX_ORIGINALITY_CONSTRAINTS),
  generationConstraints: constraintListSchema(BLUEPRINT_LIMITS.MAX_GENERATION_CONSTRAINTS),
});

export type Blueprint = z.infer<typeof blueprintSchema>;
export type BlueprintInput = z.input<typeof blueprintSchema>;
