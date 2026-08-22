/**
 * ENFORCED audit-integrity check — content/factory tooling only.
 *
 * An `.audit.json` sidecar is currently accepted as a pass-stamp on the
 * strength of a `verdict: "pass"` field alone, with empty
 * disagreements/ambiguous/equalOptions/keyExplanationMismatch/leakyVisuals
 * arrays as the only "evidence". That is indistinguishable from an auditor
 * that never actually re-solved anything. This script refuses to accept a
 * sidecar unless it carries independently-derived, per-question working:
 *
 *   1. A `perQuestionResolve` array with exactly one entry per question in
 *      the batch (same ID set), each with a non-empty `auditorAnswer` —
 *      the auditor's own blind re-solve, not a copy of the answerKey.
 *   2. `auditorModel` differs from the batch's generator (BATCH-LOG's
 *      `generated` row wins over batchMeta.generatedBy if they disagree,
 *      per REVIEW-PIPELINE.md).
 *   3. A batch the ledger marks `audited` must have an on-disk
 *      `.audit.json` sidecar at all.
 *   4. An all-empty-arrays "pass" with no perQuestionResolve is rejected
 *      outright as a stub, regardless of its verdict field.
 *
 * Usage:
 *   tsx scripts/validate-audit-integrity.mts <path-to-batch.json | programme-folder> [...more]
 */

import fs from "node:fs";
import path from "node:path";
import { parseBatchLog, rowsForBatch } from "./lib/batch-log";

