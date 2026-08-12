import { z } from "zod";

import { assessmentBlueprintVersionSchema } from "./assessment-blueprint-version.schema";
import { assessmentProfileVersionSchema } from "./assessment-profile-version.schema";
import { frameworkVersionSchema } from "./framework-version.schema";
import { runtimeContentVersionSchema } from "./runtime-content-version.schema";

/**
 * Phase 0 platform contracts (spec §10, §21 Phase 0).
 *
 * **These are repository assets with no database behind them, and nothing in
 * `src/` imports them yet.** That is the intended state at the end of Phase 0,
 * which is contracts-only: no migrations, no new tables. Phase 1 projects
 * published manifests into `runtimeContentVersionSchema`'s shape; Phase 3 gives
 * the other three storage. Defining and testing them now is what stops each
 * phase from inventing its own JSON shape and calling it a contract.
 *
 * Every version object carries a `kind` discriminator and a `schemaVersion`,
 * as spec §10.1 requires — "configuration MAY use JSONB, but every version MUST
 * have a discriminator, schema version, and corresponding Zod validation.
 * Unvalidated arbitrary JSON is forbidden."
 */

export {
  ASSESSMENT_FAMILIES,
  DELIVERY_MODES,
  DIFFICULTY_BANDS,
  SCHEMA_VERSION,
  SCORING_ELIGIBILITIES,
  assessmentFamilySchema,
  contentHashSchema,
  deliveryModeSchema,
  difficultyBandSchema,
  localeSchema,
  programmeOfferingRefSchema,
  revisionSchema,
  schemaVersionSchema,
  scoringEligibilitySchema,
  stableIdSchema,
} from "./common";
export type { AssessmentFamily, DeliveryMode, DifficultyBand, ProgrammeOfferingRef } from "./common";

export {
  itemSkillRefSchema,
  publicationProvenanceSchema,
  runtimeContentVersionSchema,
  stimulusRefSchema,
} from "./runtime-content-version.schema";
export type {
  ItemSkillRef,
  PublicationProvenance,
  RuntimeContentVersion,
  StimulusRef,
} from "./runtime-content-version.schema";

export {
  adaptiveRoutingRulesSchema,
  frameworkVersionSchema,
  navigationRulesSchema,
  scoringPolicySchema,
  stageDefinitionSchema,
  submissionRulesSchema,
  timingRulesSchema,
  toolPermissionsSchema,
} from "./framework-version.schema";
export type { FrameworkVersion, StageDefinition } from "./framework-version.schema";

export {
  assessmentBlueprintCellSchema,
  assessmentBlueprintVersionSchema,
} from "./assessment-blueprint-version.schema";
export type {
  AssessmentBlueprintCell,
  AssessmentBlueprintVersion,
} from "./assessment-blueprint-version.schema";

export {
  AVAILABILITY_STATUSES,
  assessmentProfileVersionSchema,
  availabilityStatusSchema,
} from "./assessment-profile-version.schema";
export type {
  AssessmentProfileVersion,
  AvailabilityStatus,
} from "./assessment-profile-version.schema";

/**
 * Every platform version object, discriminated by `kind`.
 *
 * A single union is what makes a mixed store (one JSONB column, one import
 * feed, one audit log) parseable without the reader knowing in advance what it
 * is holding — and it makes "which kinds exist" a compile-time fact rather than
 * a convention.
 *
 * `z.discriminatedUnion` cannot take a schema whose top level is a
 * `ZodEffects`/refinement, so the three refined members are wrapped in a plain
 * union with a manual `kind` switch instead. Same guarantee, and the per-member
 * `superRefine` checks still run.
 */
export const PLATFORM_VERSION_KINDS = [
  "runtime_content_version",
  "framework_version",
  "assessment_blueprint_version",
  "assessment_profile_version",
] as const;

export type PlatformVersionKind = (typeof PLATFORM_VERSION_KINDS)[number];

export const platformVersionSchema = z.union([
  runtimeContentVersionSchema,
  frameworkVersionSchema,
  assessmentBlueprintVersionSchema,
  assessmentProfileVersionSchema,
]);

export type PlatformVersion = z.infer<typeof platformVersionSchema>;

/**
 * A profile plus the exact framework and blueprint versions it pins, validated
 * together.
 *
 * Each part is independently valid on its own; this asserts the three agree —
 * the profile's `deliveryMode` matches its framework's, and its
 * `scoringAlgorithm*` matches the framework's scoring policy. A mismatch here
 * would mean a session records one delivery mode while being delivered under
 * another, which is the kind of drift that only surfaces mid-sitting.
 */
export const resolvedAssessmentProfileSchema = z
  .object({
    profile: assessmentProfileVersionSchema,
    framework: frameworkVersionSchema,
    blueprint: assessmentBlueprintVersionSchema,
  })
  .strict()
  .superRefine((resolved, context) => {
    const { profile, framework, blueprint } = resolved;

    if (profile.frameworkId !== framework.frameworkId) {
      context.addIssue({
        code: "custom",
        path: ["framework", "frameworkId"],
        message: `profile pins framework '${profile.frameworkId}'`,
      });
    }
    if (profile.frameworkRevision !== framework.revision) {
      context.addIssue({
        code: "custom",
        path: ["framework", "revision"],
        message: `profile pins framework revision ${profile.frameworkRevision}`,
      });
    }
    if (profile.blueprintId !== blueprint.blueprintId) {
      context.addIssue({
        code: "custom",
        path: ["blueprint", "blueprintId"],
        message: `profile pins blueprint '${profile.blueprintId}'`,
      });
    }
    if (profile.blueprintRevision !== blueprint.revision) {
      context.addIssue({
        code: "custom",
        path: ["blueprint", "revision"],
        message: `profile pins blueprint revision ${profile.blueprintRevision}`,
      });
    }
    if (profile.deliveryMode !== framework.deliveryMode) {
      context.addIssue({
        code: "custom",
        path: ["profile", "deliveryMode"],
        message: `profile says ${profile.deliveryMode}, framework says ${framework.deliveryMode}`,
      });
    }
    if (
      profile.scoringAlgorithmId !== framework.scoring.algorithmId ||
      profile.scoringAlgorithmVersion !== framework.scoring.algorithmVersion
    ) {
      context.addIssue({
        code: "custom",
        path: ["profile", "scoringAlgorithmId"],
        message: "profile and framework pin different scoring algorithm versions",
      });
    }

    /* Every blueprint cell must land in a stage the framework declares.
       Otherwise the paper specifies measurement for a stage nobody sits. */
    const stageIds = new Set(framework.stages.map((stage) => stage.stageId));
    for (const [index, cell] of blueprint.cells.entries()) {
      if (!stageIds.has(cell.stageId)) {
        context.addIssue({
          code: "custom",
          path: ["blueprint", "cells", index, "stageId"],
          message: `framework declares no stage '${cell.stageId}'`,
        });
      }
    }
  });

export type ResolvedAssessmentProfile = z.infer<typeof resolvedAssessmentProfileSchema>;
