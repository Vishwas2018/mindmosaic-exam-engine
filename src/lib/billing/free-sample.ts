import type { Question } from "@/schemas/question.schema";

import { FREE_PLAN } from "./prices";

/**
 * The Free plan: a fixed taste of every programme, not open-ended practice.
 *
 * A "programme" here is what the catalogue sells as one card — an exam style
 * at one year level in one subject ("NAPLAN Year 5 Numeracy"). The free
 * sample is the first N questions of each such cell in stable id order, so
 * it is the same N for every visitor, every time: a guest can retry the
 * sample but never reach question N+1.
 *
 * Pure and dependency-light on purpose. It runs on the server for the guest
 * bank endpoint and for signed-in students without paid access, and in the
 * server-side eligibility summary the setup screen reads.
 */
export const FREE_SAMPLE_PER_PROGRAMME = FREE_PLAN.sampleQuestionsPerProgramme;

type SampleKeyed = Pick<Question, "id" | "examStyle" | "yearLevel"> & {
  metadata: Pick<Question["metadata"], "subject">;
};

export function freeSampleKey(question: SampleKeyed): string {
  return `${question.examStyle}:${question.yearLevel}:${question.metadata.subject}`;
}

/** The free sample of a bank: up to N questions per programme, input order otherwise preserved. */
export function selectFreeSample<T extends SampleKeyed>(
  bank: readonly T[],
  perProgramme: number = FREE_SAMPLE_PER_PROGRAMME,
): T[] {
  const byProgramme = new Map<string, T[]>();
  for (const question of bank) {
    const key = freeSampleKey(question);
    const list = byProgramme.get(key);
    if (list) list.push(question);
    else byProgramme.set(key, [question]);
  }

  const keep = new Set<string>();
  for (const list of byProgramme.values()) {
    [...list]
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
      .slice(0, perProgramme)
      .forEach((question) => keep.add(question.id));
  }
  return bank.filter((question) => keep.has(question.id));
}
