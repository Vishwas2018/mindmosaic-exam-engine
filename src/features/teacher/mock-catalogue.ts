import type { SubjectFilter } from "@/features/exam-engine/selection";

/**
 * Typed mock catalogue of skills and blueprints an assignment can target.
 * Deliberately static, in-memory data — the wizard's skill/blueprint
 * targeting step needs a shaped source to build against, but the real
 * question-factory content pipeline (content/question-factory/**) is out
 * of this lane's scope. Swapping this for a real catalogue service later
 * only touches this file.
 */

export type AssignmentDifficulty = "foundation" | "standard" | "challenge";

export const ASSIGNMENT_DIFFICULTY_OPTIONS: readonly AssignmentDifficulty[] = [
  "foundation",
  "standard",
  "challenge",
];

export const DIFFICULTY_LABELS: Record<AssignmentDifficulty, string> = {
  foundation: "Foundation",
  standard: "Standard",
  challenge: "Challenge",
};

export interface AssignmentSkill {
  id: string;
  label: string;
  subject: SubjectFilter;
}

export interface AssignmentBlueprint {
  id: string;
  label: string;
  subject: SubjectFilter;
  description: string;
}

const SKILLS: readonly AssignmentSkill[] = [
  { id: "numeracy-fractions", label: "Fractions & equivalence", subject: "numeracy" },
  { id: "numeracy-place-value", label: "Place value & rounding", subject: "numeracy" },
  { id: "numeracy-graphs", label: "Bar charts & line graphs", subject: "numeracy" },
  { id: "reading-inference", label: "Inference & main idea", subject: "reading" },
  { id: "reading-vocabulary", label: "Vocabulary in context", subject: "reading" },
  { id: "language-punctuation", label: "Commas & apostrophes", subject: "language" },
  { id: "language-grammar", label: "Pronouns & verb forms", subject: "language" },
];

const BLUEPRINTS: readonly AssignmentBlueprint[] = [
  {
    id: "naplan-numeracy-mock",
    label: "NAPLAN-style numeracy mock",
    subject: "numeracy",
    description: "Full-length mock covering the standard NAPLAN numeracy spread.",
  },
  {
    id: "naplan-reading-mock",
    label: "NAPLAN-style reading mock",
    subject: "reading",
    description: "Full-length mock covering comprehension and inference passages.",
  },
  {
    id: "icas-language-mock",
    label: "ICAS-style language conventions mock",
    subject: "language",
    description: "ICAS-format spelling, grammar and punctuation mock.",
  },
  {
    id: "mixed-diagnostic",
    label: "Mixed-subject diagnostic",
    subject: "mixed",
    description: "Short diagnostic sampling all three subjects evenly.",
  },
];

/** Skills available for skill-based assignment targeting, optionally scoped to a subject. */
export async function listAssignmentSkills(
  subject?: SubjectFilter,
): Promise<AssignmentSkill[]> {
  if (!subject || subject === "mixed") return [...SKILLS];
  return SKILLS.filter((skill) => skill.subject === subject);
}

/** Blueprints available for blueprint-based mock exam targeting. */
export async function listAssignmentBlueprints(
  subject?: SubjectFilter,
): Promise<AssignmentBlueprint[]> {
  if (!subject || subject === "mixed") return [...BLUEPRINTS];
  return BLUEPRINTS.filter(
    (blueprint) => blueprint.subject === subject || blueprint.subject === "mixed",
  );
}
