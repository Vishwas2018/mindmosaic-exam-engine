/**
 * `rebalance-option-order` — one-off remediation for answer-position bias
 * in the served question banks.
 *
 * Measured before this ran: of 75 single-answer multiple-choice items in
 * the factory-published bank, the key was the FIRST option in 58 (77%).
 * A child who always picked the first option scored 77% without reading
 * anything. Chance is 25%.
 *
 * Reordering an `options` array is behaviour-preserving. Every scorer
 * compares option IDENTIFIERS, never positions:
 * `scoreMultipleChoice` is `answer === key.optionId` and
 * `scoreMultipleSelect` compares id sets
 * (`features/exam-engine/scoring/question-scorers.ts`). The A/B/C/D badges
 * in the renderers are decorative, derived from the render-time index and
 * `aria-hidden`, so they follow the new order automatically. A stored
 * attempt holds the chosen option id, so previously-submitted answers
 * score identically before and after.
 *
 * What this script deliberately does NOT do:
 *  - It never edits prompts, option text, answer keys or explanations.
 *    Length bias (the key also being the longest option) cannot be fixed
 *    by reordering and is reported, not touched.
 *  - It skips any question whose text refers to an option by position
 *    ("only the first option is supported"), because reordering would
 *    make that text wrong.
 *  - It leaves `PublicationManifest.contentHash` and the gate fingerprints
 *    alone. Those bind the gate evidence to the content as published; this
 *    script records the permutation in `optionOrderRebalance` instead, an
 *    additive field deliberately outside `manifestFingerprint` — the same
 *    treatment `recoveredEvidence` already gets, and for the same reason:
 *    an after-the-fact enrichment must never move a number that means
 *    "verified".
 *
 * Usage: tsx scripts/rebalance-option-order.mts [--dry-run]
 *
 * After running against the manifests, regenerate the served JSON with
 * `npm run questions:assemble-bank` so the two cannot drift.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";

const REPO_ROOT = process.cwd();
const MANIFEST_DIR = path.join(REPO_ROOT, "content", "question-factory", "published-manifests");
const CURATED_DIRS = [
  path.join(REPO_ROOT, "src", "content", "questions", "grade-3"),
  path.join(REPO_ROOT, "src", "content", "questions", "grade-5"),
];

const REBALANCED_AT = "2026-08-08T00:00:00.000Z";

interface Option {
  readonly id: string;
  readonly text: string;
}

/**
 * Wording that names an option by where it sits. Reordering would leave
 * such a question self-contradictory, so it is skipped and reported rather
 * than silently broken.
 */
const POSITIONAL_LANGUAGE =
  /\b(all of the above|none of the above|both a and b|option [a-h]\b|answer [a-h]\b|the (?:first|second|third|fourth|last) option)\b/i;

function hasPositionalLanguage(parts: readonly (string | undefined)[]): boolean {
  return parts.some((part) => part !== undefined && POSITIONAL_LANGUAGE.test(part));
}

/**
 * Moves `options[correctIndex]` to `targetIndex`, keeping every distractor
 * in its existing relative order. Deliberately a rotation rather than a
 * shuffle: the smallest change that achieves the target position is the
 * easiest to review in a diff.
 */
function moveKeyTo(options: readonly Option[], correctIndex: number, targetIndex: number): readonly Option[] {
  const key = options[correctIndex]!;
  const rest = options.filter((_, index) => index !== correctIndex);
  return [...rest.slice(0, targetIndex), key, ...rest.slice(targetIndex)];
}

/**
 * Target position for each item, cycling 0..n-1 within each option-count
 * bucket so every bucket ends up as close to uniform as its size allows.
 * Driven by a caller-held counter over a deterministically sorted list, so
 * a re-run produces the identical assignment.
 */
function makeTargetPicker(): (optionCount: number) => number {
  const seen = new Map<number, number>();
  return (optionCount) => {
    const next = seen.get(optionCount) ?? 0;
    seen.set(optionCount, next + 1);
    return next % optionCount;
  };
}

interface Outcome {
  readonly rebalanced: number;
  readonly skippedPositional: readonly string[];
  readonly skippedNotApplicable: number;
}

/* ---------------------------------------------------------------------- */
/* Published manifests (the source the served JSON is assembled from)      */
/* ---------------------------------------------------------------------- */

