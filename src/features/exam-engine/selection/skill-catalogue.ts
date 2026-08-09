import type { Question } from "@/schemas/question.schema";

import type { SubjectFilter } from "./selection-config";

/** Question-bank subject key -> the selection filter it maps to for browsing. */
const BANK_SUBJECT_TO_FILTER: Partial<Record<string, SubjectFilter>> = {
  numeracy: "numeracy",
  reading: "reading",
  language_conventions: "language",
  science: "science",
  digital_technologies: "digital_technologies",
  spelling: "spelling",
};

export interface SkillSummary {
  subject: SubjectFilter;
  skill: string;
  questionCount: number;
}

/**
 * Skill/subject browser data for the Learning Hub (screen 12). Pure
 * aggregation over question metadata only -- never ships answer keys or
 * question content, just names and counts, so it is safe to compute from
 * the full authoring bank on the server and render into a signed-in page.
 * Writing questions are excluded: there is no browsable "writing" subject
 * filter (see selection/select-questions.ts's SUBJECTS_BY_FILTER).
 */
export function buildSkillCatalogue(bank: readonly Question[]): SkillSummary[] {
  const bySubject = new Map<SubjectFilter, Map<string, number>>();

  for (const question of bank) {
    const subject = BANK_SUBJECT_TO_FILTER[question.metadata.subject];
    if (!subject) continue;
    const skill = question.metadata.skill ?? question.metadata.topic;
    const skillCounts = bySubject.get(subject) ?? new Map<string, number>();
    skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
    bySubject.set(subject, skillCounts);
  }

  const summaries: SkillSummary[] = [];
  for (const [subject, skillCounts] of bySubject) {
    for (const [skill, questionCount] of skillCounts) {
      summaries.push({ subject, skill, questionCount });
    }
  }
  return summaries.sort((a, b) => a.skill.localeCompare(b.skill));
}
