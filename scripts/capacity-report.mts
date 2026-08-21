/**
 * `npm run capacity:report` — spec §13.3's band-level capacity measurement.
 *
 * Phase 3 starts with this: a repeatable, authoritative count of
 * published-quality items per `family x programme x year x subject x band`
 * cell, over the same served/projected bank `scripts/audit-bank.mts` and
 * `docs/content-track-handoff.md`'s census treat as authoritative (gated,
 * rejected/quarantined excluded, promoted not double-counted). It reports
 * the GAP to a parameterised no-repeat target so the content track knows
 * which cells to fill next.
 *
 * What this deliberately is NOT: §13.3's full cell also names route, stage
 * and blueprint cell, and §13.4 describes a deterministic sitting-
 * construction simulator over all of it. Neither exists yet — there are no
 * adaptive routes/stages (ADR-007) and no Phase 3 blueprints (ADR-004,
 * ADR-006 §1) — so this script measures only the axes that are facts about
 * published content today. Building the simulator or blueprints is
 * explicitly out of scope here.
 *
 * Read-only: it never writes to content/ or supabase/, and it does not
 * connect to a database — the served bank is the compiled TypeScript
 * modules `@/server/exam-bank` serves from, content-identical to the
 * Supabase projection per ADR-002 Amendment A's shadow-compare requirement.
 */

/* Must precede every other import: capacity-report.ts reaches
   @/server/exam-bank, which is `server-only`. */
import "./lib/allow-server-only.mts";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildCapacityReport,
  DEFAULT_CAPACITY_REPORT_PARAMS,
  type CapacityCell,
  type CapacityReport,
} from "@/features/taxonomy/capacity-report";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = path.join(REPO_ROOT, "scripts", "out");
const OUT_FILE = path.join(OUT_DIR, "capacity-report.json");

/* ------------------------------------------------------------------ */
/* CLI flags                                                           */
/* ------------------------------------------------------------------ */

function flagValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function intFlag(name: string, fallback: number): number {
  const raw = flagValue(name);
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    console.error(`--${name} must be a positive integer, got "${raw}"`);
    process.exit(2);
  }
  return parsed;
}

const params = {
  sittings: intFlag("sittings", DEFAULT_CAPACITY_REPORT_PARAMS.sittings),
  itemsPerCellPerSitting: intFlag(
    "items-per-cell",
    DEFAULT_CAPACITY_REPORT_PARAMS.itemsPerCellPerSitting,
  ),
};

/* ------------------------------------------------------------------ */
/* Plain-text table rendering (scripts/audit-bank.mts's own pattern)   */
/* ------------------------------------------------------------------ */

type Cell = string | number;

function heading(text: string): void {
  console.log(`\n${"=".repeat(78)}\n${text}\n${"=".repeat(78)}`);
}

function table(headers: readonly string[], rows: readonly (readonly Cell[])[]): void {
  if (rows.length === 0) {
    console.log("  (none)");
    return;
  }
  const numeric = headers.map((_, column) => rows.every((row) => typeof row[column] === "number"));
  const rendered = rows.map((row) => row.map((cell) => String(cell)));
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rendered.map((row) => (row[column] ?? "").length)),
  );
  const line = (cells: readonly string[]): string =>
    "  " +
    cells
      .map((cell, column) => (numeric[column] ? cell.padStart(widths[column]!) : cell.padEnd(widths[column]!)))
      .join("  ")
      .trimEnd();

  console.log(line(headers));
  console.log("  " + widths.map((width) => "-".repeat(width)).join("  "));
  for (const row of rendered) console.log(line(row));
}

function cellRow(cell: CapacityCell): Cell[] {
  return [
    cell.family,
    cell.programme,
    cell.yearLevel,
    cell.subject,
    cell.band,
    cell.count,
    cell.requiredDepth,
    cell.gap,
    cell.ready ? "yes" : "no",
  ];
}

const CELL_HEADERS = [
  "family",
  "programme",
  "year",
  "subject",
  "band",
  "count",
  "target",
  "gap",
  "ready",
];

/* ------------------------------------------------------------------ */
/* Build, print, write                                                  */
/* ------------------------------------------------------------------ */

const report: CapacityReport = buildCapacityReport(params);
const generatedAt = new Date().toISOString();

console.log("MindMosaic capacity report (spec §13.3, band level)");
console.log(`Generated: ${generatedAt}`);
console.log(
  `Target: no repeat across ${report.params.sittings} sittings x ` +
    `${report.params.itemsPerCellPerSitting} item(s)/cell/sitting -> ` +
    `required depth ${report.params.requiredDepth} per cell`,
);

/*
 * Two views of the same ranked data. The full 200+-cell list (every real
 * sitting across Years 2-12) is dominated by years the product has never
 * authored a single question for — real per §13.3, but not this week's
 * content-track decision. The near-term view narrows to years already
 * serving gated content (yearLevelsWithGatedCoverage() — 3 and 5 today),
 * which is the list docs/content-track-handoff.md's census worked from and
 * the one actually actionable right now. The full list is always in the
 * JSON either way.
 */
const servedYears = new Set(yearLevelsWithGatedCoverage());
const nearTerm = report.cells.filter((cell) => servedYears.has(cell.yearLevel));

heading(
  `NEAR-TERM PRIORITY — cells at years already serving content (Y${[...servedYears].join(", Y")}), furthest gap first`,
);
table(CELL_HEADERS, nearTerm.map(cellRow));

const TOP_N = 40;
heading(`FULL RANKING — every real cell (Y2-12), furthest gap first (top ${TOP_N} of ${report.cells.length})`);
table(CELL_HEADERS, report.cells.slice(0, TOP_N).map(cellRow));
if (report.cells.length > TOP_N) {
  console.log(`  ... and ${report.cells.length - TOP_N} more — see ${path.relative(REPO_ROOT, OUT_FILE)}`);
}

heading("SUMMARY");
table(
  ["metric", "value"],
  [
    ["served bank size (getExamBank('published'))", report.summary.bankSize],
    ["items counted across all cells", report.summary.totalCountedItems],
    ["capacity cells (real sittings x 3 bands)", report.summary.totalCells],
    ["cells at or above target", report.summary.cellsReady],
    ["cells below target", report.summary.cellsWithGap],
    ["total items still needed across every cell", report.summary.totalGap],
  ],
);

console.log("");
console.log(
  "  Out of scope by design: 'writing' and 'critical_creative_thinking' carry\n" +
    "  published items but are not isolable exam subjects anywhere else in the\n" +
    "  platform (no ISOLABLE_SUBJECT_FILTERS entry), so they are not walked into\n" +
    "  a cell here either — see src/features/taxonomy/capacity-report.ts.",
);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify({ generatedAt, ...report }, null, 2) + "\n", "utf8");
console.log(`\nWrote ${path.relative(REPO_ROOT, OUT_FILE)}`);
