import { questionBank } from "../src/content/questions/question-bank";
import {
  hashSeed,
  selectExamQuestions,
  type ExamSelectionConfig,
} from "../src/features/exam-engine/selection";

const seed = "golden-vector-seed";
const config: ExamSelectionConfig = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "timed",
};

const selection = selectExamQuestions(questionBank, config, seed);
if (!selection.ok) {
  throw new Error(`Unable to regenerate selection vector: ${selection.reason}`);
}

console.log(
  JSON.stringify(
    {
      bankLength: questionBank.length,
      bankHash: hashSeed(questionBank.map((question) => question.id).join("|")),
      seed,
      config,
      selection: selection.questions.map((question) => question.id),
    },
    null,
    2,
  ),
);
