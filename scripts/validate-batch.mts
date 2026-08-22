/**
 * ENFORCED batch validator — content/factory tooling only.
 *
 * Re-derives every composition quota from the batch's own question array and
 * fails the batch on any violation. batchSelfReport / batchMeta values are
 * NEVER trusted as evidence — they are self-attested by the generator, which
 * is exactly what let icas-y3-science-b01..b03 self-report 4/5/6 visuals
 * against a 12-18 requirement and still reach `ready_for_final_review`.
 *
 * Usage:
 *   tsx scripts/validate-batch.mts <path-to-batch.json | programme-folder> [...more]
 *
 * Exits non-zero if ANY file has a violation. Prints the specific violations.
 */

import fs from "node:fs";
import path from "node:path";
import { questionSchema } from "../src/schemas/question.schema";
import { PROGRAMME_QUOTAS, splitProgrammeAndBatch } from "./lib/programme-quotas";

interface RawQuestion {
  id?: unknown;
  type?: unknown;
  options?: unknown;
  visuals?: unknown;
  answerKey?: unknown;
  metadata?: unknown;
}

function isBatchFile(name: string): boolean {
  return /-b\d{2}\.json$/.test(name) && !name.endsWith(".audit.json") && !name.includes("PLACEHOLDER");
}

function collectTargets(inputs: readonly string[]): string[] {
  const targets: string[] = [];
  for (const input of inputs) {
    const stat = fs.statSync(input, { throwIfNoEntry: false });
    if (!stat) {
      console.error(`No such file or directory: ${input}`);
      process.exitCode = 1;
      continue;
    }
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(input)) {
        if (isBatchFile(name)) targets.push(path.join(input, name));
      }
    } else if (isBatchFile(path.basename(input))) {
      targets.push(input);
    } else {
      console.error(`Not a batch file (expects <programme>-bNN.json): ${input}`);
      process.exitCode = 1;
    }
  }
  return targets;
}

