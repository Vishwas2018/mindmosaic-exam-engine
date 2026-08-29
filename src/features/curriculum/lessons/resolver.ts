import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { getExamBank } from "@/server/exam-bank";
import { getMappedQuestionIdsForNode, LEVEL_3_NUMBER_ALIGNMENTS } from "./alignments";

export { getMappedQuestionIdsForNode, LEVEL_3_NUMBER_ALIGNMENTS };

/**
 * Resolves full Question models from the published bank for a given curriculum code.
 * Fails closed: returns only published, gate-passed questions.
 */
export function resolveQuestionsForCurriculumNode(
  curriculumCode: string,
  limit?: number,
): readonly AuthoringQuestion[] {
  const mappedIds = getMappedQuestionIdsForNode(curriculumCode);
  if (mappedIds.length === 0) return [];

  const bank = getExamBank("published");
  const bankMap = new Map<string, AuthoringQuestion>();
  for (const q of bank) bankMap.set(q.id, q);

  const matched: AuthoringQuestion[] = [];
  for (const id of mappedIds) {
    const question = bankMap.get(id);
    if (question) {
      matched.push(question);
      if (limit !== undefined && matched.length >= limit) {
        break;
      }
    }
  }

  return Object.freeze(matched);
}

export const resolveQuestionsForNode = resolveQuestionsForCurriculumNode;
