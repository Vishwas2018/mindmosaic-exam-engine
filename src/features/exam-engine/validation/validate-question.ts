import {
  questionSchema,
  type Question,
} from "@/schemas/question.schema";

export function validateQuestion(input: unknown): Question {
  return questionSchema.parse(input);
}

export function safeValidateQuestion(input: unknown) {
  return questionSchema.safeParse(input);
}
