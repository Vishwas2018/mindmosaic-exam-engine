/**
 * `npm run capacity:route-report` — spec §13.3-§13.4's route-level capacity
 * simulator, extending `scripts/capacity-report.mts`'s band-level measurement
 * to ADR-007's accepted 3-stage MST (`itemsPerStage = 6`,
 * `routeDownAt/routeUpAt = 0.4/0.6`, numeric provisional ability).
 *
 * Enumerates every reachable band-path through the MST (derived from the
 * real routing function, not a hand-picked cross product — see
 * `enumerateReachableRoutes`), then for every real `(family, year, subject)`
 * cohort attempts to construct sittings 1, 2, 3, ... for EACH route
 * independently against that cohort's real eligible bank, respecting
 * `itemsPerStage`-sized draws and item-identity exposure that never repeats
 * within a sitting or across sittings, until a route either degrades or
 * reaches the search bound. A cohort is "adaptive-ready at N" only when
 * EVERY reachable route reaches N sittings clean (spec §13.4: "A cohort is
 * adaptive-ready only when every reachable route passes").
 *
 * Read-only, no DB, no schema change, cohort untouched: this only reads the
 * served/projected bank the same way `capacity-report.mts` does.
 */

/* Must precede every other import: route-capacity.ts reaches
   @/server/exam-bank, which is `server-only`. */
import "./lib/allow-server-only.mts";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";
import {
  buildRouteCapacityReport,
  DEFAULT_ROUTE_CAPACITY_PARAMS,
  type CohortRouteCapacity,
  type RouteCapacityReport,
} from "@/features/taxonomy/route-capacity";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = path.join(REPO_ROOT, "scripts", "out");
const OUT_FILE = path.join(OUT_DIR, "route-capacity-report.json");

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

const sittings = intFlag("sittings", DEFAULT_ROUTE_CAPACITY_PARAMS.sittings);
const searchCap = intFlag("search-cap", DEFAULT_ROUTE_CAPACITY_PARAMS.searchCap);

/* ------------------------------------------------------------------ */
/* Plain-text table rendering (scripts/capacity-report.mts's own pattern) */
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

function cohortRow(cohort: CohortRouteCapacity): Cell[] {
  return [
    cohort.family,
    cohort.programme,
    cohort.yearLevel,
    cohort.subject,
    cohort.capped ? `>=${cohort.maxNonDegradingSittings}` : cohort.maxNonDegradingSittings,
    cohort.readyAtN ? "yes" : "no",
    cohort.bindingRoute?.label ?? "(none within cap)",
    cohort.bindingBand ?? "-",
  ];
}

const COHORT_HEADERS = [
  "family",
  "programme",
  "year",
  "subject",
  "max clean N",
  `ready@${sittings}`,
  "binding route",
  "binding band",
];

/* ------------------------------------------------------------------ */
/* Build, print, write                                                  */
/* ------------------------------------------------------------------ */

const report: RouteCapacityReport = buildRouteCapacityReport({
  ...DEFAULT_ROUTE_CAPACITY_PARAMS,
  sittings,
  searchCap,
});
const generatedAt = new Date().toISOString();

console.log("MindMosaic route-level capacity report (spec §13.3-§13.4, ADR-007 MST)");
console.log(`Generated: ${generatedAt}`);
console.log(
  `MST: itemsPerStage=${report.params.itemsPerStage}, thresholds=${report.params.thresholds.routeDownAt}/${report.params.thresholds.routeUpAt} ` +
    `(ADR-007 §1-2), ${report.reachableRoutes.length} reachable route(s) (Stage 1 always medium)`,
);
console.log(
  `Target: N=${sittings} consecutive sitting(s), searched up to ${report.params.searchCap} before capping ` +
    `("at least this many" beyond that point).`,
);

heading("REACHABLE ROUTES (derived from the real numeric router, not asserted)");
table(
  ["stage1", "stage2", "stage3", "label"],
  report.reachableRoutes.map((route) => ["medium", route.stage2Band, route.stage3Band, route.label]),
);

/*
 * Same near-term/full split as capacity-report.mts: years already serving
 * gated content (3, 5 today) are what the content track can act on now; the
 * full Y2-12 ranking is always in the JSON.
 */
const servedYears = new Set(yearLevelsWithGatedCoverage());
const nearTerm = report.cohorts.filter((cohort) => servedYears.has(cohort.yearLevel));

heading(
  `NEAR-TERM PRIORITY — cohorts at years already serving content (Y${[...servedYears].join(", Y")}), lowest max-N first`,
);
table(COHORT_HEADERS, nearTerm.map(cohortRow));

const TOP_N = 40;
heading(`FULL RANKING — every real cohort (Y2-12), lowest max-N first (top ${TOP_N} of ${report.cohorts.length})`);
table(COHORT_HEADERS, report.cohorts.slice(0, TOP_N).map(cohortRow));
if (report.cohorts.length > TOP_N) {
  console.log(`  ... and ${report.cohorts.length - TOP_N} more — see ${path.relative(REPO_ROOT, OUT_FILE)}`);
}

heading("SUMMARY");
table(
  ["metric", "value"],
  [
    ["served bank size (getExamBank('published'))", report.summary.bankSize],
    ["cohorts (real (family, year, subject) triples)", report.summary.totalCohorts],
    [`cohorts ready at N=${sittings}`, report.summary.readyAtN],
    [`cohorts NOT ready at N=${sittings}`, report.summary.notReadyAtN],
  ],
);

console.log("");
console.log(
  "  Exposure tracked at item identity only (spec §13.1's other keys — stimulus,\n" +
    "  item-family, enemy-set — are not yet implemented anywhere in this codebase,\n" +
    "  same scope boundary as src/features/adaptive-prototype/item-pool.ts).\n" +
    "  Forms/form-versions (spec §10.4) and the Phase 4 production engine are not\n" +
    "  built by this report — see docs/adr/007-fixed-path-vs-adaptive-mst-delivery.md.",
);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify({ generatedAt, ...report }, null, 2) + "\n", "utf8");
console.log(`\nWrote ${path.relative(REPO_ROOT, OUT_FILE)}`);
