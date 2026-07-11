import type { QuestionInput } from "@/schemas/question.schema";

export const validMultipleChoiceQuestion = {
  id: "test-mcq-1",
  type: "multiple_choice",
  yearLevel: 3,
  examStyle: "naplan_style",
  status: "published",
  prompt: "Which number is one hundred more than 245?",
  options: [
    { id: "a", text: "255" },
    { id: "b", text: "345" },
    { id: "c", text: "1,245" },
  ],
  answerKey: { kind: "single_option", optionId: "b" },
  explanation: "Adding one hundred changes the hundreds digit from 2 to 3.",
  metadata: {
    subject: "numeracy",
    strand: "Number",
    topic: "Place value",
    difficulty: "easy",
    estimatedTimeSeconds: 60,
  },
} satisfies QuestionInput;
