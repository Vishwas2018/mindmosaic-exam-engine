import { SINGAPORE_FOUNDATION_YEAR_LEVELS } from "@/features/taxonomy/year-registry";
import type { TaxonomyEntry } from "./types";

// Internal foundation skills, not claims of official curriculum alignment.
export const SINGAPORE_FOUNDATION_SKILLS: readonly TaxonomyEntry[] = [
  { id: "sg.math.part-whole", displayName: "Model a part and a whole", strand: "Part-whole models" },
  { id: "sg.math.comparison", displayName: "Model an additive comparison", strand: "Comparison models" },
  { id: "sg.math.equal-units", displayName: "Model equal units", strand: "Equal-unit models" },
].map((skill): TaxonomyEntry => ({
  ...skill,
  aliases: [],
  yearLevels: SINGAPORE_FOUNDATION_YEAR_LEVELS,
  examStyles: ["singapore_style"],
  subject: "singapore_mathematics",
  prerequisites: [],
  recommendedQuestionTypes: ["number_entry", "multiple_choice"],
  recommendedVisualTypes: ["bar_model"],
  supportedDifficulties: ["easy", "medium"],
  curriculumNotes: ["Internal model-method foundation; future content requires age-fit review and the governed human publication gate."],
  generationConstraints: [
    "Use original contexts and a solvable declarative bar model with exactly one target.",
    "Keep the target answer out of visual metadata, labels, alt text and filenames.",
    "Independently verify the answer with solveBarModel; never substitute the declared key for solving.",
  ],
}));
