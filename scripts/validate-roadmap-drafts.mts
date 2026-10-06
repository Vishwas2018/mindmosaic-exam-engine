/** Structural preflight only; does not certify correctness or publish content. */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { candidateQuestionSchema, type CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import { questionSchema, type Question } from "@/schemas/question.schema";
import { EXAM_PATTERNS, selectPatternQuestions } from "@/features/exam-engine/exam-patterns";
import { scoreQuestion } from "@/features/exam-engine/scoring/score-question";
import { publishedExamBank } from "@/content/questions/practice-bank";

const directory = "content/roadmap-drafts";
async function assertNoRuntimeDraftReference(root: string): Promise<void> {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "tests") await assertNoRuntimeDraftReference(file);
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name) &&
      (await readFile(file, "utf8")).includes("roadmap-drafts")) {
      throw new Error(`Unsigned roadmap drafts are referenced by runtime source: ${file}`);
    }
  }
}
await assertNoRuntimeDraftReference("src");
const ids = new Set<string>();
let total = 0;
const draftFixtures: Question[] = [];
for (const file of (await readdir(directory)).filter(file => file.endsWith(".json")).sort()) {
  const packet = JSON.parse(await readFile(path.join(directory, file), "utf8"));
  if (packet.draftOnly !== true || !Array.isArray(packet.questions)) throw new Error(`${file}: invalid draft packet`);
  const questions: CandidateQuestion[] = packet.questions.map((raw: unknown) => candidateQuestionSchema.parse(raw));
  const synthetic: Question[] = [];
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`Duplicate draft identity: ${question.id}`);
    ids.add(question.id);
    // These markers exist only in memory to test future publication compatibility.
    synthetic.push(questionSchema.parse({ ...question, metadata: { ...question.metadata, topic: question.metadata.strand },
      status: "draft", origin: "original_seed" }));
  }
  if (file.startsWith("amc-")) {
    if (questions.length !== 30) throw new Error(`${file}: expected 30 items`);
    questions.forEach((question, index) => {
      const marks = index < 10 ? 3 : index < 20 ? 4 : index < 25 ? 5 : index - 19;
      if (question.metadata.marks !== marks) throw new Error(`${question.id}: invalid scoring tier`);
      if (index < 25 && (question.type !== "multiple_choice" || question.options.length !== 5)) {
        throw new Error(`${question.id}: expected five-choice item`);
      }
      if (index >= 25 && (question.type !== "number_entry" || question.answerKey.kind !== "number" ||
        !Number.isInteger(question.answerKey.value) || question.answerKey.value < 0 || question.answerKey.value > 999 ||
        question.answerKey.tolerance !== 0)) throw new Error(`${question.id}: invalid integer-answer tail`);
    });
    const pattern = EXAM_PATTERNS.find(pattern => pattern.examStyle === "amc_style" &&
      pattern.yearLevel === synthetic[0].yearLevel && pattern.presentation === "full_length_practice")!;
    const draw = selectPatternQuestions(synthetic, pattern, "unsigned-draft-preflight");
    if (!draw.ok || draw.reduced || draw.questions.length !== 30) throw new Error(`${file}: draft fixtures cannot fill AMC constraints`);
    const awarded = draw.questions.reduce((sum, question) => {
      const answer = question.answerKey.kind === "single_option" ? question.answerKey.optionId :
        question.answerKey.kind === "number" ? question.answerKey.value : undefined;
      return sum + scoreQuestion(question, answer).awardedMarks;
    }, 0);
    if (awarded !== 135) throw new Error(`${file}: declared answer fixture scoring does not total 135`);
    console.log(`${file}: hypothetical draft draw fills 30 slots; declared-key scoring totals 135. This is not runtime readiness or independent correctness review.`);
  }
  total += questions.length;
  draftFixtures.push(...synthetic);
  console.log(`${file}: ${questions.length} structurally valid unsigned drafts`);
}
// A private capacity simulation, using the production selector and unsigned
// draft snapshots. Never passed to the learner gateway or persisted as published.
for (const pattern of EXAM_PATTERNS.filter(pattern => pattern.id.endsWith("-full") &&
  (pattern.examStyle === "naplan_style" || pattern.id === "icas-y5-science-full"))) {
  for (const seed of ["draft-preview-a", "draft-preview-b", "draft-preview-c"]) {
    const draw = selectPatternQuestions([...publishedExamBank, ...draftFixtures], pattern, seed);
    if (!draw.ok || draw.reduced || draw.questions.length !== pattern.questionCount) {
      throw new Error(`${pattern.id}: unsigned draft simulation does not fill full-paper constraints`);
    }
  }
  console.log(`${pattern.id}: hypothetical authored + draft selection fills full-paper constraints. Approved runtime availability remains separate.`);
}
console.log(`${total} drafts passed structural preflight. Independent review and human approval remain required.`);
