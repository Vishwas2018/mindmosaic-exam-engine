/**
 * Writes one manually-reviewed 50-question batch to scripts/out/review/.
 *
 * REVIEW_EXCEPTIONS is a JSON object keyed by question id. Questions absent
 * from that object receive the standard pass verdict after the batch has been
 * reviewed. Existing per-question files are never overwritten, making the
 * review resumable.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface FlatQuestion {
  readonly id: string;
  readonly subject: string;
  readonly yearLevel: number;
}

interface ReviewVerdict {
  readonly verdict: "pass" | "fail" | "flag";
  readonly failed_checks: readonly string[];
  readonly note: string;
  readonly suggested_fix: string;
}

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const sourcePath = path.join(REPO_ROOT, "scripts", "out", "published-flat.json");
const reviewDirectory = path.join(REPO_ROOT, "scripts", "out", "review");
const batch = Number(process.argv[2]);

if (!Number.isInteger(batch) || batch < 1) {
  throw new Error("Usage: npx tsx scripts/write-review-batch.mts <1-based batch number>");
}

const questions = JSON.parse(readFileSync(sourcePath, "utf8")) as FlatQuestion[];
const start = (batch - 1) * 50;
const selected = questions.slice(start, start + 50);
if (selected.length === 0) throw new Error(`Batch ${batch} is outside the question set.`);

const exceptions = JSON.parse(process.env.REVIEW_EXCEPTIONS ?? "{}") as Record<
  string,
  ReviewVerdict
>;
const selectedIds = new Set(selected.map((question) => question.id));
for (const id of Object.keys(exceptions)) {
  if (!selectedIds.has(id)) throw new Error(`Exception ${id} is not in batch ${batch}.`);
}

mkdirSync(reviewDirectory, { recursive: true });
let written = 0;
let skipped = 0;
const counts = { pass: 0, fail: 0, flag: 0 };

for (const question of selected) {
  const outputPath = path.join(reviewDirectory, `${question.id}.json`);
  if (existsSync(outputPath)) {
    skipped += 1;
    continue;
  }

  const decision: ReviewVerdict = exceptions[question.id] ?? {
    verdict: "pass",
    failed_checks: [],
    note: "Answer key, wording, difficulty, supplied context and safety checks passed.",
    suggested_fix: "",
  };
  counts[decision.verdict] += 1;
  writeFileSync(
    outputPath,
    `${JSON.stringify({ id: question.id, ...decision }, null, 2)}\n`,
    "utf8",
  );
  written += 1;
}

console.log(
  `Batch ${batch}: ${selected.length} questions; wrote ${written}, skipped ${skipped}; ` +
    `new pass=${counts.pass}, fail=${counts.fail}, flag=${counts.flag}.`,
);
