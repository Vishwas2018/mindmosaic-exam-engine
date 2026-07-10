import { showcaseQuestions, showcaseVisuals } from "../src/content/questions/showcase-fixtures";
import { safeValidateQuestionBank } from "../src/features/exam-engine/validation/validate-question-bank";
import { visualSchema } from "../src/schemas/visual.schema";
import { QUESTION_TYPES } from "../src/schemas/question.schema";
import { VISUAL_TYPES } from "../src/schemas/visual.schema";

const questions = showcaseQuestions;
const validation = safeValidateQuestionBank(questions);

let hasError = false;

if (!validation.success) {
  hasError = true;
  console.error("Question-bank validation failed:");
  for (const issue of validation.error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "questionBank";
    console.error(`- ${path}: ${issue.message}`);
  }
}

// Duplicate ID check.
const idCounts = new Map<string, number>();
for (const question of questions) {
  idCounts.set(question.id, (idCounts.get(question.id) ?? 0) + 1);
}
const duplicates = [...idCounts.entries()].filter(([, count]) => count > 1);
if (duplicates.length > 0) {
  hasError = true;
  console.error("Duplicate question IDs:");
  for (const [id, count] of duplicates) {
    console.error(`- ${id} appears ${count} times`);
  }
}

// Count questions by type.
const questionCounts = new Map<string, number>();
for (const question of questions) {
  questionCounts.set(question.type, (questionCounts.get(question.type) ?? 0) + 1);
}

// Gather and validate every visual (embedded + standalone), count by type.
const allVisuals = [
  ...questions.flatMap((question) => question.visuals),
  ...showcaseVisuals,
];
const visualCounts = new Map<string, number>();
for (const visual of allVisuals) {
  const result = visualSchema.safeParse(visual);
  if (!result.success) {
    hasError = true;
    console.error(`Visual '${visual.id}' failed validation.`);
  }
  visualCounts.set(visual.type, (visualCounts.get(visual.type) ?? 0) + 1);
}

console.log("MindMosaic focused fixture bank");
console.log("================================");
console.log(`Questions: ${questions.length}`);
console.log(`Question types covered: ${questionCounts.size} of ${QUESTION_TYPES.length}`);
for (const type of QUESTION_TYPES) {
  console.log(`  - ${type}: ${questionCounts.get(type) ?? 0}`);
}
console.log(`Visuals: ${allVisuals.length}`);
console.log(`Visual types covered: ${visualCounts.size} of ${VISUAL_TYPES.length}`);
for (const type of VISUAL_TYPES) {
  console.log(`  - ${type}: ${visualCounts.get(type) ?? 0}`);
}

const missingQuestionTypes = QUESTION_TYPES.filter((type) => !questionCounts.has(type));
const missingVisualTypes = VISUAL_TYPES.filter((type) => !visualCounts.has(type));
if (missingQuestionTypes.length > 0) {
  hasError = true;
  console.error(`Missing question types: ${missingQuestionTypes.join(", ")}`);
}
if (missingVisualTypes.length > 0) {
  hasError = true;
  console.error(`Missing visual types: ${missingVisualTypes.join(", ")}`);
}

if (hasError) {
  process.exitCode = 1;
} else {
  console.log("\nAll focused fixtures are valid.");
}
