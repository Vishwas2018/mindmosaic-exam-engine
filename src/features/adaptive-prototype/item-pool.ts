import type { Question } from "@/schemas/question.schema";
import { filterEligibleQuestions, seededShuffle } from "@/features/exam-engine/selection";

import type { ContentScope, DifficultyBand } from "./types";

export interface StageItemPool {
  readonly requested: number;
  readonly served: readonly Question[];
  /** True when the band's eligible pool couldn't fill the request. */
  readonly degraded: boolean;
}

/**
 * Picks up to `count` items for one stage's band, from the REAL compiled
 * bank, reusing `filterEligibleQuestions()` — the same eligibility filter
 * `scripts/capacity-report.mts` counts against — narrowed further to the
 * exact band and to whatever `excludeIds` has already served this session.
 *
 * Degrades gracefully rather than padding or substituting another band: if
 * the eligible pool has fewer than `count` items, every one of them is
 * served and `degraded` is true. This is a behavior demo, not the
 * 50-sitting no-repeat guarantee (spec §13.2) — a thin cell here is a
 * signal for the content track, not a bug to paper over.
 */
export function selectStageItems(
  bank: readonly Question[],
  scope: ContentScope,
  band: DifficultyBand,
  count: number,
  excludeIds: ReadonlySet<string>,
  seed: string,
): StageItemPool {
  const eligible = filterEligibleQuestions(bank, scope).filter(
    (question) => question.metadata.difficulty === band && !excludeIds.has(question.id),
  );
  const served = seededShuffle(eligible, seed).slice(0, count);
  return { requested: count, served, degraded: served.length < count };
}
