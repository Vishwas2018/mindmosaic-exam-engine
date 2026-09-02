import { canonicalContentHash, type CanonicalQuestionRevision } from "./contracts";
import { blindSolveResultSchema, comparisonReviewResultSchema, type BlindSolveResult, type ComparisonReviewResult } from "./quality-contracts";
import { toLearnerQuestionDto } from "./runtime";

export interface TwoPassReviewerAdapter {
  readonly adapterId: string;
  readonly reviewerKind: "ai_codex" | "ai_claude";
  blindSolve(input: BlindSolvePrompt): Promise<unknown>;
  compare(input: ComparisonPrompt): Promise<unknown>;
}

export interface BlindSolvePrompt {
  readonly contractVersion: "quality-review-v1";
  readonly candidateContentHash: string;
  readonly learnerView: Omit<ReturnType<typeof toLearnerQuestionDto>, "learnerExplanation">;
  readonly instructions: readonly string[];
}

export interface ComparisonPrompt {
  readonly contractVersion: "quality-review-v1";
  readonly candidateContentHash: string;
  readonly blindSolve: BlindSolveResult;
  readonly declaredAnswer: unknown;
  readonly learnerExplanation: string;
  readonly instructions: readonly string[];
}

export function buildBlindSolvePrompt(revision: CanonicalQuestionRevision): BlindSolvePrompt {
  const learnerView = toLearnerQuestionDto(revision);
  const { learnerExplanation: withheldExplanation, ...blindLearnerView } = learnerView;
  void withheldExplanation;
  // Explanation is withheld in pass 1 even though it is learner-visible after answering.
  return {
    contractVersion: "quality-review-v1",
    candidateContentHash: canonicalContentHash(revision),
    learnerView: blindLearnerView,
    instructions: [
      "Solve using only the learner-visible prompt, instructions, stimulus, options and visuals/assets.",
      "State a concise expected answer; do not provide private chain-of-thought.",
      "Check unique defensibility, missing assumptions, alternative interpretations, visual support, assessment fit and Australian English.",
      "For free text ask: What could a capable child reasonably write that would also be correct?",
    ],
  };
}

export function buildComparisonPrompt(revision: CanonicalQuestionRevision, blind: BlindSolveResult): ComparisonPrompt {
  const hash = canonicalContentHash(revision);
  if (blind.candidateContentHash !== hash) throw new Error("Blind-solve evidence is stale for this content revision.");
  return {
    contractVersion: "quality-review-v1", candidateContentHash: hash, blindSolve: blind,
    declaredAnswer: revision.question.answerKey, learnerExplanation: revision.learnerExplanation,
    instructions: [
      "Compare the independently derived answer with the declared key.",
      "Check that the explanation teaches a correct, age-appropriate method using only visible information and Australian English.",
      "Do not provide or persist private chain-of-thought; return concise evidence only.",
    ],
  };
}

export async function runTwoPassReview(revision: CanonicalQuestionRevision, adapter: TwoPassReviewerAdapter): Promise<{ blind: BlindSolveResult; comparison: ComparisonReviewResult }> {
  if ((revision.origin === "ai_codex" && adapter.reviewerKind === "ai_codex") || (revision.origin === "ai_claude" && adapter.reviewerKind === "ai_claude")) {
    throw new Error("The generating agent family cannot independently review its own content.");
  }
  const blind = blindSolveResultSchema.parse(await adapter.blindSolve(buildBlindSolvePrompt(revision)));
  if (blind.reviewerKind !== adapter.reviewerKind) throw new Error("Reviewer identity does not match the adapter.");
  const comparison = comparisonReviewResultSchema.parse(await adapter.compare(buildComparisonPrompt(revision, blind)));
  return { blind, comparison };
}
