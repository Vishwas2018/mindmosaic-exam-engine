import type { Question } from "@/schemas/question.schema";

import type { Blueprint } from "../blueprints";
import { FACTORY_LIMITS, FACTORY_VERSIONS } from "../config";
import type { ReviewPromptIssueCode } from "../config";
import { hashJson, stableStringify } from "../provenance";
import type { SemanticClassification } from "../workflow";

/**
 * The canonical, ordered instruction lines every review prompt pack
 * carries — restated verbatim from the governing content-rules document
 * (mirrors `generation/prompt-builder.ts`'s `INSTRUCTIONS` convention) so
 * the instruction can never silently drift from what actually governs
 * review policy. Fixed order and content: two packs built from the same
 * candidate always produce byte-identical instructions.
 */
const INSTRUCTIONS: readonly string[] = [
  "You are an independent reviewer. You did not generate this content, and your review must be based only on the candidate content below — never on any generator-side reasoning, confidence, or self-assessment (none is provided, because none should ever influence your judgement).",
  "Write every field in Australian English (en-AU spelling: colour, organise, centre, ...) when your response includes free text.",
  "Age-suitability: judge the content against the stated year level and difficulty — language, concepts, and reasoning load must be appropriate for that audience.",
  "Ambiguity: mark 'resolved' only if you identified a genuine ambiguity and are confident it does not affect correctness; mark 'unresolved' if a real ambiguity remains that you cannot resolve; mark 'none' if you found no ambiguity at all. Do not use 'unresolved' as a default hedge.",
  "Evidence sufficiency: a 'passed' result requires at least one concise evidence reference (e.g. a specific phrase, field, or reasoning step you checked) — never assert 'passed' with zero evidence references.",
  "Originality: flag (do not adjudicate) any content you suspect reproduces or closely paraphrases NAPLAN, ICAS, textbook, commercial, or other copyrighted material — final originality determination is made by a separate, dedicated check, not by you.",
  "If the answer key is not shown to you, state what you independently believe the correct answer is within your findings, before seeing any declared answer — this supports a later cross-check without biasing your ambiguity judgement.",
  "Confidence scale (0.0-1.0, anchored): 0.0-0.2 no real basis to judge; 0.2-0.4 substantial doubt; 0.4-0.6 genuine uncertainty; 0.6-0.8 fairly confident with minor reservations; 0.8-1.0 confident, evidence-backed.",
  "Respond with exactly one JSON object matching the response schema below — no prose, no markdown code fencing, no commentary before or after the JSON.",
  "Do not include chain-of-thought, hidden reasoning, or a step-by-step working section — only the fields the response schema defines.",
];

const RESPONSE_SCHEMA_DESCRIPTION =
  "A single JSON object. Fields: reviewId (a fresh identifier for this submission), candidateId, candidateRevision, candidateContentHash, blueprintHash, " +
  "reviewerModel (your declared model/tool name), reviewerVersion, reviewedAt (ISO 8601), " +
  "result (one of: passed, failed, warning, uncertain), confidence (0-1), " +
  "findings (array of concise strings, max 15), evidenceReferences (array of concise strings, max 15, required non-empty when result is 'passed'), " +
  "recommendedCorrections (optional array of concise strings, max 15), " +
  "ambiguityStatus (one of: none, resolved, unresolved), reviewPromptVersion, reviewPromptHash.";

export interface ReviewPromptCandidateEntry {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprint: Blueprint;
  readonly blueprintHash: string;
  readonly semanticClassification: SemanticClassification;
  readonly question: Question;
}

export interface ReviewRubric {
  readonly kind: "objective_already_verified" | "objective_cross_check" | "open_ended_human_graded";
  readonly guidance: string;
  /** Present only for `open_ended_human_graded` content, per PD-8's inclusion policy. */
  readonly modelAnswerGuidance?: string;
}

/**
 * PD-8 (Mission 3 prerequisite decisions): the answer/rubric inclusion
 * policy is keyed on `semanticClassification`, never hand-varied per
 * call site. `manual_review_writing` content includes the full rubric
 * and explanation as marking guidance (the reviewer needs it to judge
 * open-ended correctness). `semantic_objective` content omits any
 * representation of the declared answer entirely, asking the reviewer to
 * state their own belief instead (see `INSTRUCTIONS`) — deliberately
 * avoiding priming the reviewer's ambiguity judgement with a pre-shown
 * "correct" answer. `deterministically_computable` content (already
 * independently re-derived by the correctness gate) has no bias concern,
 * so its rubric simply states that fact.
 */
