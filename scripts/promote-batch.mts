/**
 * `questions:promote-batch` — the only way a staging batch may reach
 * `_promoted/`. Refuses unless `questions:gate` (composition + audit-
 * integrity + ledger consistency) passes for that batch first — see
 * REVIEW-PIPELINE.md's "Promotion requires questions:gate" section.
 *
 * This script does NOT write to src/content/questions/** — wiring a
 * promoted batch's questions into the served bank's .ts files remains the
 * separate, manual step it already was (see BATCH-LOG.md's 2026-08-12
 * icas-y5-numeracy-b01 row: "Staging retirement ... NOT done here; it is a
 * separate bookkeeping commit"). This script only ever moves
 * content/manual-questions/** files and appends to BATCH-LOG.md — both
 * content/factory tooling, never src/**.
 *
 * Usage:
 *   tsx scripts/promote-batch.mts <programme>-<bNN> [...] [--model <name>]
 *
 * --model defaults to "claude" (promotion is Claude's step per
 * REVIEW-PIPELINE.md). Each batch is processed independently — one batch's
 * refusal never blocks the rest.
 *
 * Exit codes: 0 every requested batch promoted, 1 at least one batch was
 * refused (gate failure, or no staging file), 2 invalid arguments.
 */
import fs from "node:fs";
import path from "node:path";
import { runGate } from "./lib/gate";
import { promoteCurriculumDepthBatch } from "./lib/promote-curriculum-depth.mjs";
import { expectedBatchPath, splitProgrammeAndBatch } from "./lib/programme-quotas";

function printUsage(): void {
  process.stderr.write(
    "Usage: tsx scripts/promote-batch.mts <programme>-<bNN> [...] [--model <name>]\n",
  );
}

const argv = process.argv.slice(2);
let model = "claude";
const batchIdentifiers: string[] = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--model") {
    model = argv[++i];
    continue;
  }
  batchIdentifiers.push(argv[i]);
}

if (batchIdentifiers.length === 0 || !model) {
  printUsage();
  process.exit(2);
}

const repoRoot = process.cwd();
let anyRefused = false;

for (const batchIdentifier of batchIdentifiers) {
  const depthManifestPath = path.join(
    repoRoot,
    `content/curriculum-imports/${batchIdentifier}-review-queue-manifest.json`,
  );
  if (batchIdentifier.startsWith("g5-depth") || fs.existsSync(depthManifestPath)) {
    const result = await promoteCurriculumDepthBatch(repoRoot, batchIdentifier, model);
    if (!result.ok) {
      console.error(`REFUSED ${batchIdentifier}: ${result.error}`);
      anyRefused = true;
    } else {
      console.log(`PROMOTED ${batchIdentifier} (${result.promotedCount} questions promoted).`);
    }
    continue;
  }

  const split = splitProgrammeAndBatch(batchIdentifier);
  if (!split) {
    console.error(`REFUSED ${batchIdentifier}: does not match '<programme>-bNN'.`);
    anyRefused = true;
    continue;
  }

  const relPath = expectedBatchPath(split.programme, split.batch);
  if (!relPath) {
    console.error(`REFUSED ${batchIdentifier}: unrecognised programme slug '${split.programme}'.`);
    anyRefused = true;
    continue;
  }

  const absPath = path.join(repoRoot, relPath);
  if (!fs.existsSync(absPath)) {
    console.error(`REFUSED ${batchIdentifier}: no staging file at ${relPath}.`);
    anyRefused = true;
    continue;
  }

  console.log(`\n=== questions:gate for ${batchIdentifier} ===`);
  const programmeFolder = path.dirname(absPath);
  const result = runGate(repoRoot, [absPath], programmeFolder);

  if (!result.ok) {
    const failed = result.steps.filter((s) => !s.ok).map((s) => s.name).join(", ");
    console.error(
      `\nREFUSED ${batchIdentifier}: questions:gate did not pass (${failed} failed). ` +
        `Promotion BLOCKED — batch stays at ${relPath}, no BATCH-LOG.md row appended.`,
    );
    anyRefused = true;
    continue;
  }

  const promotedDir = path.join(repoRoot, "content/manual-questions/_promoted");
  fs.mkdirSync(promotedDir, { recursive: true });
  fs.renameSync(absPath, path.join(promotedDir, `${batchIdentifier}.json`));

  const auditPath = absPath.replace(/\.json$/, ".audit.json");
  if (fs.existsSync(auditPath)) {
    fs.renameSync(auditPath, path.join(promotedDir, `${batchIdentifier}.audit.json`));
  }

  const date = new Date().toISOString().slice(0, 10);
  const row =
    `| ${date} | ${batchIdentifier} | promoted | ${model} | questions:gate passed ` +
    `(validate-batch + validate-audit-integrity + validate-ledger-consistency all green); ` +
    `staging file moved to _promoted/; src/content/questions/** wiring is a separate manual step |\n`;
  fs.appendFileSync(path.join(repoRoot, "content/manual-questions/BATCH-LOG.md"), row);

  console.log(`PROMOTED ${batchIdentifier} -> content/manual-questions/_promoted/${batchIdentifier}.json`);
}

process.exitCode = anyRefused ? 1 : 0;
