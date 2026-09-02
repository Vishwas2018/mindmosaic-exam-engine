import type { CanonicalQuestionRevision, IndependentReview } from "./contracts";

export interface GenerationAssignment {
  readonly batchId: string;
  readonly blueprintCellId: string;
  readonly count: number;
  readonly promptContractVersion: string;
}

export interface GeneratorAdapter {
  readonly adapterId: string;
  readonly origin: "ai_codex" | "ai_claude";
  generate(assignment: GenerationAssignment): Promise<readonly unknown[]>;
}

export interface ReviewerAdapter {
  readonly adapterId: string;
  readonly reviewerKind: "ai_codex" | "ai_claude";
  reviewUntrusted(question: CanonicalQuestionRevision): Promise<IndependentReview>;
}

export interface ManualAgentExchange {
  exportGenerationPrompt(assignment: GenerationAssignment): Promise<string>;
  importGenerationResult(raw: string): Promise<readonly unknown[]>;
  exportReviewPrompt(question: CanonicalQuestionRevision): Promise<string>;
  importReviewResult(raw: string): Promise<IndependentReview>;
}
