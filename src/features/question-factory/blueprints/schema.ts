import { z } from "zod";

import { questionMetadataSchema } from "@/features/exam-engine/types";
import { examStyleSchema } from "@/schemas/question.schema";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";
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
  .max(FACTORY_LIMITS.TAXONOMY_SKILL_ID_MAX_LENGTH)
  .regex(
    /^[a-z0-9]+(?:[-_.][a-z0-9]+)*$/,
    "Skill must be a taxonomy id (lower-case letters, numbers, hyphens, underscores or dots).",
  );

const constraintTextSchema = z
  .string()
  .trim()
  .min(1)
  .max(FACTORY_LIMITS.BLUEPRINT_MAX_CONSTRAINT_TEXT_LENGTH);

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
  strand: z.string().trim().min(1).max(FACTORY_LIMITS.BLUEPRINT_STRAND_MAX_LENGTH),
  skill: taxonomySkillIdSchema,
  difficulty: difficultySchema,
  questionType: z
    .string()
    .trim()
    .min(1)
    .max(FACTORY_LIMITS.BLUEPRINT_TYPE_IDENTIFIER_MAX_LENGTH),
  visualType: z
    .string()
    .trim()
    .min(1)
    .max(FACTORY_LIMITS.BLUEPRINT_TYPE_IDENTIFIER_MAX_LENGTH)
    .optional(),
  targetCount: z
    .number()
    .int()
    .min(FACTORY_LIMITS.BLUEPRINT_MIN_TARGET_COUNT)
    .max(FACTORY_LIMITS.BLUEPRINT_MAX_TARGET_COUNT),
  marks: z
    .number()
    .int()
    .min(FACTORY_LIMITS.BLUEPRINT_MIN_MARKS)
    .max(FACTORY_LIMITS.BLUEPRINT_MAX_MARKS),
  estimatedTimeSeconds: z
    .number()
    .int()
    .min(FACTORY_LIMITS.BLUEPRINT_MIN_ESTIMATED_TIME_SECONDS)
    .max(FACTORY_LIMITS.BLUEPRINT_MAX_ESTIMATED_TIME_SECONDS),
  learningObjective: z
    .string()
    .trim()
    .min(1)
    .max(FACTORY_LIMITS.BLUEPRINT_MAX_LEARNING_OBJECTIVE_LENGTH),
  misconceptionTargets: constraintListSchema(FACTORY_LIMITS.BLUEPRINT_MAX_MISCONCEPTION_TARGETS),
  reasoningSteps: z
    .number()
    .int()
    .min(FACTORY_LIMITS.BLUEPRINT_MIN_REASONING_STEPS)
    .max(FACTORY_LIMITS.BLUEPRINT_MAX_REASONING_STEPS),
  vocabularyConstraints: optionalConstraintListSchema(
    FACTORY_LIMITS.BLUEPRINT_MAX_VOCABULARY_CONSTRAINTS,
  ),
  accessibilityConstraints: constraintListSchema(
    FACTORY_LIMITS.BLUEPRINT_MAX_ACCESSIBILITY_CONSTRAINTS,
  ),
  originalityConstraints: constraintListSchema(
    FACTORY_LIMITS.BLUEPRINT_MAX_ORIGINALITY_CONSTRAINTS,
  ),
  generationConstraints: constraintListSchema(
    FACTORY_LIMITS.BLUEPRINT_MAX_GENERATION_CONSTRAINTS,
  ),
});

export type Blueprint = z.infer<typeof blueprintSchema>;
export type BlueprintInput = z.input<typeof blueprintSchema>;