interface AuditSidecar {
  batch?: unknown;
  auditorModel?: unknown;
  audited?: unknown;
  disagreements?: unknown;
  ambiguous?: unknown;
  equalOptions?: unknown;
  keyExplanationMismatch?: unknown;
  leakyVisuals?: unknown;
  verdict?: unknown;
  perQuestionResolve?: unknown;
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

const repoRoot = process.cwd();
const logRows = parseBatchLog(repoRoot);

function checkAuditIntegrity(batchFilePath: string): { file: string; violations: string[] } {
  const violations: string[] = [];
  const basename = path.basename(batchFilePath, ".json");
  const auditPath = batchFilePath.replace(/\.json$/, ".audit.json");

  let batchQuestionIds: string[] = [];
  let generatedByFromMeta: string | null = null;
  try {
    const batch = JSON.parse(fs.readFileSync(batchFilePath, "utf8")) as {
      questions?: { id?: unknown }[];
      batchMeta?: { generatedBy?: unknown };
    };
    batchQuestionIds = (batch.questions ?? [])
      .map((q) => q.id)
      .filter((id): id is string => typeof id === "string");
    if (batch.batchMeta && typeof batch.batchMeta.generatedBy === "string") {
      generatedByFromMeta = batch.batchMeta.generatedBy;
    }
  } catch (error) {
    violations.push(`Could not read batch file to cross-check questions: ${(error as Error).message}`);
  }

  const ledgerRows = rowsForBatch(logRows, basename);
  const generatedRow = ledgerRows.find((r) => r.event === "generated");
  const auditedRows = ledgerRows.filter((r) => r.event === "audited");
  const generatorModel = generatedRow?.model ?? generatedByFromMeta;

  const sidecarExists = fs.existsSync(auditPath);

  if (auditedRows.length > 0 && !sidecarExists) {
    violations.push(
      `BATCH-LOG.md records ${auditedRows.length} 'audited' row(s) for ${basename} but no ${path.basename(auditPath)} sidecar exists on disk.`,
    );
  }

  if (!sidecarExists) {
    if (auditedRows.length === 0) {
      violations.push(`No .audit.json sidecar found (${path.basename(auditPath)}) — batch is unaudited.`);
    }
    return { file: batchFilePath, violations };
  }

  let sidecar: AuditSidecar;
  try {
    sidecar = JSON.parse(fs.readFileSync(auditPath, "utf8")) as AuditSidecar;
  } catch (error) {
    violations.push(`Invalid JSON in ${path.basename(auditPath)}: ${(error as Error).message}`);
    return { file: batchFilePath, violations };
  }

  const auditorModel = typeof sidecar.auditorModel === "string" ? sidecar.auditorModel : null;
  if (!auditorModel) {
    violations.push(`Sidecar missing required 'auditorModel' field.`);
  } else if (generatorModel && auditorModel === generatorModel) {
    violations.push(
      `Auditor model '${auditorModel}' is the same as the generator model '${generatorModel}' — self-audit is not permitted.`,
    );
  } else if (!generatorModel) {
    violations.push(
      `Cannot confirm auditor independence — no 'generated' row for ${basename} in BATCH-LOG.md and no batchMeta.generatedBy.`,
    );
  }

  const verdict = typeof sidecar.verdict === "string" ? sidecar.verdict : null;
  if (!verdict || (verdict !== "pass" && verdict !== "reject")) {
    violations.push(`Sidecar missing or invalid 'verdict' (expected 'pass' or 'reject', got ${JSON.stringify(sidecar.verdict)}).`);
  }

  const flagArrays: [string, unknown][] = [
    ["disagreements", sidecar.disagreements],
    ["ambiguous", sidecar.ambiguous],
    ["equalOptions", sidecar.equalOptions],
    ["keyExplanationMismatch", sidecar.keyExplanationMismatch],
    ["leakyVisuals", sidecar.leakyVisuals],
  ];
  for (const [name, value] of flagArrays) {
    if (!Array.isArray(value)) {
      violations.push(`Sidecar field '${name}' must be an array (evidence container), found ${JSON.stringify(value)}.`);
    }
  }
  const allFlagsEmpty = flagArrays.every(([, value]) => Array.isArray(value) && value.length === 0);

  const perQuestionResolve = Array.isArray(sidecar.perQuestionResolve) ? sidecar.perQuestionResolve : null;

  if (!perQuestionResolve) {
    violations.push(
      `Sidecar carries no 'perQuestionResolve' array — no evidence of an independent per-question re-solve. ` +
        (allFlagsEmpty
          ? `All flag arrays are empty and verdict is '${verdict}': this is an unsubstantiated pass-stub, not an audit.`
          : `Flags exist but there is still no record of what the auditor independently derived for each question.`),
    );
  } else {
    const entries = perQuestionResolve as { id?: unknown; auditorAnswer?: unknown }[];
    const entryIds = entries.map((e) => (typeof e.id === "string" ? e.id : null)).filter((id): id is string => id !== null);
    const entryIdSet = new Set(entryIds);
    const batchIdSet = new Set(batchQuestionIds);

    if (entryIds.length !== entries.length) {
      violations.push(`perQuestionResolve has entries without a string 'id'.`);
    }
    if (entryIdSet.size !== entryIds.length) {
      violations.push(`perQuestionResolve has duplicate question IDs.`);
    }
    const missing = batchQuestionIds.filter((id) => !entryIdSet.has(id));
    const extra = entryIds.filter((id) => !batchIdSet.has(id));
    if (missing.length > 0) {
      violations.push(
        `perQuestionResolve is missing ${missing.length}/${batchQuestionIds.length} question(s): ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", ..." : ""}`,
      );
    }
    if (extra.length > 0) {
      violations.push(`perQuestionResolve references ${extra.length} ID(s) not in the batch: ${extra.slice(0, 10).join(", ")}`);
    }
    const blank = entries.filter(
      (e) => typeof e.auditorAnswer !== "string" && typeof e.auditorAnswer !== "number" && typeof e.auditorAnswer !== "boolean",
    );
    if (blank.length > 0) {
      violations.push(`${blank.length} perQuestionResolve entr(y/ies) have no usable 'auditorAnswer' value.`);
    }
  }

  return { file: batchFilePath, violations };
}

const inputs = process.argv.slice(2);
if (inputs.length === 0) {
  console.error("Usage: tsx scripts/validate-audit-integrity.mts <path-to-batch.json | programme-folder> [...more]");
  process.exit(1);
}

const targets = collectTargets(inputs);
const results = targets.map(checkAuditIntegrity);

for (const result of results) {
  const status = result.violations.length === 0 ? "PASS" : "FAIL";
  console.log(`\n[${status}] ${result.file}`);
  for (const v of result.violations) console.log(`  - ${v}`);
}

const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
console.log(
  `\n${results.length} batch(es) checked, ${results.filter((r) => r.violations.length > 0).length} failed audit-integrity, ${totalViolations} total violation(s).`,
);

if (totalViolations > 0) process.exitCode = 1;
