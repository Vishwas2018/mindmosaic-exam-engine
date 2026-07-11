/**
 * Client bundle budget check.
 *
 * Builds the app, then measures the total JS a first visit to each route
 * actually downloads: every `/_next/static/chunks/*.js` referenced from
 * that route's prerendered HTML, summed from the real emitted file sizes.
 * This is what a browser fetches on a cold load, not an approximation —
 * shared framework/vendor chunks are naturally counted for every route
 * that references them, same as a real network waterfall.
 *
 * Turbopack production builds don't currently print a per-route
 * "First Load JS" table the way the webpack build did, so this script is
 * the project's replacement for that signal. Exits non-zero if any
 * route exceeds its budget.
 *
 * Update BUDGETS_KB deliberately, with a comment, if a route's bundle
 * legitimately needs to grow — this file is the enforcement mechanism,
 * docs/PHASE3_HARDENING.md is where the reasoning lives.
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const NEXT_DIR = join(ROOT, ".next");

/*
 * Budgets in KB, based on the measurements recorded in
 * docs/PHASE3_HARDENING.md after removing barrel-import bloat (routes no
 * longer pull in ExamConfigurator — and its production question-bank
 * import — just to reach a small formatting helper or ExamQuestion).
 * Each budget has headroom above the measured size for normal content
 * growth (more questions, more renderers) without every commit needing a
 * threshold bump; it is not headroom for reintroducing avoidable imports.
 */
const BUDGETS_KB: Record<string, number> = {
  "/": 1150,
  "/exam": 1100,
  "/results": 1100,
  "/showcase": 1100,
};

const ROUTE_HTML_FILES: Record<string, string> = {
  "/": "index.html",
  "/exam": "exam.html",
  "/results": "results.html",
  "/showcase": "showcase.html",
};

function build(): void {
  console.log("Building...");
  execSync("npx next build", { cwd: ROOT, stdio: "inherit" });
}

function measureRouteBytes(htmlFile: string): number {
  const htmlPath = join(NEXT_DIR, "server", "app", htmlFile);
  if (!existsSync(htmlPath)) {
    throw new Error(`Expected prerendered output at ${htmlPath} — did the build succeed?`);
  }
  const html = readFileSync(htmlPath, "utf8");
  const chunkPaths = new Set(
    [...html.matchAll(/\/_next\/static\/chunks\/[A-Za-z0-9_.-]+\.js/g)].map((m) => m[0]),
  );

  let totalBytes = 0;
  for (const chunkPath of chunkPaths) {
    const fileName = chunkPath.split("/").pop()!;
    const filePath = join(NEXT_DIR, "static", "chunks", fileName);
    if (existsSync(filePath)) {
      totalBytes += statSync(filePath).size;
    }
  }
  return totalBytes;
}

build();

console.log("\nRoute bundle sizes (total JS referenced by the prerendered HTML):\n");

let failed = false;
const rows: { route: string; kb: number; budgetKb: number; ok: boolean }[] = [];

for (const [route, htmlFile] of Object.entries(ROUTE_HTML_FILES)) {
  const bytes = measureRouteBytes(htmlFile);
  const kb = Math.round(bytes / 1024);
  const budgetKb = BUDGETS_KB[route];
  const ok = kb <= budgetKb;
  if (!ok) failed = true;
  rows.push({ route, kb, budgetKb, ok });
}

const routeWidth = Math.max(...rows.map((r) => r.route.length), "Route".length);
console.log(
  `${"Route".padEnd(routeWidth)}  ${"Size".padStart(8)}  ${"Budget".padStart(8)}  Status`,
);
for (const row of rows) {
  console.log(
    `${row.route.padEnd(routeWidth)}  ${`${row.kb} KB`.padStart(8)}  ${`${row.budgetKb} KB`.padStart(8)}  ${row.ok ? "OK" : "OVER BUDGET"}`,
  );
}

if (failed) {
  console.error(
    "\nOne or more routes exceeded their bundle budget. See docs/PHASE3_HARDENING.md " +
      "for the current baseline and how to investigate a regression (a new barrel import " +
      "pulling in the production question bank or another route's dependencies is the " +
      "most common cause).",
  );
  process.exit(1);
}

console.log("\nAll routes are within their bundle budget.");
