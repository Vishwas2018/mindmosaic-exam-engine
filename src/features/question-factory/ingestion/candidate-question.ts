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
 * Candidate-only declared multi-step working (never added to the production
 * `questionSchema` — see `docs/reports/correctness-multistep-design.md`
 * §3.1/§3.8). The correctness-verification gate mechanically re-executes
 * this structure (`correctness/derive-multistep-answer.ts`) rather than
 * trusting it; it is metadata a generator supplies to help verification,
 * never something shown to or scored against a learner, mirroring how
 * `explanation` is present but not itself scored.
 *
 * `operandRefSchema` deliberately has no `"literal"` variant: the design's
 * §3.3 grounding check identified a bare generator-declared literal operand
 * as the one way a fabricated working could "prove" a wrong answer, and
 * recommended making that unrepresentable rather than merely rejected. Every
 * operand a generator declares must therefore route through a
 * `promptQuantities` entry (itself grounding-checked against the prompt/
 * visual data at verification time) or a live `visual` field read, or chain
 * from an already-verified `step_output` — never a bare number with no
 * traceable origin. Any small constant a conversion needs internally (e.g.
 * the `1000` in kg→g) lives in the closed conversion table in
 * `correctness/unit-conversion.ts`, never as a declared operand here.
 */
export const operandRefSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("prompt_quantity"),
    quantityId: z.string().trim().min(1).max(40),
  }),
  z.object({
    source: z.literal("visual"),
    visualId: z.string().trim().min(1).max(80),
    field: z.string().trim().min(1).max(80),
  }),
  z.object({
    source: z.literal("step_output"),
    stepIndex: z.number().int().nonnegative(),
  }),
]);

export const workingStepSchema = z.object({
  index: z.number().int().nonnegative(),
  operation: z.enum(["add", "subtract", "multiply", "divide", "convert_unit"]),
  operands: z.array(operandRefSchema).min(1).max(2),
  targetUnit: z.string().trim().min(1).max(20).optional(),
});

export const promptQuantitySchema = z.object({
  id: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(30),
  unit: z.string().trim().min(1).max(20).optional(),
});

/**
 * Schema-level bounds here are a generous ingestion-time DoS safety cap,
 * deliberately looser than `CORRECTNESS_LIMITS.MULTISTEP_MAX_STEPS`/
 * `MULTISTEP_MAX_PROMPT_QUANTITIES` — the semantic bound the correctness
 * gate itself enforces at derivation time (mirroring how ordering/matching
 * interaction items are bounded loosely here but tightly by
 * `CORRECTNESS_LIMITS.MAX_ORDERING_ITEMS` inside `derive-answer.ts`), so a
 * resource-limit breach is provably a `multistep_resource_limit_exceeded`
 * derivation failure rather than an earlier schema rejection.
 */
export const declaredWorkingSolutionSchema = z.object({
  promptQuantities: z.array(promptQuantitySchema).max(64),
  steps: z.array(workingStepSchema).min(1).max(64),
});

export type OperandRef = z.infer<typeof operandRefSchema>;
export type WorkingStep = z.infer<typeof workingStepSchema>;
export type PromptQuantity = z.infer<typeof promptQuantitySchema>;
export type DeclaredWorkingSolution = z.infer<typeof declaredWorkingSolutionSchema>;

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
  workingSteps: declaredWorkingSolutionSchema.optional(),
});

export type CandidateQuestion = z.infer<typeof candidateQuestionSchema>;
export type CandidateQuestionInput = z.input<typeof candidateQuestionSchema>;
