import { z } from "zod";

import {
  questionSchema,
  type Question,
} from "@/schemas/question.schema";

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
    });
  });

export function validateQuestionBank(input: unknown): Question[] {
  return questionBankSchema.parse(input);
}

export function safeValidateQuestionBank(input: unknown) {
  return questionBankSchema.safeParse(input);
}
