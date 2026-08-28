import { z } from "zod";

import { australianJurisdictionCodeSchema } from "@/features/curriculum/jurisdictions";
import { EXAM_STYLES, yearLevelSchema } from "@/schemas/question.schema";

/**
 * Primitives shared by the Phase 0 platform contracts.
 *
 * These are repository assets, not database tables. Phase 0 of
 * `docs/spec/scalable-assessment-platform-spec-v1.md` is contracts-only: the
 * shapes are defined and tested here so that Phases 1-3 have something to
 * project *to*, and so the "every configuration version carries a
 * discriminator, a schema version and Zod validation" rule (spec §10.1) is
 * satisfiable before the first migration is written.
 *
 * Nothing in `src/schemas/platform/` is imported by application code yet. That
 * is deliberate — see the note in ./index.ts.
 */

/**
 * Every versioned configuration object carries its own schema version, so a
 * reader can tell a v1 row from a v2 row without guessing from its shape.
 * Spec §10.1 forbids unvalidated arbitrary JSON; a version-less object is the
 * first step back towards it.
 */
export const SCHEMA_VERSION = 1;
export const schemaVersionSchema = z.literal(SCHEMA_VERSION);

/**
 * BCP-47. Content is NOT assumed locale-neutral (ADR-001 §5, ADR-003 §3): a
 * translated question is a distinct item version scoped to the locale-specific
 * offering, never a locale-tagged field on a shared version. Locale therefore
 * appears in the offering key and in content identity, and both are validated
 * with this.
 *
 * Deliberately wider than `question.schema.ts`'s `locale: z.literal("en-AU")`.
 * That literal is an accurate statement about the *current* bank; this is the
 * contract a second locale has to be expressible in before it can exist.
 */
export const localeSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/, "expected a BCP-47 tag such as en-AU");

/** Lowercase hex SHA-256, matching `fs-factory-repository.ts`'s content hashing. */
export const contentHashSchema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, "expected a lowercase hex sha-256 digest");

/**
 * A stable, human-readable identifier: lowercase, dot/dash/underscore
 * segmented. Used for families, programmes, subjects, sections and stages.
 *
 * Spec §6.2/§6.4 require stable text identifiers backed by reference tables and
 * forbid PostgreSQL enums for extensible business identifiers, because adding a
 * value to a Postgres enum is a schema migration that cannot run inside a
 * transaction alongside data changes and cannot be reverted cleanly.
 */
export const stableIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+([._-][a-z0-9]+)*$/, "expected a lowercase dot/dash/underscore identifier");

/** Monotonic revision within one logical entity. Starts at 1, never reused. */
export const revisionSchema = z.number().int().positive();

/**
 * Assessment family. Seeded from today's `ExamStyle` plus the third family the
 * spec names (§6.2). Not a Zod enum over a closed DB type — see
 * `stableIdSchema` — but pinned here so Phase 0 contracts cannot drift from the
 * two styles the app actually implements.
 */
export const ASSESSMENT_FAMILIES = [...EXAM_STYLES, "curriculum_practice"] as const;
export const assessmentFamilySchema = z.enum(ASSESSMENT_FAMILIES);
export type AssessmentFamily = z.infer<typeof assessmentFamilySchema>;

/**
 * Delivery mode. `fixed_path` is everything the platform does today; the spec
 * defaults to it (§24) until ADR-007 is accepted.
 */
export const DELIVERY_MODES = ["fixed_path", "adaptive_mst"] as const;
export const deliveryModeSchema = z.enum(DELIVERY_MODES);
export type DeliveryMode = z.infer<typeof deliveryModeSchema>;

/** Authored difficulty. Same three bands as `questionMetadataSchema.difficulty`. */
export const DIFFICULTY_BANDS = ["easy", "medium", "challenging"] as const;
export const difficultyBandSchema = z.enum(DIFFICULTY_BANDS);
export type DifficultyBand = z.infer<typeof difficultyBandSchema>;

/**
 * Whether a cell's items are scored by machine or need a human.
 * Manual-review questions must not influence live adaptive routing (spec §9.7),
 * so a blueprint cell has to be able to say which it wants.
 */
export const SCORING_ELIGIBILITIES = ["machine", "manual", "either"] as const;
export const scoringEligibilitySchema = z.enum(SCORING_ELIGIBILITIES);

/**
 * A programme offering: `programme × subject × year_level × locale × region`
 * (spec §6.3; ADR-014). `region` is part of the database natural key and must
 * remain part of the application identity as well.
 * The database MUST enforce uniqueness for this combination; this is the
 * in-repo shape of the same key.
 *
 * `yearLevel` reuses `yearLevelSchema` rather than restating a range, so the
 * canonical product range stays in `src/features/taxonomy/year-registry.ts`
 * (ADR-001 §1) and no second year matrix is introduced here.
 */
export const programmeOfferingRefSchema = z.object({
  family: assessmentFamilySchema,
  programmeId: stableIdSchema,
  subjectId: stableIdSchema,
  yearLevel: yearLevelSchema,
  locale: localeSchema,
  region: z.union([z.literal("global"), australianJurisdictionCodeSchema]),
});
export type ProgrammeOfferingRef = z.infer<typeof programmeOfferingRefSchema>;
