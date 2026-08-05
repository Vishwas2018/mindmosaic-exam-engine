import fs from "node:fs";
import path from "node:path";
import { questionSchema, QUESTION_TYPES } from "../src/schemas/question.schema";

const inbox = path.join(process.cwd(), "content/question-factory/inbox");
const files = fs.readdirSync(inbox).filter((name) => /^batch-.*\.json$/.test(name)).sort();
const normalise = (value: string) => value.toLocaleLowerCase("en-AU").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const tokens = (value: string) => new Set(normalise(value).split(" ").filter(Boolean));
function nearDuplicate(a: string, b: string): boolean {
  const aa = tokens(a), bb = tokens(b);
  if (!aa.size || !bb.size) return false;
  const intersection = [...aa].filter((token) => bb.has(token)).length;
  const union = new Set([...aa, ...bb]).size;
  return intersection / union >= 0.92;
}

const seenIds = new Set<string>();
const prompts: { text: string; id: string }[] = [];
const byType = new Map<string, number>();
let checked = 0;
let firstAttemptFailures = 0;
const failures: string[] = [];

for (const file of files) {
  const parsedFile: unknown = JSON.parse(fs.readFileSync(path.join(inbox, file), "utf8"));
  if (!parsedFile || typeof parsedFile !== "object" || !Array.isArray((parsedFile as { questions?: unknown }).questions)) {
    failures.push(`${file}: expected { questions: [...] }`);
    continue;
  }
  const questions = (parsedFile as { questions: unknown[] }).questions;
  for (const [index, raw] of questions.entries()) {
    checked += 1;
    const result = questionSchema.safeParse(raw);
    if (!result.success) {
      firstAttemptFailures += 1;
      failures.push(`${file}[${index}]: ${result.error.issues.map((issue) => issue.message).join("; ")}`);
      continue;
    }
    const question = result.data;
    if (seenIds.has(question.id)) failures.push(`${file}[${index}]: duplicate id ${question.id}`);
    seenIds.add(question.id);
    for (const previous of prompts) {
      if (nearDuplicate(previous.text, question.prompt)) failures.push(`${file}[${index}]: near-duplicate prompt with ${previous.id}`);
    }
    prompts.push({ text: question.prompt, id: question.id });
    if (!QUESTION_TYPES.includes(question.type)) failures.push(`${file}[${index}]: unsupported type ${question.type}`);
    byType.set(question.type, (byType.get(question.type) ?? 0) + 1);
    if (question.type === "reading_comprehension" && !question.stimulus) failures.push(`${file}[${index}]: reading question has no stimulus`);
    for (const visual of question.visuals) {
      if (visual.altText.length < 10 || visual.altText.length > 300) failures.push(`${file}[${index}]: invalid altText`);
    }
  }
}

const report = { files: files.length, checked, valid: checked - firstAttemptFailures, firstAttemptFailures, duplicateOrNearDuplicateFailures: failures.filter((failure) => /duplicate/.test(failure)).length, failures, byType: Object.fromEntries([...byType.entries()].sort()) };
console.log(JSON.stringify(report, null, 2));
if (failures.length > 0) process.exitCode = 1;
