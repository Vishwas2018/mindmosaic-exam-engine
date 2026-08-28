import { createHash } from "node:crypto";
import { canonicalQuestionRevisionSchema, type CanonicalQuestionRevision } from "./contracts";

export type ImportFormat = "json" | "ndjson" | "csv";
export interface ImportIssue { row: number; code: string; message: string }
export interface ImportReport { accepted: CanonicalQuestionRevision[]; issues: ImportIssue[]; sourceHash: string }

export function importCanonicalQuestions(raw: string, format: ImportFormat): ImportReport {
  const sourceHash = createHash("sha256").update(raw).digest("hex");
  const issues: ImportIssue[] = [];
  let records: unknown[] = [];
  try {
    if (format === "json") {
      const value: unknown = JSON.parse(raw);
      records = Array.isArray(value) ? value : [value];
    } else if (format === "ndjson") {
      records = raw.split(/\r?\n/).filter((line) => line.trim()).map((line) => JSON.parse(line));
    } else {
      records = parseCsv(raw, issues);
    }
  } catch (error) {
    return { accepted: [], issues: [{ row: 0, code: "source_parse_failed", message: error instanceof Error ? error.message : String(error) }], sourceHash };
  }
  const accepted: CanonicalQuestionRevision[] = [];
  records.forEach((record, index) => {
    const result = canonicalQuestionRevisionSchema.safeParse(record);
    if (result.success) accepted.push(result.data);
    else issues.push({ row: index + 1, code: "canonical_schema_failed", message: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ") });
  });
  return { accepted, issues, sourceHash };
}

function parseCsv(raw: string, issues: ImportIssue[]): unknown[] {
  const rows = raw.split(/\r?\n/).filter(Boolean).map(parseCsvRow);
  if (!rows.length) return [];
  const headers = rows[0];
  const required = ["canonical_json"];
  if (!required.every((name) => headers.includes(name))) {
    issues.push({ row: 1, code: "unsupported_csv_mapping", message: "CSV Phase 1 requires a canonical_json column; complex structures are not flattened or discarded." });
    return [];
  }
  const index = headers.indexOf("canonical_json");
  return rows.slice(1).map((row, rowIndex) => {
    try { return JSON.parse(row[index] ?? ""); }
    catch { issues.push({ row: rowIndex + 2, code: "invalid_canonical_json", message: "canonical_json is not valid JSON." }); return null; }
  }).filter((value) => value !== null);
}

function parseCsvRow(line: string): string[] {
  const cells: string[] = []; let value = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(value); value = ""; }
    else value += char;
  }
  cells.push(value); return cells;
}
