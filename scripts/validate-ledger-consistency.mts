/**
 * ENFORCED ledger/filesystem consistency check — content/factory tooling only.
 *
 * BATCH-LOG.md is append-only and is meant to be the source of truth for
 * "who generated/audited what" (REVIEW-PIPELINE.md). Nothing has ever
 * checked that its rows correspond to real files: it is possible to append
 * a `generated` (or even `audited`) row for a batch that was never written
 * to disk. This script flags exactly that — phantom ledger entries — and,
 * in the other direction, batch files on disk with no matching ledger row.
 *
 * Usage:
 *   tsx scripts/validate-ledger-consistency.mts [scope-folder]
 *
 * With no argument, scopes to the whole content/manual-questions tree.
 */

import fs from "node:fs";
import path from "node:path";
import { parseBatchLog } from "./lib/batch-log";
import { expectedBatchPath, splitProgrammeAndBatch } from "./lib/programme-quotas";

const repoRoot = process.cwd();
const scopeArg = process.argv[2];
const scopeDir = scopeArg ? path.resolve(scopeArg) : path.join(repoRoot, "content/manual-questions");

const rows = parseBatchLog(repoRoot);
const ledgerEvents = rows.filter((r) => r.event === "generated" || r.event === "audited");
const promotedBatches = new Set(rows.filter((r) => r.event === "promoted").map((r) => r.batch));

const violations: string[] = [];

/* --- Direction 1: every ledger generated/audited row must have a real file ---
 * A `promoted` row means the staging file was deliberately moved to
 * `_promoted/<batch>.json` — that is expected, not phantom, so promoted
 * batches are checked against _promoted/ instead of the staging path. */
const uniqueBatches = [...new Set(ledgerEvents.map((r) => r.batch))];
for (const batchIdentifier of uniqueBatches) {
  const split = splitProgrammeAndBatch(batchIdentifier);
  if (!split) {
    violations.push(`Ledger references '${batchIdentifier}', which doesn't match '<programme>-bNN' — cannot locate a file for it.`);
    continue;
  }
  const isPromoted = promotedBatches.has(batchIdentifier);
  const stagingRelPath = expectedBatchPath(split.programme, split.batch);
  if (!stagingRelPath) {
    violations.push(`Ledger batch '${batchIdentifier}' has an unrecognised programme slug '${split.programme}'.`);
    continue;
  }
  const promotedRelPath = `content/manual-questions/_promoted/${batchIdentifier}.json`;
  const stagingAbsPath = path.join(repoRoot, stagingRelPath);
  const promotedAbsPath = path.join(repoRoot, promotedRelPath);
  if (!stagingAbsPath.startsWith(scopeDir) && !promotedAbsPath.startsWith(scopeDir)) continue; // out of scope
  const events = ledgerEvents.filter((r) => r.batch === batchIdentifier).map((r) => `${r.event}:${r.model}`);
  const existsInStaging = fs.existsSync(stagingAbsPath);
  const existsAsPromoted = isPromoted && fs.existsSync(promotedAbsPath);
  if (!existsInStaging && !existsAsPromoted) {
    const expectedDescription = isPromoted
      ? `${stagingRelPath} (staging) nor ${promotedRelPath} (promoted)`
      : stagingRelPath;
    violations.push(
      `PHANTOM LEDGER ENTRY: BATCH-LOG.md records [${events.join(", ")}] for '${batchIdentifier}' but neither exists — expected ${expectedDescription}.`,
    );
  }
}

/* --- Direction 2: every real batch file should have at least a 'generated' row --- */
function walkBatchFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkBatchFiles(full));
    } else if (/-b\d{2}\.json$/.test(entry.name) && !entry.name.includes("PLACEHOLDER")) {
      out.push(full);
    }
  }
  return out;
}

const generatedBatchNames = new Set(ledgerEvents.filter((r) => r.event === "generated").map((r) => r.batch));
const filesOnDisk = walkBatchFiles(scopeDir);
for (const filePath of filesOnDisk) {
  const basename = path.basename(filePath, ".json");
  if (!generatedBatchNames.has(basename)) {
    violations.push(
      `ORPHAN FILE: ${path.relative(repoRoot, filePath)} exists on disk but BATCH-LOG.md has no 'generated' row for '${basename}'.`,
    );
  }
}

console.log(`Ledger consistency check — scope: ${path.relative(repoRoot, scopeDir) || "."}`);
console.log(`Ledger rows parsed: ${rows.length}; generated/audited events: ${ledgerEvents.length}; files on disk in scope: ${filesOnDisk.length}.`);

if (violations.length === 0) {
  console.log("\nPASS — every in-scope ledger row has a matching file and every in-scope file has a ledger row.");
} else {
  console.log(`\nFAIL — ${violations.length} inconsistenc(y/ies):`);
  for (const v of violations) console.log(`  - ${v}`);
}

if (violations.length > 0) process.exitCode = 1;
