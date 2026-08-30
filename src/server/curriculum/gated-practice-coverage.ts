import "server-only";

import type { CurriculumCoverage } from "@/features/curriculum";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { getExamBank } from "@/server/exam-bank";

export interface GatedPracticeCoverageResolverOptions {
  /**
   * Optional custom published bank or Set of published question IDs (useful for isolated unit testing).
   * Defaults to getExamBank("published").
   */
  publishedBank?: readonly AuthoringQuestion[] | Set<string>;
}

export type GatedPracticeCoverageResolverFn = (
  nodeId: string,
  alignments: readonly unknown[],
) => CurriculumCoverage;

export interface ParsedQuestionIdResult {
  questionId: string | null;
  status: "valid" | "no_annotation" | "malformed" | "ambiguous";
  error?: string;
}

const QUESTION_ID_TAG_REGEX = /\[Question ID:\s*([^\]]*)\s*\]/gi;
const MALFORMED_CHECK_REGEX = /\[Question ID:/i;
const VALID_QUESTION_ID_FORMAT = /^[a-zA-Z0-9_-]+$/;

/**
 * Centralised, robust parser for question-ID annotations in curriculum taxonomy alignment rationale text.
 *
 * Enforces strict fail-closed parsing:
 * - Exactly one well-formed `[Question ID: <id>]` is accepted.
 * - Unclosed, malformed, empty, or special-character tags fail closed with `status: "malformed"`.
 * - Multiple conflicting question IDs in a single rationale fail closed with `status: "ambiguous"`.
 * - Non-annotated strings cleanly return `status: "no_annotation"`.
 */
export function parseQuestionIdAnnotation(
  rationale: string | undefined | null,
): ParsedQuestionIdResult {
  if (!rationale || typeof rationale !== "string") {
    return { questionId: null, status: "no_annotation" };
  }

  const matches = [...rationale.matchAll(QUESTION_ID_TAG_REGEX)];

  if (matches.length === 0) {
    if (MALFORMED_CHECK_REGEX.test(rationale)) {
      return {
        questionId: null,
        status: "malformed",
        error: "Unclosed or malformed [Question ID: ...] tag in rationale",
      };
    }
    return { questionId: null, status: "no_annotation" };
  }

  if (matches.length > 1) {
    const ids = new Set(
      matches
        .map((m) => m[1]?.trim())
        .filter((id): id is string => Boolean(id && VALID_QUESTION_ID_FORMAT.test(id))),
    );
    if (ids.size > 1) {
      return {
        questionId: null,
        status: "ambiguous",
        error: `Ambiguous multiple distinct question IDs in rationale: ${[...ids].join(", ")}`,
      };
    }
  }

  const rawId = matches[0]![1]?.trim();
  if (!rawId || !VALID_QUESTION_ID_FORMAT.test(rawId)) {
    return {
      questionId: null,
      status: "malformed",
      error: `Invalid question ID format in annotation: '${rawId}'`,
    };
  }

  return { questionId: rawId, status: "valid" };
}

/**
 * Validates whether a taxonomy alignment record is in an approved review state and represents
 * a mapped relationship (not 'unmapped').
 */
export function isAlignmentApprovedAndMapped(alignment: unknown): boolean {
  if (!alignment || typeof alignment !== "object") {
    return false;
  }

  const rec = alignment as Record<string, unknown>;

  // Must not be an unmapped relation
  if (rec.relation === "unmapped") {
    return false;
  }

  // Check review status across supported contract shapes (CurriculumTaxonomyAlignment or raw DB row)
  let status: string | undefined;

  if (typeof rec.review_status === "string") {
    status = rec.review_status;
  } else if (rec.review && typeof rec.review === "object") {
    const reviewObj = rec.review as Record<string, unknown>;
    if (typeof reviewObj.status === "string") {
      status = reviewObj.status;
    }
  } else if (typeof rec.reviewStatus === "string") {
    status = rec.reviewStatus;
  } else if (typeof rec.reviewState === "string") {
    status = rec.reviewState;
  } else if (typeof rec.review === "string") {
    status = rec.review;
  }

  return status === "approved";
}

export interface ExtractQuestionIdsOptions {
  /**
   * When true (default), requires the alignment to be approved and mapped (not unmapped).
   */
  onlyApproved?: boolean;
  /**
   * Optional callback when a malformed or ambiguous question annotation is encountered.
   */
  onMalformed?: (alignment: unknown, error: string) => void;
}

/**
 * Extracts and deduplicates question IDs from taxonomy alignments according to governance rules.
 *
 * Rules:
 * 1. Requires the alignment to be approved and mapped (unless onlyApproved is false).
 * 2. Parses question IDs via the centralised `parseQuestionIdAnnotation` parser.
 * 3. Fails closed on malformed or ambiguous annotations (never silently treats them as valid).
 * 4. Deduplicates question IDs across multiple alignment records to prevent inflation.
 */
export function extractQuestionIdsFromAlignments(
  alignments: readonly unknown[],
  options: ExtractQuestionIdsOptions = {},
): string[] {
  const onlyApproved = options.onlyApproved !== false;
  const ids = new Set<string>();

  for (const alignment of alignments) {
    if (!alignment || typeof alignment !== "object") continue;

    if (onlyApproved && !isAlignmentApprovedAndMapped(alignment)) {
      continue;
    }

    const rec = alignment as Record<string, unknown>;

    // Direct questionId property (if provided on test/custom object)
    if (typeof rec.questionId === "string" && VALID_QUESTION_ID_FORMAT.test(rec.questionId.trim())) {
      ids.add(rec.questionId.trim());
      continue;
    }
    if (typeof rec.question_id === "string" && VALID_QUESTION_ID_FORMAT.test(rec.question_id.trim())) {
      ids.add(rec.question_id.trim());
      continue;
    }

    // Free-text rationale annotation parsing
    if (typeof rec.rationale === "string") {
      const parsed = parseQuestionIdAnnotation(rec.rationale);
      if (parsed.status === "valid" && parsed.questionId) {
        ids.add(parsed.questionId);
      } else if (parsed.status === "malformed" || parsed.status === "ambiguous") {
        options.onMalformed?.(alignment, parsed.error ?? "Malformed annotation");
      }
    }
  }

  return Array.from(ids);
}

/**
 * Creates a server-only CoverageResolver that reconciles taxonomy alignments
 * with the gated, published question bank.
 *
 * - Excludes ungated generated practice seeds.
 * - Excludes draft, in-review, rejected, or unmapped taxonomy alignments.
 * - Fails closed on malformed or ambiguous alignment annotations.
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

    const candidateIds = extractQuestionIdsFromAlignments(alignments, { onlyApproved: true });
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
