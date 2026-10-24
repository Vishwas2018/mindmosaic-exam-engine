import { validateQuestionBank } from "@/features/exam-engine/validation";
import type { Question } from "@/schemas/question.schema";

/**
 * Prompt line-break fixtures for the showcase and its browser regression test.
 *
 * `showcase-amc-multiline-prompt` carries the stem of roadmap-amc-y5-019
 * verbatim (a unit test keeps the two identical). The control is the same
 * text under `naplan_style`, which pins that the AMC-scoped line-break fix
 * does not change how any other exam style displays. They live apart from
 * `showcaseQuestions` because that list is one-per-question-type and is
 * counted by the renderer showcase specs.
 */
export const MULTILINE_PROMPT = [
  "Five friends—Asha, Ben, Chen, Dev and Ella—each choose a different fruit from: apple, banana, cherry, date and grape.",
  "",
  "• Asha chooses cherry.",
  "• Dev chooses date.",
  "• Ben does not choose banana or grape.",
  "• Chen does not choose grape.",
  "",
  "Which fruit does Chen choose?",
].join("\n");

const options = [
  { id: "a", text: "apple" },
  { id: "b", text: "banana" },
  { id: "c", text: "cherry" },
  { id: "d", text: "date" },
  { id: "e", text: "grape" },
];

export const showcasePromptLayoutQuestions: readonly Question[] = validateQuestionBank([
  {
    id: "showcase-amc-multiline-prompt",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "amc_style",
    status: "published",
    prompt: MULTILINE_PROMPT,
    options,
    answerKey: { kind: "single_option", optionId: "b" },
    explanation: "Showcase fixture only.",
    metadata: {
      subject: "amc_mathematics",
      strand: "Logic & Problem-Solving",
      topic: "Logic & Problem-Solving",
      difficulty: "medium",
      marks: 4,
      estimatedTimeSeconds: 120,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  },
  {
    id: "showcase-naplan-multiline-prompt",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    prompt: MULTILINE_PROMPT,
    options,
    answerKey: { kind: "single_option", optionId: "b" },
    explanation: "Showcase fixture only.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "General",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: [],
      locale: "en-AU",
      source: "original",
      schemaVersion: 1,
    },
  },
]);
