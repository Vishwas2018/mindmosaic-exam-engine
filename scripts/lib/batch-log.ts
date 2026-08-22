/**
 * Minimal parser for content/manual-questions/BATCH-LOG.md's append-only
 * markdown table. Shared by validate-audit-integrity.mts and
 * validate-ledger-consistency.mts so both read the ledger the same way.
 */

import fs from "node:fs";
import path from "node:path";

export interface BatchLogRow {
  date: string;
  batch: string;
  event: string;
  model: string;
  detail: string;
}

const ROW_PATTERN = /^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|\s*$/;

export function parseBatchLog(repoRoot: string): BatchLogRow[] {
  const logPath = path.join(repoRoot, "content/manual-questions/BATCH-LOG.md");
  const text = fs.readFileSync(logPath, "utf8");
  const rows: BatchLogRow[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = ROW_PATTERN.exec(line);
    if (!match) continue;
    const [, date, batch, event, model, detail] = match;
    rows.push({ date, batch: batch.trim(), event: event.trim(), model: model.trim(), detail: detail.trim() });
  }
  return rows;
}

export function rowsForBatch(rows: readonly BatchLogRow[], batchIdentifier: string): BatchLogRow[] {
  return rows.filter((r) => r.batch === batchIdentifier);
}
