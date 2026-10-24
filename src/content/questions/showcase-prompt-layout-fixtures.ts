import { validateQuestionBank } from "@/features/exam-engine/validation";
import type { Question } from "@/schemas/question.schema";

/**
 * DEMONSTRATION CONTENT ONLY. These are synthetic placeholders for the QA
 * showcase and its browser regression test. They are not educational
 * questions, are not part of any examination bank, and must never be copied
 * from, or made to resemble, a real question.
 *
 * In particular this module must never hold text from an unpublished
 * question. The showcase is a client page, so everything here is compiled
 * into a static JavaScript chunk, answer keys included, regardless of
 * whether the route itself is gated. A unit test enforces that no draft or
 * published question text appears here, and that only the showcase page
 * imports this module.
 *
 * The two fixtures carry the same text under two exam styles. They pin that
 * line breaks are kept for `amc_style` and that every other style displays
 * exactly as before. They live apart from `showcaseQuestions` because that
 * list is one-per-question-type and is counted by the renderer showcase specs.
 */
export const DEMO_MULTILINE_PROMPT = [
  "Demonstration only: this is not a real question.",
  "",
  "• First line of the demonstration list.",
  "• Second line of the demonstration list.",
  "• Third line of the demonstration list.",
  "",
  "Choose any option to try the layout.",
].join("\n");

const options = [
  { id: "a", text: "Demonstration option 1" },
  { id: "b", text: "Demonstration option 2" },
  { id: "c", text: "Demonstration option 3" },
];

const demoMetadata = {
  strand: "Demonstration",
  topic: "Demonstration",
  difficulty: "easy" as const,
  marks: 1,
  estimatedTimeSeconds: 30,
  tags: ["demonstration"],
  locale: "en-AU" as const,
  source: "original" as const,
  schemaVersion: 1,
};

export const showcasePromptLayoutQuestions: readonly Question[] = validateQuestionBank([
  {
    id: "showcase-demo-amc-multiline",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "amc_style",
    status: "published",
    prompt: DEMO_MULTILINE_PROMPT,
    options,
    answerKey: { kind: "single_option", optionId: "a" },
    explanation: "Demonstration fixture. Not an educational question and not approved for learners.",
    metadata: { ...demoMetadata, subject: "amc_mathematics" as const },
  },
  {
    id: "showcase-demo-naplan-multiline",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    prompt: DEMO_MULTILINE_PROMPT,
    options,
    answerKey: { kind: "single_option", optionId: "a" },
    explanation: "Demonstration fixture. Not an educational question and not approved for learners.",
    metadata: { ...demoMetadata, subject: "numeracy" as const },
  },
]);
