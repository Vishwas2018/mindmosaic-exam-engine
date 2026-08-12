import { z } from "zod";

import { questionTypeSchema } from "@/schemas/question.schema";

import {
  deliveryModeSchema,
  revisionSchema,
  schemaVersionSchema,
  stableIdSchema,
} from "./common";

/**
 * Framework version — delivery behaviour shared across profiles (spec §10.1).
 *
 * A framework answers "how is this sat", never "what does it measure" (that is
 * the blueprint) and never "which offering is it for" (that is the profile).
 * Keeping the three apart is what lets one navigation/timing policy be reused
 * across many subjects without copying it.
 *
 * Spec §10.1 permits JSONB storage but requires a discriminator, a schema
 * version and Zod validation on every version. `.strict()` throughout is how
 * that requirement is made real: unrecognised configuration keys are a parse
 * error, not silently retained arbitrary JSON.
 *
 * Storage, supersession and breaking-vs-additive change rules are ADR-004's to
 * decide. This file fixes only the shape.
 */

/** Stage structure. A fixed-path framework has exactly one stage. */
export const stageDefinitionSchema = z
  .object({
    stageId: stableIdSchema,
    ordinal: z.number().int().nonnegative(),
    label: z.string().trim().min(1).max(120),
    /**
     * Sealed stages cannot be revisited once completed. Adaptive MST requires
     * this (routing has already consumed the stage's outcome); fixed-path
     * sittings normally do not.
     */
    sealOnComplete: z.boolean(),
  })
  .strict();
export type StageDefinition = z.infer<typeof stageDefinitionSchema>;

export const navigationRulesSchema = z
  .object({
    /** Free navigation within the current stage, as today's exam page allows. */
    allowBacktrackWithinStage: z.boolean(),
    allowBacktrackAcrossStages: z.boolean(),
    allowFlagForReview: z.boolean(),
    allowSkip: z.boolean(),
  })
  .strict();

export const timingRulesSchema = z
  .object({
    mode: z.enum(["timed", "untimed"]),
    /** Whole-sitting limit. Null for untimed. */
    totalSeconds: z.number().int().positive().max(86_400).nullable(),
    /** Per-stage limits, keyed by `stageId`. Empty when timing is global only. */
    perStageSeconds: z.record(stableIdSchema, z.number().int().positive()).default({}),
    /**
     * Grace beyond the deadline in which a late submission is clamped and
     * recorded as `timer_expired` rather than rejected. The live fixed-path
     * value is 300 (`api/exam/session/route.ts` `TIMED_GRACE_SECONDS`).
     */
    lateSubmissionGraceSeconds: z.number().int().nonnegative().max(3600),
  })
  .strict();

export const submissionRulesSchema = z
  .object({
    allowManualSubmit: z.boolean(),
    autoSubmitOnExpiry: z.boolean(),
    /** Whether an unanswered question blocks submission. */
    requireAllAnswered: z.boolean(),
  })
  .strict();

export const scoringPolicySchema = z
  .object({
    /**
     * Pins the scoring implementation. A session references an exact profile
     * version, which references an exact framework version, which pins this —
     * so a scoring change cannot retroactively alter a completed sitting
     * (spec §14.2, ADR-003 §7).
     */
    algorithmId: stableIdSchema,
    algorithmVersion: revisionSchema,
    negativeMarking: z.boolean(),
    partialCredit: z.boolean(),
    /** Manual-review items are excluded from any live routing decision. */
    manualReviewAffectsRouting: z.literal(false),
  })
  .strict();

export const toolPermissionsSchema = z
  .object({
    calculator: z.boolean(),
    /** The rough-work scratchpad shipped for the exam page. */
    scratchpad: z.boolean(),
    formulaSheet: z.boolean(),
    dictionary: z.boolean(),
  })
  .strict();

/**
 * Adaptive routing rules. Present only when `deliveryMode` is `adaptive_mst`;
 * spec §24 defers items-per-stage and threshold values to ADR-007/008, so this
 * shape carries them as data rather than baking any in.
 */
export const adaptiveRoutingRulesSchema = z
  .object({
    itemsPerStage: z.record(stableIdSchema, z.number().int().positive()),
    /** Ordered routes out of a stage, each with the score band that selects it. */
    routes: z
      .array(
        z
          .object({
            fromStageId: stableIdSchema,
            toStageId: stableIdSchema,
            minProportionCorrect: z.number().min(0).max(1),
            maxProportionCorrect: z.number().min(0).max(1),
          })
          .strict(),
      )
      .min(1),
    abilityReporting: z.enum(["banded", "numeric"]),
  })
  .strict();

export const frameworkVersionSchema = z
  .object({
    kind: z.literal("framework_version"),
    schemaVersion: schemaVersionSchema,

    frameworkId: stableIdSchema,
    revision: revisionSchema,
    label: z.string().trim().min(1).max(160),

    deliveryMode: deliveryModeSchema,
    stages: z.array(stageDefinitionSchema).min(1),
    navigation: navigationRulesSchema,
    timing: timingRulesSchema,
    submission: submissionRulesSchema,
    scoring: scoringPolicySchema,
    supportedQuestionTypes: z.array(questionTypeSchema).min(1),
    tools: toolPermissionsSchema,
    adaptiveRouting: adaptiveRoutingRulesSchema.optional(),
  })
  .strict()
  .superRefine((framework, context) => {
    /* Routing rules are meaningless without adaptive delivery, and adaptive
       delivery is unimplementable without them. Either mismatch is a
       configuration error worth failing at parse time rather than at the first
       stage transition of a real sitting. */
    if (framework.deliveryMode === "adaptive_mst" && !framework.adaptiveRouting) {
      context.addIssue({
        code: "custom",
        path: ["adaptiveRouting"],
        message: "adaptive_mst delivery requires adaptiveRouting",
      });
    }
    if (framework.deliveryMode === "fixed_path" && framework.adaptiveRouting) {
      context.addIssue({
        code: "custom",
        path: ["adaptiveRouting"],
        message: "fixed_path delivery must not carry adaptiveRouting",
      });
    }
    /* A single-stage framework that seals its only stage, or routes out of it,
       is describing something it cannot deliver. */
    if (framework.deliveryMode === "fixed_path" && framework.stages.length !== 1) {
      context.addIssue({
        code: "custom",
        path: ["stages"],
        message: "fixed_path delivery has exactly one stage",
      });
    }
    const stageIds = new Set(framework.stages.map((stage) => stage.stageId));
    if (stageIds.size !== framework.stages.length) {
      context.addIssue({ code: "custom", path: ["stages"], message: "duplicate stageId" });
    }
    for (const [index, route] of (framework.adaptiveRouting?.routes ?? []).entries()) {
      for (const [key, id] of [
        ["fromStageId", route.fromStageId],
        ["toStageId", route.toStageId],
      ] as const) {
        if (!stageIds.has(id)) {
          context.addIssue({
            code: "custom",
            path: ["adaptiveRouting", "routes", index, key],
            message: `unknown stageId '${id}'`,
          });
        }
      }
      if (route.minProportionCorrect > route.maxProportionCorrect) {
        context.addIssue({
          code: "custom",
          path: ["adaptiveRouting", "routes", index],
          message: "empty score band: min exceeds max",
        });
      }
    }
    if (framework.timing.mode === "timed" && framework.timing.totalSeconds === null) {
      context.addIssue({
        code: "custom",
        path: ["timing", "totalSeconds"],
        message: "timed sittings need a total duration",
      });
    }
  });

export type FrameworkVersion = z.infer<typeof frameworkVersionSchema>;
