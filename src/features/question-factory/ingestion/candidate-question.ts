import { z } from "zod";

import {
  answerKeySchema,
  examStyleSchema,
  interactionSchema,
  questionMetadataSchema,
  questionOptionSchema,
  yearLevelSchema,
} from "@/schemas/question.schema";
import { visualSchema } from "@/schemas/visual.schema";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { HARVEST_SUPPORTED_QUESTION_TYPES } from "./mappings";

/**
 * The normalised question shape a `generated`-state ingestion candidate
 * carries. Deliberately its own schema, not the trusted production
 * `questionSchema` (`@/schemas/question.schema`): that schema's `origin`
 * (`"original_seed"` only) and `status` fields are production-bank trust
 * markers this adapter is never entitled to assert (per
 * `03-legacy-ingestion-requirements.md` §1.1, §7), and `stimulus.attribution`
 * ("MindMosaic original") can never be claimed for donor-derived prose (§6).
 * Everything else reuses the trusted schema's exact building blocks
 * (`answerKeySchema`, `interactionSchema`, `questionOptionSchema`,
 * `visualSchema`, the year-level/exam-style/subject/difficulty enums) so a
 * future publication step's mapping is a narrow, mechanical one.
 */
export const candidateQuestionTypeSchema = z.enum(HARVEST_SUPPORTED_QUESTION_TYPES);

export const candidateStimulusSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  body: z.string().trim().min(1).max(FACTORY_LIMITS.MAX_STIMULUS_LENGTH),
});

export const candidateMetadataSchema = z.object({
  subject: questionMetadataSchema.shape.subject,
  strand: z.string().trim().min(1).max(80),
  skill: z.string().trim().min(1).max(FACTORY_LIMITS.TAXONOMY_SKILL_ID_MAX_LENGTH).optional(),
  difficulty: questionMetadataSchema.shape.difficulty,
  marks: z.number().int().positive().max(20),
  estimatedTimeSeconds: z.number().int().positive().max(3600).optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
});

export const candidateQuestionSchema = z.object({
  id: factoryIdentifierSchema,
  type: candidateQuestionTypeSchema,
  yearLevel: yearLevelSchema,
  examStyle: examStyleSchema,
  prompt: z.string().trim().min(1).max(FACTORY_LIMITS.MAX_PROMPT_LENGTH),
  stimulus: candidateStimulusSchema.optional(),
  options: z.array(questionOptionSchema).max(FACTORY_LIMITS.MAX_OPTIONS_PER_QUESTION).default([]),
  interaction: interactionSchema.optional(),
  visuals: z.array(visualSchema).max(FACTORY_LIMITS.MAX_VISUALS_PER_QUESTION).default([]),
  answerKey: answerKeySchema,
  explanation: z.string().trim().min(1).max(3000).optional(),
  metadata: candidateMetadataSchema,
});

export type CandidateQuestion = z.infer<typeof candidateQuestionSchema>;
export type CandidateQuestionInput = z.input<typeof candidateQuestionSchema>;