function validateBatchFile(filePath: string): { file: string; violations: string[] } {
  const violations: string[] = [];
  const basename = path.basename(filePath, ".json");
  const split = splitProgrammeAndBatch(basename);

  if (!split) {
    return {
      file: filePath,
      violations: [`Filename '${basename}' does not match '<programme>-bNN'.`],
    };
  }
  const { programme, batch } = split;
  const quota = PROGRAMME_QUOTAS[programme];
  if (!quota) {
    return {
      file: filePath,
      violations: [`Unknown programme '${programme}' — not in PROGRAMME_QUOTAS. Cannot validate.`],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { file: filePath, violations: [`Invalid JSON: ${(error as Error).message}`] };
  }

  const questions = (parsed as { questions?: unknown }).questions;
  if (!Array.isArray(questions)) {
    return { file: filePath, violations: ["Missing or non-array 'questions' field."] };
  }

  const raw = questions as RawQuestion[];
  const N = quota.questionCount;

  /* --- 1. Exact count --- */
  if (raw.length !== N) {
    violations.push(`Expected exactly ${N} questions, found ${raw.length}.`);
  }

  /* --- 2. Sequential IDs 001..N, no gaps, no duplicates --- */
  const expectedIds = Array.from({ length: N }, (_, i) =>
    `${programme}-${batch}-${String(i + 1).padStart(3, "0")}`,
  );
  const actualIds = raw.map((q) => (typeof q.id === "string" ? q.id : "<missing>"));
  const idSet = new Set(actualIds);
  if (idSet.size !== actualIds.length) {
    violations.push(`Duplicate question IDs present (${actualIds.length - idSet.size} duplicate(s)).`);
  }
  const missingIds = expectedIds.filter((id) => !idSet.has(id));
  const unexpectedIds = actualIds.filter((id) => !expectedIds.includes(id));
  if (missingIds.length > 0) {
    violations.push(
      `Missing expected sequential IDs: ${missingIds.slice(0, 10).join(", ")}${missingIds.length > 10 ? ", ..." : ""}`,
    );
  }
  if (unexpectedIds.length > 0) {
    violations.push(
      `IDs outside the expected sequence: ${unexpectedIds.slice(0, 10).join(", ")}${unexpectedIds.length > 10 ? ", ..." : ""}`,
    );
  }

  /* --- 3. Schema validity (every question, against the live schema) --- */
  raw.forEach((q, index) => {
    const result = questionSchema.safeParse(q);
    if (!result.success) {
      const id = typeof q.id === "string" ? q.id : `index ${index}`;
      const messages = result.error.issues.map((issue) => issue.message).join("; ");
      violations.push(`Schema-invalid question ${id}: ${messages}`);
    }
  });

  /* From here on, only reason about questions that parsed successfully. */
  const parsedQuestions = raw
    .map((q) => questionSchema.safeParse(q))
    .filter((r): r is { success: true; data: import("../src/schemas/question.schema").Question } => r.success)
    .map((r) => r.data);

  /* --- 4. Difficulty distribution matches the declared quota exactly --- */
  const difficultyCounts = { easy: 0, medium: 0, challenging: 0 };
  for (const q of parsedQuestions) {
    const d = q.metadata.difficulty;
    if (d in difficultyCounts) difficultyCounts[d as keyof typeof difficultyCounts] += 1;
  }
  if (difficultyCounts.easy !== quota.easy) {
    violations.push(`Difficulty 'easy' count is ${difficultyCounts.easy}, expected exactly ${quota.easy}.`);
  }
  if (difficultyCounts.medium !== quota.medium) {
    violations.push(`Difficulty 'medium' count is ${difficultyCounts.medium}, expected exactly ${quota.medium}.`);
  }
  if (difficultyCounts.challenging !== quota.challenging) {
    violations.push(
      `Difficulty 'challenging' count is ${difficultyCounts.challenging}, expected exactly ${quota.challenging}.`,
    );
  }

  /* --- 5. Visual question count within [visualMin, visualMax] --- */
  const visualQuestionCount = parsedQuestions.filter((q) => q.visuals.length > 0).length;
  if (visualQuestionCount < quota.visualMin || visualQuestionCount > quota.visualMax) {
    violations.push(
      `Visual question count is ${visualQuestionCount}, required within [${quota.visualMin}, ${quota.visualMax}] for ${programme}.`,
    );
  }

  /* --- 6. Permitted types + type diversity + single-type cap --- */
  const typeUsage = new Map<string, number>();
  for (const q of parsedQuestions) {
    typeUsage.set(q.type, (typeUsage.get(q.type) ?? 0) + 1);
  }
  const disallowedTypes = [...typeUsage.keys()].filter((t) => !quota.permittedTypes.includes(t));
  if (disallowedTypes.length > 0) {
    violations.push(`Uses non-permitted type(s) for ${programme}: ${disallowedTypes.join(", ")}.`);
  }
  const distinctTypes = typeUsage.size;
  if (quota.typeDiversityMin !== null && distinctTypes < quota.typeDiversityMin) {
    violations.push(
      `Type diversity is ${distinctTypes} distinct type(s), requires at least ${quota.typeDiversityMin}.`,
    );
  }
  for (const [type, count] of typeUsage) {
    // Integer-safe check for `count / N > capPercent / 100`.
    if (count * 100 > quota.typeCapPercent * parsedQuestions.length) {
      const pct = ((count / Math.max(parsedQuestions.length, 1)) * 100).toFixed(1);
      violations.push(
        `Type '${type}' is ${pct}% of the set, exceeding the ${quota.typeCapPercent}% cap.`,
      );
    }
  }

  /* --- 7. Single-option A/B/C/D balance --- */
  const singleOptionQuestions = parsedQuestions.filter((q) => q.answerKey.kind === "single_option");
  const positionCounts = { A: 0, B: 0, C: 0, D: 0 };
  const idToLetter: Record<string, keyof typeof positionCounts> = { a: "A", b: "B", c: "C", d: "D" };
  for (const q of singleOptionQuestions) {
    const optionId = (q.answerKey as { optionId: string }).optionId;
    const letter = idToLetter[optionId];
    if (letter) positionCounts[letter] += 1;
  }
  const counts = Object.values(positionCounts);
  const spread = Math.max(...counts) - Math.min(...counts);
  if (spread > 1) {
    violations.push(
      `Single-option A/B/C/D balance spread is ${spread} (A${positionCounts.A}/B${positionCounts.B}/C${positionCounts.C}/D${positionCounts.D}), must be ≤ 1.`,
    );
  }
  if (singleOptionQuestions.length >= 8) {
    const unused = (Object.keys(positionCounts) as (keyof typeof positionCounts)[]).filter(
      (letter) => positionCounts[letter] === 0,
    );
    if (unused.length > 0) {
      violations.push(
        `With ${singleOptionQuestions.length} single-option questions, every position must be used at least once; unused: ${unused.join(", ")}.`,
      );
    }
  }

  /* --- 8. keyLengthExtremeCount ≤ floor(0.35 x singleOptionCount) --- */
  let keyLengthExtremeCount = 0;
  for (const q of singleOptionQuestions) {
    const optionId = (q.answerKey as { optionId: string }).optionId;
    const lengths = q.options.map((o) => o.text.length);
    const correctOption = q.options.find((o) => o.id === optionId);
    if (!correctOption) continue;
    const correctLength = correctOption.text.length;
    const maxLength = Math.max(...lengths);
    const minLength = Math.min(...lengths);
    const isUniqueLongest = correctLength === maxLength && lengths.filter((l) => l === maxLength).length === 1;
    const isUniqueShortest = correctLength === minLength && lengths.filter((l) => l === minLength).length === 1;
    if (isUniqueLongest || isUniqueShortest) keyLengthExtremeCount += 1;
  }
  const keyLengthCap = Math.floor(0.35 * singleOptionQuestions.length);
  if (keyLengthExtremeCount > keyLengthCap) {
    violations.push(
      `keyLengthExtremeCount is ${keyLengthExtremeCount}, exceeding the permitted ${keyLengthCap} (floor(0.35 x ${singleOptionQuestions.length})).`,
    );
  }

  return { file: filePath, violations };
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Usage: tsx scripts/validate-batch.mts <path-to-batch.json | programme-folder> [...more]");
  process.exit(1);
}

const targets = collectTargets(inputs);
const results = targets.map(validateBatchFile);

for (const result of results) {
  const status = result.violations.length === 0 ? "PASS" : "FAIL";
  console.log(`\n[${status}] ${result.file}`);
  for (const v of result.violations) console.log(`  - ${v}`);
}

const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
console.log(
  `\n${results.length} batch file(s) checked, ${results.filter((r) => r.violations.length > 0).length} failed, ${totalViolations} total violation(s).`,
);

if (totalViolations > 0) process.exitCode = 1;
