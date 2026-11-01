import type { Question } from "@/schemas/question.schema";

export type ReviewDecision = "approve" | "reject" | "revise" | "";

export interface QuestionChecks {
  correctness: boolean;
  originality: boolean;
  ageAppropriateness: boolean;
}

export interface AttachedReviewEvidence {
  reviewerModel?: string;
  reviewerVersion?: string;
  result?: string;
  confidence?: number;
  findings?: string[];
  recommendedCorrections?: string[];
  evidenceReferences?: string[];
  ambiguityStatus?: string;
  reviewedAt?: string;
}

export interface ReviewItem {
  id: string; // questionId
  index: number;
  contentHash: string;
  revision: number | string;
  sourceManifestHash: string | null;
  question: Question;
  decision: ReviewDecision;
  notes: string;
  checks: QuestionChecks;
  isMachineVerifiable: boolean;
  verificationNotes: string[];
  externalReview?: AttachedReviewEvidence;
}

export interface BatchSummary {
  batchId: string;
  batchTitle: string;
  totalItems: number;
  skillCounts: Record<string, number>;
  difficultyCounts: Record<string, number>;
  answerPositionCounts: Record<string, number>;
  solverBackedCount: number;
  semanticReviewCount: number;
  solverItemIds: string[];
  semanticItemIds: string[];
}

export interface ReviewProgress {
  total: number;
  approved: number;
  rejected: number;
  revised: number;
  undecided: number;
  currentIndex: number;
  timeOnCurrentItemSeconds: number;
  totalElapsedSeconds: number;
  averageTimePerItemSeconds: number;
}
