import { z } from "zod";

import { answerKindSchema, questionTypeSchema } from "@/schemas/question.schema";

import {
  contentHashSchema,
  difficultyBandSchema,
  localeSchema,
  programmeOfferingRefSchema,
  revisionSchema,
  schemaVersionSchema,
  stableIdSchema,
} from "./common";

/**
 * Runtime content version — the repo-side contract for one immutable
 * `item_versions` row (spec §9.2, ADR-003 §2).
 *
 * This is what Phase 1 will project a `published` publication manifest into. It
 * is defined now, with no table behind it, so that the projection has a
 * validated target shape and so that the two rules that are easy to lose can be
 * asserted by test before any migration exists:
 *
 *  1. **Learner-visible content only.** No answer key, no rubric, no private
 *     explanation, no grading rules. Those live in a separate table with no
 *     `anon`/`authenticated` privileges (spec §9.3, ADR-003 §4). The absence is
 *     the contract, so `.strict()` is load-bearing here rather than stylistic:
 *     an answer key smuggled in as an extra key must be a parse error.
 *  2. **Locale is a version axis, not a field.** A translated question is a
 *     distinct version scoped to the locale-specific offering (ADR-001 §5,
 *     ADR-003 §3). There is deliberately no `translations` map and no
 *     `localeVariants` array; `locale` is singular and participates in content
 *     identity.
 */

/**
 * Pinned stimulus reference. An item version pins the exact stimulus version it
 * uses; multiple questions on one passage share it rather than duplicating the
 * text (spec §9.4). A stimulus edit produces a new stimulus version, and
 * adopting it is an explicit new item version — never an implicit swap.
 */
export const stimulusRefSchema = z
  .object({
    stimulusId: stableIdSchema,
    stimulusRevision: revisionSchema,
    contentHash: contentHashSchema,
  })
  .strict();
export type StimulusRef = z.infer<typeof stimulusRefSchema>;

/**
 * One skill mapping (spec §9.5). Normalized as a row rather than a
 * `skill_ids[]` array precisely because it carries `role` and `weight`, which
 * an array of ids cannot.
 */
export const itemSkillRefSchema = z
  .object({
    taxonomyNodeId: stableIdSchema,
    taxonomyVersion: revisionSchema,
    role: z.enum(["primary", "secondary", "prerequisite"]),
    weight: z.number().min(0).max(1),
  })
  .strict();
export type ItemSkillRef = z.infer<typeof itemSkillRefSchema>;

/**
 * Where this version came from in the Git authoring source (ADR-002 §3). Every
 * runtime row must be traceable back to the governed source that produced it,
 * and that source must remain the only place the fact is authored.
 *
 * **Two classes, discriminated (ADR-002 Amendment A, ADR-003 Amendment A1.)**
 * Phase 1 measured what the bank actually contains: only the 288 factory
 * questions have publication manifests. The ~1,005 curated questions are
 * hand-authored in Git and governed by `scripts/validate-question-bank.mts` —
 * a real chain, just not a manifest-shaped one. A single shape with an optional
 * `manifestId` would make "curated, no manifest by design" indistinguishable
 * from "factory, manifest not imported yet"; a discriminated union makes the
 * first parse and the second fail.
 */
export const PROVENANCE_CLASSES = ["factory_manifest", "curated_git_authored"] as const;
export const provenanceClassSchema = z.enum(PROVENANCE_CLASSES);
export type ProvenanceClass = z.infer<typeof provenanceClassSchema>;

/**
 * What a manifest's review evidence is actually worth.
 *
 * All 288 manifests are `manifestSchemaVersion: 1` today: they carry
 * `recoveredEvidence` (each entry self-declaring `verifiability: "none"`)
 * rather than a `reviewRecords` chain `verifyReviewChain` could check. Naming
 * that here keeps the projection from implying a guarantee no row currently
 * has — see `publication/manifest-schema.ts` on why the distinction exists.
 */
export const REVIEW_EVIDENCE_KINDS = [
  "verified_chain",
  "recovered_unverifiable",
  "none",
] as const;
export const reviewEvidenceKindSchema = z.enum(REVIEW_EVIDENCE_KINDS);

