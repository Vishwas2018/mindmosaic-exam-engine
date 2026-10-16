import { z } from "zod";

import { validateBarModelVisual } from "@/features/visuals/bar-model/pipeline";
import { deriveBarModelAnswer } from "@/features/visuals/bar-model/answer";
import { fractionFromFiniteNumber, fractionsEqual } from "@/features/question-factory/correctness/numeric";

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

      const barModels = question.visuals.flatMap((visual, visualIndex) => visual.type === "bar_model" ? [{ visual, visualIndex }] : []);
      for (const { visual, visualIndex } of barModels) {
        const result = validateBarModelVisual(visual);
        for (const issue of result.issues.filter((entry) => entry.severity === "error")) {
          context.addIssue({ code: "custom", message: `bar_model ${issue.code}: ${issue.message}`, path: [index, "visuals", visualIndex, ...issue.path] });
        }
      }
      if (barModels.length > 0) {
        const derived = deriveBarModelAnswer(question);
        const key = question.answerKey;
        const matches = derived.ok && (
          (key.kind === "number" && derived.value.kind === "number" && fractionsEqual(derived.value.value, fractionFromFiniteNumber(key.value))) ||
          (key.kind === "single_option" && derived.value.kind === "single_option" && derived.value.optionId === key.optionId)
        );
        if (!matches) context.addIssue({ code: "custom", message: derived.ok ? "bar_model target disagrees with the declared answer key." : `bar_model: ${derived.message}`, path: [index, "answerKey"] });
      }
    });
  });

export function validateQuestionBank(input: unknown): Question[] {
  return questionBankSchema.parse(input);
}

export function safeValidateQuestionBank(input: unknown) {
  return questionBankSchema.safeParse(input);
}
