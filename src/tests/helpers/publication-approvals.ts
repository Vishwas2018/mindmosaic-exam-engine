import {
  approvalFingerprint,
  canonicalQuestionHash,
  type HumanPublicationApproval,
} from "@/features/content-governance/publication-integrity";
import type { Question } from "@/schemas/question.schema";
import { parseCandidateQuestion } from "@/features/question-factory/validation";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";

/**
 * Test-only publication approval fixture generator.
 *
 * This file is strictly test-owned. An ESLint restriction and an automated repository
 * import guard test (`src/tests/unit/production-import-guards.test.ts`) guarantee
 * that production code can never import this helper.
 */
export function createTestHumanApproval(options: {
  readonly question: Question;
  readonly revision?: number;
  readonly approvedBy?: string;
  readonly approvedAt?: string;
  readonly sourceManifestHash?: string | null;
  readonly correctness?: true;
  readonly originality?: true;
  readonly ageAppropriateness?: true;
}): HumanPublicationApproval {
  const revision = options.revision ?? 1;
  const approvedBy = options.approvedBy ?? "Verified Human Reviewer";
  const approvedAt = options.approvedAt ?? new Date().toISOString();
  const contentHash = canonicalQuestionHash(options.question);
  const sourceManifestHash = options.sourceManifestHash ?? null;

  const facts = {
    kind: "human_publication_approval" as const,
    schemaVersion: 1 as const,
    questionId: options.question.id,
    revision,
    approvedBy,
    approvedAt,
    contentHash,
    sourceManifestHash,
    checks: {
      correctness: true as const,
      originality: true as const,
      ageAppropriateness: true as const,
    },
    question: options.question,
  };

  return {
    ...facts,
    fingerprint: approvalFingerprint(facts),
  };
}

/** Test-only reviewed row for a staged candidate; production cannot import this module. */
export function createTestReviewedCandidateApproval(rawCandidate: unknown, revision: number) {
  const parsed = parseCandidateQuestion(rawCandidate);
  if (!parsed.ok) throw new Error("Invalid test candidate question.");
  const built = buildPublishedQuestion(parsed.data);
  if (!built.ok) throw new Error("Invalid test published question.");
  return { reviewerFullName: "Reviewer Human", row: {
    questionId: built.question.id,
    contentHash: canonicalQuestionHash(built.question),
    revision,
    sourceManifestHash: null,
    correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve",
  } };
}
