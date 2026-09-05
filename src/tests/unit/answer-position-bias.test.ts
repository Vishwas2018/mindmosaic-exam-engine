import { describe, expect, it } from "vitest";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { practiceQuestionSeeds } from "@/content/questions/generated/generated-questions";
import { practiceExamBank, practiceQuestions, publishedExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import type { Question } from "@/schemas/question.schema";

/**
 * Test-validity invariants for every bank a learner can be served.
 *
 * These are correctness gates, not style preferences. A multiple-choice
 * question whose key can be found without reading it does not measure what
 * it claims to measure, and a bank full of them reports a score that is
 * partly a measure of the bank's own tells. In the published bank the key
 * is the FIRST option in 58 of 75 single-answer items (77%, against a 25%
 * chance baseline): a child who always picks the first option scores 77%
 * without reading anything.
 *
 * Two independent tells are checked:
 *
 *  - POSITION. The key must not concentrate in any one slot.
 *  - LENGTH. The key must not be the longest option too often. This is the
 *    classic "the right answer is the fully-qualified one" tell, and it is
 *    a property of how the distractors are WRITTEN — reordering cannot
 *    touch it.
 *
 * The CURATED banks are clean on both tells: reordering their options is a
 * source-only edit, scored by option id, so it carries no provenance risk.
 *
 * The PUBLISHED banks are not, and their debt is recorded below rather
 * than fixed here. A 2026-08-08 pass did rewrite them in place — it
 * reordered options in 55 published manifests and rewrote distractors in
 * 31 — but it left `contentHash` and `revision` untouched, so each gate
 * chain still asserted over content its evidence had never seen. That pass
 * was reverted. Repaying this debt means re-running the rebalance through
 * the publication pipeline so the content is rehashed and re-gated; it
 * must not be done by editing manifests on disk.
 */

/** No single slot may hold more than this share of the keys. Chance is 1/n; 0.4 leaves generous room for small-sample wobble. */
const MAX_KEY_POSITION_SHARE = 0.4;

/** Nor may the key be the longest option more often than this. */
const MAX_LONGEST_KEY_SHARE = 0.4;

/**
 * Below this many items a proportion is noise, not evidence. Every bank
 * currently under test is well above it, and a test below asserts that —
 * so this guard can never quietly switch the gate off for a real bank.
 */
const MIN_SAMPLE_FOR_PROPORTION = 20;

/**
 * Position-bias debt: banks waived above `MAX_KEY_POSITION_SHARE`, each at
 * its own measured share so the number can fall but never rise.
 *
 * The factory-published bank remains waived because its keys sit
 * overwhelmingly in the first slot. The published exam bank cleared the
 * threshold after the overnight ingest, so its debt entry is retired.
 */
const POSITION_BIAS_DEBT: Readonly<Record<string, number>> = {
  "factory-published": 159 / 281,
};

/**
 * Length-bias debt: banks waived above `MAX_LONGEST_KEY_SHARE`, each at
 * its own measured share so the number can fall but never rise.
 */
const LENGTH_BIAS_DEBT: Readonly<Record<string, number>> = {
  "factory-published": 149 / 229,
};

interface BiasReport {
  readonly total: number;
  readonly positionShares: readonly number[];
  readonly maxPositionShare: number;
  readonly longestKeyShare: number;
}

function singleAnswerItems(bank: readonly Question[]): readonly Question[] {
  return bank.filter((question) => question.answerKey.kind === "single_option" && question.options.length >= 2);
}

function analyse(bank: readonly Question[]): BiasReport {
  const items = singleAnswerItems(bank);
  const positionCounts = new Map<number, number>();
  let longestKeyCount = 0;

  for (const question of items) {
    const key = question.answerKey as Extract<Question["answerKey"], { kind: "single_option" }>;
    const keyIndex = question.options.findIndex((option) => option.id === key.optionId);
    // A key naming no existing option is a different defect entirely; the
    // schema and scoring suites own it, and counting it here would skew
    // the proportions this file exists to measure.
    if (keyIndex < 0) continue;

    positionCounts.set(keyIndex, (positionCounts.get(keyIndex) ?? 0) + 1);

    const lengths = question.options.map((option) => option.text.trim().length);
    const longest = Math.max(...lengths);
    // Only a UNIQUE longest is a usable tell: if two options tie for
    // longest, "pick the longest" does not name an answer.
    if (lengths[keyIndex] === longest && lengths.filter((length) => length === longest).length === 1) {
      longestKeyCount += 1;
    }
  }

  const total = items.length;
  const positionShares = [...positionCounts.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, count]) => count / total);

  return {
    total,
    positionShares,
    maxPositionShare: positionShares.length === 0 ? 0 : Math.max(...positionShares),
    longestKeyShare: total === 0 ? 0 : longestKeyCount / total,
  };
}

const BANKS: readonly (readonly [string, readonly Question[]])[] = [
  ["curated", questionBank],
  ["factory-published", factoryPublishedQuestions as readonly Question[]],
  ["practice seeds", practiceQuestions],
  ["published exam bank", publishedExamBank],
  ["practice exam bank", practiceExamBank],
];

