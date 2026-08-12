import { z } from "zod";

import {
  deliveryModeSchema,
  programmeOfferingRefSchema,
  revisionSchema,
  schemaVersionSchema,
  stableIdSchema,
} from "./common";

/**
 * Assessment profile version — the binding that a session pins (spec §10.3).
 *
 * A profile joins a programme offering to an exact framework version and an
 * exact blueprint version, plus duration, scoring algorithm version and
 * availability. **A session MUST reference the exact profile version, never a
 * mutable "current" profile** — that is the whole reason this object is
 * versioned, and it is what makes a historical sitting replayable after the
 * configuration moves on.
 *
 * `availability` is the profile's own lifecycle and is deliberately independent
 * of content readiness. Validity (does this offering exist) comes from the year
 * and subject registries; readiness (is there enough governed content for this
 * delivery mode) is computed separately — `coverage.ts` today, the capacity
 * simulator from Phase 3 (ADR-001 §7-8, ADR-010). A profile can be `available`
 * and still not ready to deliver; publishing content must never be what makes a
 * profile exist.
 */

export const AVAILABILITY_STATUSES = ["draft", "available", "withdrawn"] as const;
export const availabilityStatusSchema = z.enum(AVAILABILITY_STATUSES);
export type AvailabilityStatus = z.infer<typeof availabilityStatusSchema>;

export const assessmentProfileVersionSchema = z
  .object({
    kind: z.literal("assessment_profile_version"),
    schemaVersion: schemaVersionSchema,

    profileId: stableIdSchema,
    revision: revisionSchema,
    label: z.string().trim().min(1).max(160),

    offering: programmeOfferingRefSchema,

    /* Pinned by id AND revision. A bare id would reintroduce exactly the
       "current version" mutability this object exists to prevent. */
    frameworkId: stableIdSchema,
    frameworkRevision: revisionSchema,
    blueprintId: stableIdSchema,
    blueprintRevision: revisionSchema,

    /**
     * Restated here rather than only read through the framework, because the
     * profile is what an operator selects and what a session records. The
     * superRefine on the composed contract in ./index.ts asserts the two agree;
     * within this file it is a declaration of intent that a mismatched
     * framework cannot silently satisfy.
     */
    deliveryMode: deliveryModeSchema,

    durationSeconds: z.number().int().positive().max(86_400).nullable(),
    scoringAlgorithmId: stableIdSchema,
    scoringAlgorithmVersion: revisionSchema,

    availability: availabilityStatusSchema,
    /** Set when and only when availability is `withdrawn`. */
    withdrawnAt: z.iso.datetime().optional(),
  })
  .strict()
  .superRefine((profile, context) => {
    if (profile.availability === "withdrawn" && profile.withdrawnAt === undefined) {
      context.addIssue({
        code: "custom",
        path: ["withdrawnAt"],
        message: "a withdrawn profile records when it was withdrawn",
      });
    }
    if (profile.availability !== "withdrawn" && profile.withdrawnAt !== undefined) {
      context.addIssue({
        code: "custom",
        path: ["withdrawnAt"],
        message: "withdrawnAt is only meaningful for a withdrawn profile",
      });
    }
  });

export type AssessmentProfileVersion = z.infer<typeof assessmentProfileVersionSchema>;
