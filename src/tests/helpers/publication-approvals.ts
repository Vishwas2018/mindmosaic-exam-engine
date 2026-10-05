import {
  approvalFingerprint,
  canonicalQuestionHash,
  type HumanPublicationApproval,
} from "@/features/content-governance/publication-integrity";
import type { Question } from "@/schemas/question.schema";

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
