/** Structural preflight only; does not certify correctness or publish content. */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { candidateQuestionSchema, type CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";
import { questionSchema, type Question } from "@/schemas/question.schema";
import { EXAM_PATTERNS, selectPatternQuestions } from "@/features/exam-engine/exam-patterns";
import { scoreQuestion } from "@/features/exam-engine/scoring/score-question";
import { publishedExamBank } from "@/content/questions/practice-bank";

const directory = "content/roadmap-drafts";

export async function discoverDraftFiles(root = directory): Promise<string[]> {
  return (await readdir(root)).filter(file => file.endsWith(".json")).sort();
}

export function assertNoMojibake(value: unknown, location = "draft packet"): void {
  if (typeof value === "string") {
    if (/[\u00C3\u00C2\uFFFD]/u.test(value)) throw new Error(`${location}: possible mojibake found in ${JSON.stringify(value)}`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoMojibake(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoMojibake(key, `${location} property name`);
      assertNoMojibake(item, `${location}.${key}`);
    }
  }
}

export function answerPositionDistribution(questions: CandidateQuestion[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const question of questions) {
    const options = "options" in question && Array.isArray(question.options) ? question.options : null;
    if (!options || options.length === 0 || question.answerKey.kind !== "single_option") continue;
    const optionId = question.answerKey.optionId;
    const position = options.findIndex(option => option.id === optionId);
    if (position < 0) throw new Error(`${question.id}: answer key does not identify an option`);
    const letter = String.fromCharCode(97 + position);
    distribution[letter] = (distribution[letter] ?? 0) + 1;
  }
  return distribution;
}

export function hasLongRepeatingAnswerCycle(positions: string[]): boolean {
  for (let cycleLength = 2; cycleLength <= 5; cycleLength += 1) {
    for (let start = 0; start + cycleLength < positions.length; start += 1) {
      let repeatedComparisons = 0;
      for (let index = start + cycleLength; index < positions.length; index += 1) {
        if (positions[index] !== positions[index - cycleLength]) break;
        repeatedComparisons += 1;
        if (repeatedComparisons > 4) return true;
      }
    }
  }
  return false;
}

export function assertAnswerPositionQuality(file: string, questions: CandidateQuestion[]): Record<string, number> {
  const positions = questions.flatMap(question => {
    const options = "options" in question && Array.isArray(question.options) ? question.options : null;
    if (!options || options.length === 0 || question.answerKey.kind !== "single_option") return [];
    const optionId = question.answerKey.optionId;
    const optionIndex = options.findIndex(option => option.id === optionId);
    if (optionIndex < 0) throw new Error(`${question.id}: answer key does not identify an option`);
    const expectedIds = options.map((_, index) => String.fromCharCode(97 + index));
    if (options.some((option, index) => option.id !== expectedIds[index])) {
      throw new Error(`${question.id}: option identifiers must match displayed positions`);
    }
    return expectedIds[optionIndex];
  });
  if (positions.length === 0) throw new Error(`${file}: no multiple-choice answers to assess`);
  const distribution = answerPositionDistribution(questions);
  const maximum = Math.max(...Object.values(distribution));
  if (maximum / positions.length > 0.35) {
    throw new Error(`${file}: one answer position exceeds 35% (${JSON.stringify(distribution)})`);
  }
  if (hasLongRepeatingAnswerCycle(positions)) {
    throw new Error(`${file}: answer positions contain a repeating cycle of length 2–5 for more than four comparisons`);
  }
  return distribution;
}

const ALLOWED_PROVENANCE_VALIDATOR = path.join("src", "features", "content-governance", "amc-review-source.ts");

async function assertNoRuntimeDraftReference(root: string): Promise<void> {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "tests") await assertNoRuntimeDraftReference(file);
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      const source = await readFile(file, "utf8");
      if (!source.includes("roadmap-drafts")) continue;
      // `amc-review-source.ts` validates the provenance `sourceFile` string on an `amc_draft_review_source`
      // record; it must never import a draft JSON file or touch the filesystem.
      if (
        file === ALLOWED_PROVENANCE_VALIDATOR &&
        !/\b(?:import|require|from)\b[^\n]*roadmap-drafts|\bnode:fs\b|\bfs\b/.test(source)
      ) {
        continue;
      }
      throw new Error(`Unsigned roadmap drafts are referenced by runtime source: ${file}`);
    }
  }
}
async function main(): Promise<void> {
  await assertNoRuntimeDraftReference("src");
  const ids = new Set<string>();
  let total = 0;
  const draftFixtures: Question[] = [];
  for (const file of await discoverDraftFiles()) {
    const packet = JSON.parse(await readFile(path.join(directory, file), "utf8"));
    if (packet.draftOnly !== true || !Array.isArray(packet.questions)) throw new Error(`${file}: invalid draft packet`);
    assertNoMojibake(packet, file);
    const questions: CandidateQuestion[] = packet.questions.map((raw: unknown) => candidateQuestionSchema.parse(raw));
    if (questions.some(question => "options" in question && Array.isArray(question.options) && question.options.length > 0 &&
      question.answerKey.kind === "single_option")) {
      const distribution = assertAnswerPositionQuality(file, questions);
      console.log(`${file}: answer-position distribution ${JSON.stringify(distribution)}`);
    }
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
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
