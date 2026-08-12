import { z } from "zod";

import { questionTypeSchema } from "@/schemas/question.schema";

/**
 * The sanitized candidate DTO for a version-pinned session (spec §17.1, §18).
 *
 * §18: "Candidate-question DTOs MUST structurally omit private answer and
 * explanation fields." Two things make that true here rather than intended:
 *
 *  1. `public.get_assessment_session` (20260812120000) builds its JSON by
 *     naming columns, never by spreading a row, so no answer field is produced
 *     in the first place; and
 *  2. every object below is `.strict()`, so if one ever were produced, parsing
 *     fails loudly instead of passing it through.
 *
 * The second is the reason this file exists at all. A type alone would not do
 * it: TypeScript erases, so an extra `answerKey` on a value typed as a
 * candidate item would reach a client happily. `.strict()` is a runtime
 * assertion that the shape is *exactly* this, and it is the only mechanism here
 * that survives to production.
 *
 * Note what is deliberately absent from every schema below: `answerKey`,
 * `explanation`, `privateExplanation`, `rubric`, `gradingRules`,
 * `correctOptionId`. There is no field for them, and `.strict()` means there is
 * no room for them either. src/tests/unit/candidate-session-dto.test.ts asserts
 * both halves.
 */

/**
 * `candidateContent` is `z.record(z.unknown())` rather than a discriminated
 * union of interaction shapes, and that is a real limitation worth naming: the
 * contents of this object are not individually validated here. What protects it
 * is upstream — `runtimeContentVersionSchema` is `.strict()` and the projection
 * parses every row through it before insert, so an answer smuggled into
 * candidate content is a parse error at projection time
 * (src/features/content-projection/project-question.ts builds it by positive
 * listing for the same reason). This schema's job is the envelope.
 */
const candidateContentSchema = z.record(z.string(), z.unknown());

export const candidateSessionItemSchema = z
  .object({
    /** The ledger row, which is also the key a response is committed under. */
    sessionItemId: z.uuid(),
    ordinal: z.number().int().positive(),
    itemCode: z.string().min(1),
    questionType: questionTypeSchema,
    prompt: z.string().min(1),
    candidateContent: candidateContentSchema,
    visuals: z.array(z.record(z.string(), z.unknown())),
    accessibility: z.record(z.string(), z.unknown()),
    marksAvailable: z.number().int().positive(),
    estimatedTimeSeconds: z.number().int().positive(),
    /** The shared passage, if the pinned version used one. Null otherwise. */
    stimulus: z.unknown().nullable(),
  })
  .strict();

export type CandidateSessionItem = z.infer<typeof candidateSessionItemSchema>;

export const candidateSessionSchema = z
  .object({
    sessionId: z.uuid(),
    status: z.enum(["created", "active", "interrupted", "submitted", "processed", "abandoned"]),
    /** The optimistic lock (§12.3), so a client can detect a stale view. */
    version: z.number().int().positive(),
    config: z.record(z.string(), z.unknown()),
    createdAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }),
    /* Present so a result can be interpreted against the algorithm the sitting
       was actually sat under (§14.2). It is a version string, not a capability:
       nothing a client sends back about it is trusted. */
    scoringAlgorithmVersion: z.string().min(1),
    items: z.array(candidateSessionItemSchema),
  })
  .strict();

export type CandidateSession = z.infer<typeof candidateSessionSchema>;

/**
 * Parses what `get_assessment_session` returned.
 *
 * Deliberately throwing rather than returning a result union: a payload that
 * does not match this shape is either a schema change nobody propagated or an
 * answer field that has appeared in a learner-facing response. Neither should
 * be degraded into a partial render.
 */
export function parseCandidateSession(payload: unknown): CandidateSession {
  return candidateSessionSchema.parse(payload);
}