export const publicationProvenanceSchema = z.discriminatedUnion("provenanceClass", [
  z
    .object({
      provenanceClass: z.literal("factory_manifest"),
      manifestId: z.string().trim().min(1).max(200),
      manifestSchemaVersion: z.number().int().positive(),
      /**
       * The factory candidate state the manifest was projected from. Only
       * `published` may produce a runtime row (spec §9.7, ADR-002 §4) — the
       * literal is the enforcement, not a comment.
       */
      factoryCandidateState: z.literal("published"),
      /**
       * How correctness was established, per `publication/manifest-schema.ts`,
       * where it is likewise optional. Absent on all 288 current manifests —
       * they predate the field — so requiring it here would force the
       * projection to invent one. Omission is the honest record.
       */
      correctnessBasis: z.enum(["deterministic", "independent_semantic_review"]).optional(),
      reviewEvidenceKind: reviewEvidenceKindSchema,
      publishedAt: z.iso.datetime(),
      blueprintId: z.string().trim().min(1).max(200).optional(),
    })
    .strict(),
  z
    .object({
      provenanceClass: z.literal("curated_git_authored"),
      /**
       * The governing check, named as a literal so the claim is specific and
       * falsifiable. A curated item is publishable because this validator
       * passes over the whole bank, not because a per-item artefact exists.
       */
      governedBy: z.literal("scripts/validate-question-bank.mts"),
      publishedAt: z.iso.datetime(),
    })
    .strict(),
]);
export type PublicationProvenance = z.infer<typeof publicationProvenanceSchema>;

export const runtimeContentVersionSchema = z
  .object({
    kind: z.literal("runtime_content_version"),
    schemaVersion: schemaVersionSchema,

    /* Stable identity (spec §9.1) — the `items` row this version belongs to. */
    itemId: z.uuid(),
    itemCode: stableIdSchema,
    revision: revisionSchema,

    /* Learner-visible content (spec §9.2). */
    questionType: questionTypeSchema,
    /**
     * The answer key's DISCRIMINANT, not the key. Candidate-visible: the exam UI
     * dispatches renderers on it and has received it since v1, and knowing a
     * question is multiple-choice does not reveal which option is correct.
     *
     * It is here rather than with the answer so that a version-pinned session
     * can produce the same candidate DTO as the legacy path without any
     * application-callable function reading `item_answer_versions` — the
     * boundary ADR-006 Amendment A drew and Amendment D declined to cross.
     */
    answerKind: answerKindSchema,
    /** Word guidance from a `manual` key; absent on every other kind. */
    minWords: z.number().int().positive().max(5000).optional(),
    maxWords: z.number().int().positive().max(5000).optional(),
    prompt: z.string().trim().min(1),
    /** Candidate options and interaction config, already answer-key-stripped. */
    candidateContent: z.record(z.string(), z.unknown()),
    visuals: z.array(z.record(z.string(), z.unknown())).default([]),
    accessibility: z
      .object({
        altTextProvided: z.boolean(),
        /**
         * Answerable from the accessible representation alone. Spec §9.7 is
         * explicit that mere presence of alt text is insufficient, so this is a
         * separate assertion rather than a derivative of `altTextProvided`.
         * ADR-010 sets the review standard behind it.
         */
        answerableFromAccessibleRepresentation: z.boolean(),
        notes: z.string().trim().max(2000).optional(),
      })
      .strict(),
    estimatedTimeSeconds: z.number().int().positive().max(3600),
    authoredDifficulty: difficultyBandSchema,
    marksAvailable: z.number().int().positive().max(20),

    /* Identity and provenance. */
    locale: localeSchema,
    contentSchemaVersion: z.number().int().positive(),
    contentHash: contentHashSchema,
    provenance: publicationProvenanceSchema,

    /* Normalized mappings (spec §9.5) — never arrays of bare ids. */
    scopes: z.array(programmeOfferingRefSchema).min(1),
    skills: z.array(itemSkillRefSchema).default([]),
    stimulus: stimulusRefSchema.optional(),
  })
  .strict();

export type RuntimeContentVersion = z.infer<typeof runtimeContentVersionSchema>;
