/**
 * `questions:gate` — the single enforced choke point before a batch may be
 * promoted. Runs `validate-batch.mts`, `validate-audit-integrity.mts` and
 * `validate-ledger-consistency.mts` together and exits non-zero if ANY of
 * them finds a violation. See REVIEW-PIPELINE.md's "Promotion requires
 * questions:gate" section — `promote-batch.mts` calls this same logic and
 * refuses to promote unless it exits 0.
 *
 * Usage:
 *   tsx scripts/questions-gate.mts [path ...]
 *
 * With no arguments, scopes to the whole PRE-PROMOTION set: every batch file
 * under content/manual-questions, excluding _promoted/, _ready/, _conflicts/,
 * and any batch BATCH-LOG.md already records a `promoted` row for (a batch
 * shipped before this gate existed is not retroactively re-litigated against
 * a rule introduced afterwards). A path argument may be a single batch file
 * or a folder (walked recursively); explicit targets are validated as given,
 * without the promoted-batch exclusion.
 *
 * Exit codes: 0 all three gates passed, 1 at least one failed, 2 bad args.
 */
import fs from "node:fs";
import path from "node:path";
import { discoverBatchFiles, excludePromoted, isBatchFile, runGate } from "./lib/gate";

const repoRoot = process.cwd();
const defaultRoot = path.join(repoRoot, "content/manual-questions");
const inputs = process.argv.slice(2);

let targets: string[];
let ledgerScopeDir: string;

if (inputs.length === 0) {
  targets = excludePromoted(discoverBatchFiles(defaultRoot), repoRoot);
  ledgerScopeDir = defaultRoot;
} else {
  targets = [];
  for (const input of inputs) {
    const resolved = path.resolve(input);
    const stat = fs.statSync(resolved, { throwIfNoEntry: false });
    if (!stat) {
      console.error(`No such file or directory: ${input}`);
      process.exit(2);
    }
    if (stat.isDirectory()) {
      targets.push(...discoverBatchFiles(resolved));
    } else if (isBatchFile(path.basename(resolved))) {
      targets.push(resolved);
    } else {
      console.error(`Not a batch file (expects <programme>-bNN.json): ${input}`);
      process.exit(2);
    }
  }
  const singleDir = inputs.length === 1 && fs.statSync(path.resolve(inputs[0])).isDirectory();
  ledgerScopeDir = singleDir ? path.resolve(inputs[0]) : defaultRoot;
}

console.log(`questions:gate — ${targets.length} batch file(s) in scope.\n`);

const result = runGate(repoRoot, targets, ledgerScopeDir);

console.log(
  `\nquestions:gate ${result.ok ? "PASS" : "FAIL"} — ` +
    result.steps.map((s) => `${s.name}:${s.ok ? "ok" : "FAIL"}`).join(", "),
);

process.exitCode = result.ok ? 0 : 1;
