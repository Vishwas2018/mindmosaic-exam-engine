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
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { practiceExamBank } from "../src/content/questions/practice-bank";
import { questionBank } from "../src/content/questions/question-bank";

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
/*
 * Rebaselined for Phase 0 (2026-07-18): the Supabase auth client
 * (@supabase/supabase-js via AuthProvider in the root layout, ~256 KB
 * chunk) is now part of every route's first load, and the question bank
 * no longer ships in client JS at all (enforced by the sentinel check
 * below). Measured after the change: / 1223, /exam 1281, /results 1256,
 * /showcase 1272 KB.
 */
const BUDGETS_KB: Record<string, number> = {
  "/": 1350,
  "/exam": 1350,
  "/results": 1350,
  "/showcase": 1350,
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

/*
 * Server-only question bank guard (docs/ASSESSMENT_SECURITY_MODEL.md,
 * Phase 0 addendum): no client JS chunk may contain authored bank content.
 * Explanations are the strongest sentinel — they are stripped from every
 * CandidateQuestion and exist nowhere in legitimate client code, so any
 * hit means an answer-revealing bank module re-entered the client graph.
 * Minification mangles identifiers but string literals survive it.
 */
function bankSentinels(): string[] {
  const explanations = [...questionBank, ...practiceExamBank]
    .map((question) => question.explanation ?? "")
    // Quote/backslash-free substrings survive any JS string escaping.
    .filter((text) => text.length >= 24 && !/["'\\‘’“”]/.test(text))
    .map((text) => text.slice(0, 40));
  // A handful from each end of the combined banks is plenty to catch a
  // whole-module import without scanning for thousands of strings.
  return [...explanations.slice(0, 5), ...explanations.slice(-5)];
}

/*
 * Every server-to-client delivery channel a page render has: emitted JS
 * chunks, prerendered HTML (which embeds the RSC flight payload for
 * server-component props), and standalone .rsc payload files used for
 * client-side navigation. A JS-only scan once missed the bank riding to
 * every visitor as home-page props inside the RSC payload — hence all
 * three. The one sanctioned bank delivery is /api/exam/guest-bank (a
 * static route-handler .body, guest mode's documented trade-off), which
 * none of these extensions match.
 */
function clientPayloadFiles(): string[] {
  const files: string[] = [];
  const chunksDir = join(NEXT_DIR, "static", "chunks");
  for (const fileName of readdirSync(chunksDir)) {
    if (fileName.endsWith(".js")) files.push(join(chunksDir, fileName));
  }
  const appDir = join(NEXT_DIR, "server", "app");
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(html|rsc)$/.test(entry.name)) files.push(full);
    }
  };
  walk(appDir);
  return files;
}

function checkNoBankContentInClientPayloads(): void {
  const sentinels = bankSentinels();
  if (sentinels.length === 0) {
    throw new Error("No usable bank sentinels — check the sentinel filter.");
  }
  const leaks: string[] = [];
  for (const filePath of clientPayloadFiles()) {
    const contents = readFileSync(filePath, "utf8");
    if (sentinels.some((sentinel) => contents.includes(sentinel))) {
      leaks.push(filePath.slice(NEXT_DIR.length + 1));
    }
  }
  if (leaks.length > 0) {
    console.error(
      "\nQuestion bank content found in client payload(s): " +
        leaks.join(", ") +
        "\nThe authoring bank (answer keys included) must never reach a page " +
        "payload — JS chunk, prerendered HTML, or RSC flight data. Guests get " +
        "theirs from /api/exam/guest-bank only. " +
        "See docs/ASSESSMENT_SECURITY_MODEL.md.",
    );
    process.exit(1);
  }
  console.log(
    `\nServer-only bank check: no bank content in any client JS chunk, ` +
      `prerendered HTML, or RSC payload (${sentinels.length} sentinels).`,
  );
}

build();

checkNoBankContentInClientPayloads();

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
