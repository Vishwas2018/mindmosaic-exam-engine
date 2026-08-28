import type { CurriculumCatalogueItem } from "@/features/curriculum/contracts";
import type { ParentCurriculumContent } from "../parent-content";

export type LearningArea = "Mathematics" | "English";
export type YearLevelChoice = "3" | "5";

export interface ExplorerNodeItem {
  readonly catalogueItem: CurriculumCatalogueItem;
  readonly parentContent: ParentCurriculumContent;
  readonly strand: string;
  readonly level: YearLevelChoice;
  readonly learningArea: LearningArea;
}

export function getNodeStrand(code: string): string {
  if (/^VC2M[35]N/.test(code)) return "Number";
  if (/^VC2M[35]A/.test(code)) return "Algebra";
  if (/^VC2M[35]M/.test(code)) return "Measurement";
  if (/^VC2M[35]SP/.test(code)) return "Space";
  if (/^VC2M[35]ST/.test(code)) return "Statistics";
  if (/^VC2M[35]P/.test(code)) return "Probability";

  if (/^VC2E[35]LA/.test(code)) return "Language";
  if (/^VC2E[35]LE/.test(code)) return "Literature";
  if (/^VC2E[35]LY/.test(code)) return "Literacy";

  return "General";
}

export const MATH_STRANDS = [
  "Number",
  "Algebra",
  "Measurement",
  "Space",
  "Statistics",
  "Probability",
] as const;

export const ENGLISH_STRANDS = [
  "Language",
  "Literature",
  "Literacy",
] as const;
