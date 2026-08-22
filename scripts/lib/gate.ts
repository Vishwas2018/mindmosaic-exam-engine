/**
 * Shared plumbing for the enforced promotion gate — content/factory tooling
 * only. `questions-gate.mts` (the `questions:gate` CLI) and
 * `promote-batch.mts` both call `runGate` so there is exactly one place that
 * decides what "all three validators pass" means; neither script re-derives
 * that logic independently.
 *
 * The three validators (`validate-batch.mts`, `validate-audit-integrity.mts`,
 * `validate-ledger-consistency.mts`) are top-level scripts that set
 * `process.exitCode` and print their own violations — they are spawned, not
 * imported, so their output reaches the terminal directly and their exit
 * code is the only thing this module reads.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseBatchLog } from "./batch-log";

export interface GateStep {
  readonly name: string;
  readonly ok: boolean;
}

export interface GateResult {
  readonly ok: boolean;
  readonly steps: readonly GateStep[];
}

function runValidator(repoRoot: string, scriptRelPath: string, args: readonly string[]): boolean {
  /* Invoked via the tsx CLI module directly (as verify-test-run.mts invokes
     vitest.mjs), not `npx tsx` — avoids a shell hop entirely, so there is no
     platform-dependent quoting to get wrong for argument paths. */
  const tsxCli = path.join(repoRoot, "node_modules", "tsx", "dist", "cli.mjs");
  const result = spawnSync(process.execPath, [tsxCli, scriptRelPath, ...args], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  return (result.status ?? 1) === 0;
}

export function isBatchFile(name: string): boolean {
  return /-b\d{2}\.json$/.test(name) && !name.endsWith(".audit.json") && !name.includes("PLACEHOLDER");
}

/** Recursively collects `<programme>-bNN.json` batch files under `rootDir`, skipping `_promoted/` and `_ready/`. */
export function discoverBatchFiles(rootDir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(rootDir)) return out;
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (entry.name === "_promoted" || entry.name === "_ready" || entry.name === "_conflicts") continue;
    const full = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      out.push(...discoverBatchFiles(full));
    } else if (isBatchFile(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Batch identifiers (`<programme>-bNN`) BATCH-LOG.md already records a
 * `promoted` row for. The gate's "pre-promotion set" excludes these — a
 * batch shipped before this gate existed is not re-litigated against a rule
 * introduced afterwards (see the visual-floor reinstatement); only batches
 * still awaiting promotion are in scope.
 */
export function promotedBatchIds(repoRoot: string): Set<string> {
  const rows = parseBatchLog(repoRoot);
  return new Set(rows.filter((r) => r.event === "promoted").map((r) => r.batch));
}

/** Filters out already-promoted batches (by ledger, not just `_promoted/` location) from a discovered file list. */
export function excludePromoted(files: readonly string[], repoRoot: string): string[] {
  const promoted = promotedBatchIds(repoRoot);
  return files.filter((file) => !promoted.has(path.basename(file, ".json")));
}

/**
 * Runs the three enforced gates over `targets` (batch files; may be empty)
 * and `ledgerScopeDir` (the folder `validate-ledger-consistency` is scoped
 * to). ALL THREE must exit zero for the gate to pass. This is the single
 * choke point promotion calls — see REVIEW-PIPELINE.md's "Promotion
 * requires questions:gate" section.
 */
export function runGate(repoRoot: string, targets: readonly string[], ledgerScopeDir: string): GateResult {
  const steps: GateStep[] = [];

  if (targets.length > 0) {
    steps.push({ name: "validate-batch", ok: runValidator(repoRoot, "scripts/validate-batch.mts", targets) });
    steps.push({
      name: "validate-audit-integrity",
      ok: runValidator(repoRoot, "scripts/validate-audit-integrity.mts", targets),
    });
  } else {
    console.log("(no batch files in scope for validate-batch / validate-audit-integrity)");
  }
  steps.push({
    name: "validate-ledger-consistency",
    ok: runValidator(repoRoot, "scripts/validate-ledger-consistency.mts", [ledgerScopeDir]),
  });

  return { ok: steps.every((s) => s.ok), steps };
}
