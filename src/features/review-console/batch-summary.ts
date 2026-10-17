import type { BatchSummary, ReviewItem } from "./types";

/**
 * Computes pre-review batch analytics for reviewer orientation:
 * - Counts by skill
 * - Counts by difficulty
 * - Answer-position distribution (a, b, c, d)
 * - Identifies which items carry automated/solver evidence vs require human semantic judgement
 */
export function computeBatchSummary(
  items: readonly ReviewItem[],
  batchId = "current-batch",
  batchTitle = "Review Batch",
): BatchSummary {
  const skillCounts: Record<string, number> = {};
  const difficultyCounts: Record<string, number> = {};
  const answerPositionCounts: Record<string, number> = {};
  const solverItemIds: string[] = [];
  const semanticItemIds: string[] = [];

  for (const item of items) {
    const q = item.question;

    // Skill count
    const skillName = q.metadata.skill || q.metadata.strand || "Unspecified";
    skillCounts[skillName] = (skillCounts[skillName] ?? 0) + 1;

    // Difficulty count
    const difficulty = (q.metadata.difficulty ?? "unspecified").toLowerCase();
    difficultyCounts[difficulty] = (difficultyCounts[difficulty] ?? 0) + 1;

    // Answer position distribution (for multiple choice single_option keys)
    if (q.answerKey.kind === "single_option") {
      const pos = q.answerKey.optionId.toLowerCase();
      answerPositionCounts[pos] = (answerPositionCounts[pos] ?? 0) + 1;
    } else if (q.answerKey.kind === "multiple_options") {
      for (const optId of q.answerKey.optionIds) {
        const pos = optId.toLowerCase();
        answerPositionCounts[pos] = (answerPositionCounts[pos] ?? 0) + 1;
      }
    } else {
      const kind = q.answerKey.kind;
      answerPositionCounts[kind] = (answerPositionCounts[kind] ?? 0) + 1;
    }

    // Solver vs Semantic Classification:
    // Items with machine verifiable flag, code solvers, or mathematical calculations
    // are classified as solver-backed.
    // Reading comprehension passages, inferences, and language nuances require semantic judgement.
    const isSolverBacked =
      item.isMachineVerifiable ||
      q.type === "number_entry" ||
      q.metadata.subject === "numeracy" ||
      q.metadata.subject === "amc_mathematics";

    if (isSolverBacked) {
      solverItemIds.push(item.id);
    } else {
      semanticItemIds.push(item.id);
    }
  }

  return {
    batchId,
    batchTitle,
    totalItems: items.length,
    skillCounts,
    difficultyCounts,
    answerPositionCounts,
    solverBackedCount: solverItemIds.length,
    semanticReviewCount: semanticItemIds.length,
    solverItemIds,
    semanticItemIds,
  };
}