function buildRubric(entry: ReviewPromptCandidateEntry): ReviewRubric {
  if (entry.semanticClassification === "manual_review_writing") {
    return {
      kind: "open_ended_human_graded",
      guidance:
        "This is open-ended, human-graded content. Judge originality, age-suitability, and clarity of the marking guidance; there is no single objectively-correct string answer.",
      modelAnswerGuidance: entry.question.explanation,
    };
  }
  if (entry.semanticClassification === "semantic_objective") {
    return {
      kind: "objective_cross_check",
      guidance:
        "This content has one objectively-correct answer, but the declared answer key is deliberately withheld from you here. State what you independently believe the correct answer is within your findings — see the instructions.",
    };
  }
  return {
    kind: "objective_already_verified",
    guidance:
      "This content's answer has already been independently re-derived and verified by the deterministic correctness gate. Focus your review on age-suitability, ambiguity, and originality, not on re-deriving correctness.",
  };
}

export interface ReviewPromptPack {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprint: Blueprint;
  readonly blueprintHash: string;
  readonly semanticClassification: SemanticClassification;
  readonly rubric: ReviewRubric;
  /** Bounded-inclusion candidate content — see `buildRubric`'s doc comment for what is/isn't shown. */
  readonly candidateContent: {
    readonly type: string;
    readonly yearLevel: number;
    readonly examStyle: string;
    readonly prompt: string;
    readonly stimulus?: unknown;
    readonly options: unknown;
    readonly visuals: unknown;
    readonly metadata: unknown;
  };
  readonly reviewPromptVersion: string;
  readonly instructions: readonly string[];
  readonly responseSchemaDescription: string;
  readonly maxResponseBytes: number;
}

export interface ReviewPromptPackWithHash {
  readonly status: "built";
  readonly pack: ReviewPromptPack;
  readonly promptHash: string;
}

export type ReviewPromptBuildFailure = {
  readonly status: "review_prompt_pack_limit_exceeded";
  readonly message: string;
};

export type ReviewPromptBuildResult = ReviewPromptPackWithHash | ReviewPromptBuildFailure;

/** Compile-time link to the catalogued issue codes, mirroring `generation/prompt-builder.ts`'s assertion. */
export const assertReviewPromptBuildFailureStatusIsCatalogued: (
  status: ReviewPromptBuildFailure["status"],
) => ReviewPromptIssueCode = (status) => status;

/**
 * Builds a versioned, deterministic external review pack (contract §8)
 * for one candidate. Pure — takes the already-read, already-parsed
 * candidate/blueprint content directly (no repository handle, no clock
 * read); the CLI script performs the reads. Deterministic: identical
 * input always produces byte-identical pack text and an identical
 * `promptHash` (no wall-clock field anywhere in the pack).
 *
 * Every field this function reads off `entry.question` is already
 * bounded by construction (`MAX_STIMULUS_LENGTH`/
 * `MAX_OPTIONS_PER_QUESTION`/`MAX_VISUALS_PER_QUESTION`), since every
 * candidate reaching this stage has already passed structural validation
 * against `questionSchema` — this function only defensively asserts the
 * resulting pack still fits `MAX_REVIEW_PACK_BYTES` overall, rather than
 * re-implementing per-field truncation.
 */
export function buildReviewPromptPack(entry: ReviewPromptCandidateEntry): ReviewPromptBuildResult {
  const rubric = buildRubric(entry);

  const pack: ReviewPromptPack = {
    candidateId: entry.candidateId,
    candidateRevision: entry.candidateRevision,
    candidateContentHash: entry.candidateContentHash,
    blueprint: entry.blueprint,
    blueprintHash: entry.blueprintHash,
    semanticClassification: entry.semanticClassification,
    rubric,
    candidateContent: {
      type: entry.question.type,
      yearLevel: entry.question.yearLevel,
      examStyle: entry.question.examStyle,
      prompt: entry.question.prompt,
      ...(entry.question.stimulus !== undefined ? { stimulus: entry.question.stimulus } : {}),
      options: entry.question.options,
      visuals: entry.question.visuals,
      metadata: entry.question.metadata,
      // `answerKey` and `explanation` are deliberately omitted from the
      // top-level candidate content for `semantic_objective` (see
      // `buildRubric`); for the other two classifications they are
      // legitimately useful and are folded into `rubric` above rather
      // than duplicated here, so there is exactly one place in the pack
      // that ever carries them.
    },
    reviewPromptVersion: FACTORY_VERSIONS.REVIEW_PROMPT_VERSION,
    instructions: INSTRUCTIONS,
    responseSchemaDescription: RESPONSE_SCHEMA_DESCRIPTION,
    maxResponseBytes: FACTORY_LIMITS.MAX_REVIEW_RESPONSE_BYTES,
  };

  const packBytes = Buffer.byteLength(stableStringify(pack), "utf8");
  if (packBytes > FACTORY_LIMITS.MAX_REVIEW_PACK_BYTES) {
    return {
      status: "review_prompt_pack_limit_exceeded",
      message: `Review prompt pack for candidate '${entry.candidateId}' is ${packBytes} bytes, exceeding the ${FACTORY_LIMITS.MAX_REVIEW_PACK_BYTES}-byte bound.`,
    };
  }

  return { status: "built", pack, promptHash: hashJson(pack) };
}
