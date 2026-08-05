import type { YearLevel } from "@/features/exam-engine/types";
import {
  BLUEPRINT_YEAR_LEVEL_SLUGS,
  slugToYearLevel,
  yearLevelToSlug,
  type BlueprintYearLevelSlug,
} from "@/features/taxonomy/year-registry";

/**
 * Blueprint year-level slugs, derived from the year registry rather than
 * listed here (expansion-plan T0a).
 *
 * This module used to hold `["year-3", "year-5"]` plus two hand-written
 * lookup maps. That was a second inventory of which years exist: the
 * factory could plan blueprints for a year the rest of the app rejected,
 * or — the direction that actually bites — the app could widen and the
 * factory silently stay narrow. What remains here is conversion, not
 * inventory, so adding a year is one edit in the registry.
 */
export const BLUEPRINT_YEAR_LEVELS = BLUEPRINT_YEAR_LEVEL_SLUGS;
export type BlueprintYearLevel = BlueprintYearLevelSlug;

export function toNumericYearLevel(yearLevel: BlueprintYearLevel): YearLevel {
  return slugToYearLevel(yearLevel);
}

export function fromNumericYearLevel(yearLevel: YearLevel): BlueprintYearLevel {
  return yearLevelToSlug(yearLevel);
}
