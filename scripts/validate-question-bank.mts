import { questionBank } from "../src/content/questions/question-bank";
import { safeValidateQuestionBank } from "../src/features/exam-engine/validation/validate-question-bank";

const validation = safeValidateQuestionBank(questionBank);

if (!validation.success) {
  console.error("Question-bank validation failed:");
  for (const issue of validation.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "questionBank";
    console.error(`- ${path}: ${issue.message}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${validation.data.length} original MindMosaic sample questions.`,
  );
}