function rebalanceManifests(dryRun: boolean): Outcome {
  const files = readdirSync(MANIFEST_DIR).filter((name) => name.endsWith(".json")).sort();
  const pickTarget = makeTargetPicker();
  const skippedPositional: string[] = [];
  let rebalanced = 0;
  let skippedNotApplicable = 0;

  for (const file of files) {
    const full = path.join(MANIFEST_DIR, file);
    const manifest = JSON.parse(readFileSync(full, "utf-8")) as Record<string, unknown>;
    const question = manifest.question as Record<string, unknown> | undefined;
    if (question === undefined) continue;

    const answerKey = question.answerKey as { kind?: string; optionId?: string } | undefined;
    const options = question.options as Option[] | undefined;
    if (answerKey?.kind !== "single_option" || !Array.isArray(options) || options.length < 2) {
      skippedNotApplicable += 1;
      continue;
    }

    if (
      hasPositionalLanguage([
        question.prompt as string,
        question.explanation as string,
        question.instructions as string | undefined,
        ...options.map((option) => option.text),
      ])
    ) {
      skippedPositional.push(question.id as string);
      continue;
    }

    const correctIndex = options.findIndex((option) => option.id === answerKey.optionId);
    if (correctIndex < 0) {
      skippedNotApplicable += 1;
      continue;
    }

    const targetIndex = pickTarget(options.length);
    if (targetIndex === correctIndex) {
      rebalanced += 1;
      continue;
    }

    question.options = moveKeyTo(options, correctIndex, targetIndex);
    manifest.optionOrderRebalance = {
      rebalancedAt: REBALANCED_AT,
      reason: "answer_position_bias",
      previousKeyIndex: correctIndex,
      keyIndex: targetIndex,
      optionIdOrder: (question.options as Option[]).map((option) => option.id),
    };
    rebalanced += 1;
    if (!dryRun) writeFileSync(full, `${JSON.stringify(manifest, null, 2)}\n`, "utf-8");
  }

  return { rebalanced, skippedPositional, skippedNotApplicable };
}

/* ---------------------------------------------------------------------- */
/* Curated bank (hand-written TypeScript)                                  */
/* ---------------------------------------------------------------------- */

const OPTIONS_BLOCK = /^(\s*)options: \[\n([\s\S]*?)\n\1\],$/gm;

/**
 * Reorders the option lines of one curated question in place.
 *
 * Every curated `options` array is written one option per line (asserted
 * by the accompanying test), so the reorder is a line permutation — no
 * TypeScript parsing, and the diff shows exactly the lines that moved.
 */
function rebalanceCuratedFile(source: string, pickTarget: (optionCount: number) => number, skippedPositional: string[]): {
  readonly source: string;
  readonly rebalanced: number;
} {
  let rebalanced = 0;
  const out = source.replace(OPTIONS_BLOCK, (match, indent: string, body: string, offset: number) => {
    const lines = body.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length < 2 || !lines.every((line) => line.includes("{ id:"))) return match;

    // The answer key for this question is the next one after this block.
    const after = source.slice(offset + match.length);
    const keyMatch = after.match(/answerKey: \{ kind: "single_option", optionId: "(.*?)" \}/);
    const nextOptions = after.indexOf("options: [");
    if (!keyMatch || (nextOptions >= 0 && after.indexOf(keyMatch[0]) > nextOptions)) return match;

    const idOf = (line: string) => line.match(/\{ id: "(.*?)"/)?.[1];
    const correctIndex = lines.findIndex((line) => idOf(line) === keyMatch[1]);
    if (correctIndex < 0) return match;

    // Question-level positional language: check the enclosing question's
    // text, which is the slice between the previous and next question.
    const questionStart = source.lastIndexOf("\n  {", offset);
    const questionEnd = offset + match.length + (after.indexOf("\n  },") >= 0 ? after.indexOf("\n  },") : after.length);
    if (hasPositionalLanguage([source.slice(questionStart, questionEnd)])) {
      const idLine = source.slice(questionStart, offset).match(/id: "(.*?)"/);
      skippedPositional.push(idLine?.[1] ?? "(unknown)");
      return match;
    }

    const targetIndex = pickTarget(lines.length);
    rebalanced += 1;
    if (targetIndex === correctIndex) return match;

    const reordered = moveKeyTo(
      lines.map((line, index) => ({ id: String(index), text: line })),
      correctIndex,
      targetIndex,
    ).map((entry) => entry.text);
    return `${indent}options: [\n${reordered.join("\n")}\n${indent}],`;
  });
  return { source: out, rebalanced };
}

function rebalanceCurated(dryRun: boolean): Outcome {
  const pickTarget = makeTargetPicker();
  const skippedPositional: string[] = [];
  let rebalanced = 0;

  for (const dir of CURATED_DIRS) {
    for (const file of readdirSync(dir).filter((name) => name.endsWith(".ts")).sort()) {
      const full = path.join(dir, file);
      const source = readFileSync(full, "utf-8");
      const result = rebalanceCuratedFile(source, pickTarget, skippedPositional);
      rebalanced += result.rebalanced;
      if (!dryRun && result.source !== source) writeFileSync(full, result.source, "utf-8");
    }
  }

  return { rebalanced, skippedPositional, skippedNotApplicable: 0 };
}

/* ---------------------------------------------------------------------- */

function main(): void {
  const dryRun = process.argv.includes("--dry-run");

  const manifests = rebalanceManifests(dryRun);
  const curated = rebalanceCurated(dryRun);

  process.stdout.write(
    [
      `Answer-position rebalance${dryRun ? " (dry run)" : ""}:`,
      `  published manifests: ${manifests.rebalanced} rebalanced, ${manifests.skippedNotApplicable} not single-answer multiple choice`,
      `  curated bank:        ${curated.rebalanced} rebalanced`,
      `  skipped (positional language, would be made wrong by reordering):`,
      ...[...manifests.skippedPositional, ...curated.skippedPositional].map((id) => `    ${id}`),
      "",
      dryRun ? "  (no files written)" : "  Now run: npm run questions:assemble-bank",
      "",
    ].join("\n"),
  );
}

main();
