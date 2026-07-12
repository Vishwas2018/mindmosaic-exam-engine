import { questionSchema, type Question } from "@/schemas/question.schema";

import type { CandidateQuestion } from "../ingestion/candidate-question";
import { classifyQuestionStructureIssue } from "./schema-issue-classifier";
import type { StructuralValidationIssue } from "./types";

function issue(
  code: StructuralValidationIssue["code"],
  path: string,
  message: string,
): StructuralValidationIssue {
  return { code, path, message, severity: "error" };
}

/**
 * Maps a candidate into the exact shape the authoritative production
 * `questionSchema` expects, filling in only the trust-marker fields that
 * schema requires structurally (`status`, `origin`) with fixed, inert
 * placeholder values. This mapping is used *exclusively* to exercise the
 * production schema's own cross-field `superRefine` checks (unique option/
 * visual ids, answer-key/type compatibility, interaction/answer-key
 * consistency, hotspot region references, reading-comprehension stimulus
 * requirement, and more) — the single source of truth for those rules,
 * reused rather than reimplemented. The returned value is never persisted,
 * never treated as a real production `Question`, and never used to imply
 * this candidate has been reviewed, staged, or published; `stimulus`'s
 * `attribution` literal is left to the schema's own default rather than
 * asserted here, for the same reason.
 *
 * `metadata.topic` is a required field of the production schema that
 * Mission 2A's `candidateQuestionSchema` does not carry at all (only
 * `strand`) — no ingested candidate has a distinct topic value to supply.
 * Rather than universally failing every candidate on a field this gate's
 * only current input source never populates, `topic` defaults to `strand`
 * here: a deterministic, documented mapping-shape default for structural-
 * check purposes only, never an assertion of the question's real topic.
 * See the mission doc's "Known limitations".
 */
function buildSyntheticProductionQuestion(candidate: CandidateQuestion): unknown {
  return {
    id: candidate.id,
    type: candidate.type,
    yearLevel: candidate.yearLevel,
    examStyle: candidate.examStyle,
    status: "draft",
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
}

export type ProductionSchemaCheckOutcome =
  | { readonly ok: true; readonly question: Question }
  | { readonly ok: false; readonly issues: readonly StructuralValidationIssue[] };

/**
 * Runs the candidate through the real production `questionSchema`. On
 * success, returns the fully-typed `Question` so the scoring-compatibility
 * check can use it directly without re-deriving it. On failure, every Zod
 * issue is classified into the closed structural-validation code catalogue
 * via `classifyQuestionStructureIssue` (shared with the
 * `candidateQuestionSchema` re-check in `candidate-checks.ts`, since both
 * schemas share field paths for everything the classifier inspects).
 */
export function checkAgainstProductionSchema(candidate: CandidateQuestion): ProductionSchemaCheckOutcome {
  const synthetic = buildSyntheticProductionQuestion(candidate);
  const result = questionSchema.safeParse(synthetic);
  if (result.success) return { ok: true, question: result.data };

  const issues = result.error.issues.map((zodIssue) =>
    issue(
      classifyQuestionStructureIssue(zodIssue.path),
      ["question", ...zodIssue.path.map(String)].join("."),
      zodIssue.message,
    ),
  );
  return { ok: false, issues };
}
