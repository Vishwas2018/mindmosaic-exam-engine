import { questionSchema, type Question } from "@/schemas/question.schema";

import type { CandidateQuestion } from "../ingestion/candidate-question";

export type BuildPublishedQuestionOutcome =
  | { readonly ok: true; readonly question: Question }
  | { readonly ok: false; readonly issues: readonly string[] };

/**
 * Maps a staged, eligibility-checked candidate into a real production
 * `Question` — the only place in the factory pipeline permitted to assert
 * `status: "published"`. Field-for-field this mirrors
 * `validation/production-schema-check.ts`'s `buildSyntheticProductionQuestion`
 * (same `metadata.topic` fallback to `strand`, same optional-field
 * spreads), but that function's own doc comment is explicit that its
 * `status: "draft"` placeholder output "is never persisted, never treated
 * as a real production `Question`, and never used to imply this candidate
 * has been reviewed, staged, or published" — this function is the
 * intentionally separate, narrowly-scoped counterpart for the one call
 * site (`orchestratePublication`) that has actually earned the right to
 * make that assertion, only after `checkPublicationEligibility` passes.
 *
 * `origin` is always `"original_seed"` — the production schema's
 * `QUESTION_ORIGINS` enum has exactly one member, and a candidate that
 * reached this point has passed the originality gate, so this is not a
 * false claim: by construction, everything the factory publishes is
 * original MindMosaic content, the same guarantee the hand-curated bank
 * makes for itself.
 */
export function buildPublishedQuestion(candidate: CandidateQuestion): BuildPublishedQuestionOutcome {
  const synthetic = {
    id: candidate.id,
    type: candidate.type,
    yearLevel: candidate.yearLevel,
    examStyle: candidate.examStyle,
    status: "published",
    origin: "original_seed",
    prompt: candidate.prompt,
    ...(candidate.stimulus ? { stimulus: candidate.stimulus } : {}),
    options: candidate.options,
    ...(candidate.interaction ? { interaction: candidate.interaction } : {}),
    visuals: candidate.visuals,
    answerKey: candidate.answerKey,
    explanation: candidate.explanation,
    metadata: { ...candidate.metadata, topic: candidate.metadata.strand },
  };
  const result = questionSchema.safeParse(synthetic);
  if (result.success) return { ok: true, question: result.data };
  return {
    ok: false,
    issues: result.error.issues.map((zodIssue) => `${zodIssue.path.map(String).join(".")}: ${zodIssue.message}`),
  };
}
