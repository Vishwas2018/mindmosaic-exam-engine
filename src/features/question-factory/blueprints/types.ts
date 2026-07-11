import type { YearLevel } from "@/features/exam-engine/types";

export const BLUEPRINT_YEAR_LEVELS = ["year-3", "year-5"] as const;
export type BlueprintYearLevel = (typeof BLUEPRINT_YEAR_LEVELS)[number];

const YEAR_LEVEL_TO_NUMERIC: Record<BlueprintYearLevel, YearLevel> = {
  "year-3": 3,
  "year-5": 5,
};

const NUMERIC_TO_BLUEPRINT_YEAR_LEVEL: Record<YearLevel, BlueprintYearLevel> = {
  3: "year-3",
  5: "year-5",
};

export function toNumericYearLevel(yearLevel: BlueprintYearLevel): YearLevel {
  return YEAR_LEVEL_TO_NUMERIC[yearLevel];
}

export function fromNumericYearLevel(yearLevel: YearLevel): BlueprintYearLevel {
  return NUMERIC_TO_BLUEPRINT_YEAR_LEVEL[yearLevel];
}