describe("answer-position bias", () => {
  it.each(BANKS)("%s: the key never concentrates in one option position", (label, bank) => {
    const report = analyse(bank);
    expect(report.total).toBeGreaterThanOrEqual(MIN_SAMPLE_FOR_PROPORTION);
    const allowance = POSITION_BIAS_DEBT[label] ?? MAX_KEY_POSITION_SHARE;
    expect(report.maxPositionShare).toBeLessThanOrEqual(allowance);
  });

  it("every recorded position-bias debt entry is still needed", () => {
    for (const [label, allowance] of Object.entries(POSITION_BIAS_DEBT)) {
      const bank = BANKS.find(([name]) => name === label)?.[1];
      expect(bank, `POSITION_BIAS_DEBT names '${label}', which is not a bank under test`).toBeDefined();
      const share = analyse(bank!).maxPositionShare;
      expect(
        share,
        `'${label}' is now at ${(share * 100).toFixed(1)}%, under the ${MAX_KEY_POSITION_SHARE * 100}% threshold — delete its POSITION_BIAS_DEBT entry.`,
      ).toBeGreaterThan(MAX_KEY_POSITION_SHARE);
      expect(allowance).toBeLessThanOrEqual(share + 0.01);
    }
  });

  it("no bank outside the recorded position debt exceeds the threshold", () => {
    for (const [label, bank] of BANKS) {
      if (label in POSITION_BIAS_DEBT) continue;
      expect(analyse(bank).maxPositionShare).toBeLessThanOrEqual(MAX_KEY_POSITION_SHARE);
    }
  });

  it("the raw seed array is covered too, not just the validated pool", () => {
    // practiceQuestions is validateQuestionBank(practiceQuestionSeeds), so
    // this is the same content — asserted separately so a future change to
    // how the seeds are wrapped cannot drop them out of the gate.
    const report = analyse(practiceQuestionSeeds as unknown as readonly Question[]);
    expect(report.total).toBeGreaterThanOrEqual(MIN_SAMPLE_FOR_PROPORTION);
    expect(report.maxPositionShare).toBeLessThanOrEqual(MAX_KEY_POSITION_SHARE);
  });

  it("every bank under test is large enough for the proportion to mean something", () => {
    for (const [, bank] of BANKS) {
      expect(analyse(bank).total).toBeGreaterThanOrEqual(MIN_SAMPLE_FOR_PROPORTION);
    }
  });
});

describe("answer-length bias", () => {
  it.each(BANKS)("%s: the key is not the longest option too often", (label, bank) => {
    const report = analyse(bank);
    const allowance = LENGTH_BIAS_DEBT[label] ?? MAX_LONGEST_KEY_SHARE;
    expect(report.longestKeyShare).toBeLessThanOrEqual(allowance);
  });

  it("every recorded length-bias debt entry is still needed", () => {
    // Forces a waiver to be deleted the moment its bank clears the real
    // threshold, so this map cannot decay into a permanent exemption.
    for (const [label, allowance] of Object.entries(LENGTH_BIAS_DEBT)) {
      const bank = BANKS.find(([name]) => name === label)?.[1];
      expect(bank, `LENGTH_BIAS_DEBT names '${label}', which is not a bank under test`).toBeDefined();
      const share = analyse(bank!).longestKeyShare;
      expect(
        share,
        `'${label}' is now at ${(share * 100).toFixed(1)}%, under the ${MAX_LONGEST_KEY_SHARE * 100}% threshold — delete its LENGTH_BIAS_DEBT entry.`,
      ).toBeGreaterThan(MAX_LONGEST_KEY_SHARE);
      expect(allowance).toBeLessThan(0.7);
    }
  });

  it("no bank outside the recorded debt exceeds the threshold", () => {
    for (const [label, bank] of BANKS) {
      if (label in LENGTH_BIAS_DEBT) continue;
      expect(analyse(bank).longestKeyShare).toBeLessThanOrEqual(MAX_LONGEST_KEY_SHARE);
    }
  });
});

describe("curated option arrays stay one option per line", () => {
  it("is what scripts/rebalance-option-order.mts relies on to reorder them", async () => {
    const { readdirSync, readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const dirs = ["grade-3", "grade-5"].map((dir) =>
      path.join(process.cwd(), "src", "content", "questions", dir),
    );
    let arrays = 0;
    for (const dir of dirs) {
      for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts"))) {
        const source = readFileSync(path.join(dir, file), "utf-8");
        for (const match of source.matchAll(/\n(\s*)options: \[\n([\s\S]*?)\n\1\],/g)) {
          const body = match[2]!;
          const lines = body.split("\n").filter((line) => line.trim().length > 0);
          if (lines.length === 0) continue;
          arrays += 1;
          expect(lines.every((line) => line.includes("{ id:"))).toBe(true);
        }
      }
    }
    expect(arrays).toBeGreaterThan(0);
  });
});
