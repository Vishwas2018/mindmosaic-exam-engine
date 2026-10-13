import { z } from "zod";

import {
  questionSchema,
  type Question,
} from "@/schemas/question.schema";

/* Phase 1 of bar_model is render-only. Until Phase 2 wires solveBarModel and
   structural validation into the bank and factory checks, no bank item may
   carry one (mirrors the `bar_model: 0` pin in scripts/validate-question-bank.mts). */
function findBarModelPaths(
  value: unknown,
  path: (string | number)[] = [],
  found: (string | number)[][] = [],
): (string | number)[][] {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => findBarModelPaths(entry, [...path, index], found));
  } else if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (record.type === "bar_model") found.push(path);
    for (const [key, entry] of Object.entries(record)) {
      findBarModelPaths(entry, [...path, key], found);
    }
  }
  return found;
}

export const questionBankSchema = z
  .array(questionSchema)
  .min(1, "A question bank must contain at least one question.")
  .superRefine((questions, context) => {
    const questionIds = new Set<string>();

    questions.forEach((question, index) => {
      if (questionIds.has(question.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate question ID '${question.id}'.`,
          path: [index, "id"],
        });
      }

      questionIds.add(question.id);

      for (const barModelPath of findBarModelPaths(question, [index])) {
        context.addIssue({
          code: "custom",
          message: `Question '${question.id}' contains a bar_model visual; bar_model is render-only until Phase 2 validation is wired into the bank.`,
          path: barModelPath,
        });
      }
    });
  });

export function validateQuestionBank(input: unknown): Question[] {
  return questionBankSchema.parse(input);
}

export function safeValidateQuestionBank(input: unknown) {
  return questionBankSchema.safeParse(input);
}
