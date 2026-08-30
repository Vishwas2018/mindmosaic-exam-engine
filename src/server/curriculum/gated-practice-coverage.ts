import "server-only";

import type { CurriculumCoverage } from "@/features/curriculum";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { getExamBank } from "@/server/exam-bank";

const QUESTION_ID_REGEX = /\[Question ID:\s*([a-zA-Z0-9_-]+)\]/i;

export interface GatedPracticeCoverageResolverOptions {
  /**
   * Optional custom published bank or Set of published question IDs (useful for isolated unit testing).
   * Defaults to getExamBank("published").
   */
  publishedBank?: readonly AuthoringQuestion[] | Set<string>;
}

/**
 * Extracts distinct question IDs referenced within an array of taxonomy alignments.
 * Identifies `[Question ID: <id>]` in alignment rationale annotations or direct `questionId`/`question_id` properties.
 */
export function extractQuestionIdsFromAlignments(alignments: readonly unknown[]): string[] {
  const ids = new Set<string>();

  for (const item of alignments) {
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;

    // 1. Direct question ID properties (if provided in fixtures or custom alignments)
    if (typeof record.questionId === "string" && record.questionId.trim()) {
      ids.add(record.questionId.trim());
    } else if (typeof record.question_id === "string" && record.question_id.trim()) {
      ids.add(record.question_id.trim());
    }

    // 2. Canonical taxonomy alignment rationale: "Aligned to Skill ... [Question ID: ...]"
    if (typeof record.rationale === "string") {
      const match = record.rationale.match(QUESTION_ID_REGEX);
      if (match && match[1]) {
        ids.add(match[1].trim());
      }
    }
  }

  return Array.from(ids);
}

export type GatedPracticeCoverageResolverFn = (
  nodeId: string,
  alignments: readonly unknown[],
) => CurriculumCoverage;

/**
 * Creates a server-only CoverageResolver that reconciles taxonomy alignments
 * with the gated, published question bank.
 *
 * - Excludes ungated generated practice seeds.
 * - Excludes unmapped or unreviewed questions.
 * - Deduplicates question references so duplicate alignment records cannot inflate coverage.
 * - Automatically reflects newly factory-published questions when the bank is assembled.
 */
export function createGatedPracticeCoverageResolver(
  options: GatedPracticeCoverageResolverOptions = {},
): GatedPracticeCoverageResolverFn {
  return (_nodeId: string, alignments: readonly unknown[]): CurriculumCoverage => {
    let publishedIdSet: Set<string>;

    if (options.publishedBank instanceof Set) {
      publishedIdSet = options.publishedBank;
    } else if (options.publishedBank) {
      publishedIdSet = new Set(options.publishedBank.map((q) => q.id));
    } else {
      const publishedBank = getExamBank("published");
      publishedIdSet = new Set(publishedBank.map((q) => q.id));
    }

    const candidateIds = extractQuestionIdsFromAlignments(alignments);
    let servableCount = 0;

    for (const id of candidateIds) {
      if (publishedIdSet.has(id)) {
        servableCount++;
      }
    }

    const status: CurriculumCoverage["status"] =
      servableCount >= 5 ? "covered" : servableCount >= 1 ? "partial" : "none";

    return {
      status,
      supportingContentCount: servableCount,
      policyId: "gated-published-bank-v1",
      computedAt: new Date().toISOString(),
    };
  };
}

/**
 * Canonical server-only gated practice coverage resolver instance.
 * Intersects taxonomy alignments with the governed, published question bank (`publishedExamBank`).
 */
export const gatedPracticeCoverageResolver: GatedPracticeCoverageResolverFn =
  createGatedPracticeCoverageResolver();
