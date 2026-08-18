/**
 * Validates the per-question published-bank review and writes its summary.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Verdict = "pass" | "fail" | "flag";

interface FlatQuestion {
  readonly id: string;
  readonly subject: string;
  readonly yearLevel: number;
}

interface Review {
  readonly id: string;
  readonly verdict: Verdict;
  readonly failed_checks: readonly string[];
  readonly note: string;
  readonly suggested_fix: string;
}

const EXPECTED_COUNT = 1_253;
const VALID_CHECKS = new Set([
  "answer_key_correct",
  "unambiguous",
  "grade_appropriate",
  "self_contained",
  "safe",
]);
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const outputDirectory = path.join(REPO_ROOT, "scripts", "out");
const flatPath = path.join(outputDirectory, "published-flat.json");
const reviewDirectory = path.join(outputDirectory, "review");
const summaryPath = path.join(outputDirectory, "review-summary.json");

const questions = JSON.parse(readFileSync(flatPath, "utf8")) as FlatQuestion[];
if (questions.length !== EXPECTED_COUNT) {
  throw new Error(`Expected ${EXPECTED_COUNT} flattened questions, found ${questions.length}.`);
}

const questionById = new Map(questions.map((question) => [question.id, question]));
if (questionById.size !== questions.length) throw new Error("Duplicate question IDs in flat file.");

const reviewFiles = readdirSync(reviewDirectory).filter((name) => name.endsWith(".json"));
if (reviewFiles.length !== EXPECTED_COUNT) {
  throw new Error(`Expected ${EXPECTED_COUNT} review files, found ${reviewFiles.length}.`);
}

const reviews = new Map<string, Review>();
for (const fileName of reviewFiles) {
  const review = JSON.parse(
    readFileSync(path.join(reviewDirectory, fileName), "utf8"),
  ) as Review;
  if (!questionById.has(review.id)) throw new Error(`Review has unknown id: ${review.id}`);
  if (reviews.has(review.id)) throw new Error(`Duplicate review id: ${review.id}`);
  if (!(["pass", "fail", "flag"] as const).includes(review.verdict)) {
    throw new Error(`Invalid verdict for ${review.id}: ${String(review.verdict)}`);
  }
  if (!Array.isArray(review.failed_checks)) {
    throw new Error(`failed_checks is not an array for ${review.id}`);
  }
  for (const check of review.failed_checks) {
    if (!VALID_CHECKS.has(check)) throw new Error(`Invalid failed check ${check} for ${review.id}`);
  }
  if (review.verdict === "pass" && review.failed_checks.length !== 0) {
    throw new Error(`Pass review ${review.id} has failed checks.`);
  }
  if (review.verdict !== "pass" && review.failed_checks.length === 0) {
    throw new Error(`${review.verdict} review ${review.id} has no failed checks.`);
  }
  if (typeof review.note !== "string" || review.note.trim() === "") {
    throw new Error(`Review ${review.id} has no note.`);
  }
  if (typeof review.suggested_fix !== "string") {
    throw new Error(`Review ${review.id} has an invalid suggested_fix.`);
  }
  reviews.set(review.id, review);
}

for (const question of questions) {
  if (!reviews.has(question.id)) throw new Error(`Missing review for ${question.id}`);
}

const totalsByVerdict: Record<Verdict, number> = { pass: 0, fail: 0, flag: 0 };
const breakdown: Record<
  "fail" | "flag",
  { bySubject: Record<string, number>; byYearLevel: Record<string, number> }
> = {
  fail: { bySubject: {}, byYearLevel: {} },
  flag: { bySubject: {}, byYearLevel: {} },
};

for (const question of questions) {
  const review = reviews.get(question.id)!;
  totalsByVerdict[review.verdict] += 1;
  if (review.verdict === "fail" || review.verdict === "flag") {
    const group = breakdown[review.verdict];
    group.bySubject[question.subject] = (group.bySubject[question.subject] ?? 0) + 1;
    const year = String(question.yearLevel);
    group.byYearLevel[year] = (group.byYearLevel[year] ?? 0) + 1;
  }
}

const sortRecord = (record: Record<string, number>) =>
  Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));

for (const verdict of ["fail", "flag"] as const) {
  breakdown[verdict].bySubject = sortRecord(breakdown[verdict].bySubject);
  breakdown[verdict].byYearLevel = sortRecord(breakdown[verdict].byYearLevel);
}

const summary = {
  totalQuestions: questions.length,
  reviewedQuestions: reviews.size,
  totalsByVerdict,
  breakdown,
};

writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

console.log("\nPublished content review summary");
console.table(
  (["pass", "fail", "flag"] as const).map((verdict) => ({
    verdict,
    count: totalsByVerdict[verdict],
  })),
);

for (const verdict of ["fail", "flag"] as const) {
  console.log(`\n${verdict.toUpperCase()} breakdown`);
  const subjects = Object.keys(breakdown[verdict].bySubject);
  const years = Object.keys(breakdown[verdict].byYearLevel);
  const rows = [
    ...subjects.map((subject) => ({
      dimension: "subject",
      value: subject,
      count: breakdown[verdict].bySubject[subject],
    })),
    ...years.map((year) => ({
      dimension: "yearLevel",
      value: year,
      count: breakdown[verdict].byYearLevel[year],
    })),
  ];
  console.table(rows);
}

console.log(`\nWrote ${summaryPath}`);
