/**
 * `npm run adaptive:demo` — runs the adaptive-routing SPIKE
 * (`src/features/adaptive-prototype/`) against the real compiled bank and
 * prints the path: for each stage, the band chosen, the items served (and
 * their difficulty), whether each was answered correctly, and the running
 * score — so a strong run visibly climbs toward `challenging` and a weak
 * run visibly drops to `easy`.
 *
 * Engine logic only. Read-only: no database, no session, nothing written
 * anywhere except this process's own stdout.
 */

/* Must precede every other import: @/server/exam-bank is `server-only`. */
import "./lib/allow-server-only.mts";

import {
  allCorrectStrategy,
  allWrongStrategy,
  DEFAULT_ITEMS_PER_STAGE,
  DEFAULT_ROUTING_THRESHOLDS,
  mixedStrategy,
  runAdaptiveSession,
  type AdaptiveSessionResult,
  type AnswerStrategy,
  type ContentScope,
} from "@/features/adaptive-prototype";
import type { ExamStyle, YearLevel } from "@/schemas/question.schema";
import { getExamBank } from "@/server/exam-bank";

/* ------------------------------------------------------------------ */
/* CLI flags                                                           */
/* ------------------------------------------------------------------ */

function flagValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((entry) => entry.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function floatFlag(name: string, fallback: number): number {
  const raw = flagValue(name);
  if (raw === undefined) return fallback;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    console.error(`--${name} must be a number, got "${raw}"`);
    process.exit(2);
  }
  return parsed;
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

/* NAPLAN Y3 Numeracy has real depth across all three bands (77/35/16 per
   docs/adaptive-testlet-strategy.md §6 and scripts/capacity-report.mts),
   so the default demo shows real routing rather than immediate degrade. */
const scope: ContentScope = {
  examStyle: (flagValue("exam-style") as ExamStyle | undefined) ?? "naplan_style",
  yearLevel: (intFlag("year", 3) as YearLevel),
  subject: (flagValue("subject") as ContentScope["subject"] | undefined) ?? "numeracy",
};

const itemsPerStage = intFlag("items-per-stage", DEFAULT_ITEMS_PER_STAGE);
const thresholds = {
  routeUpAt: floatFlag("route-up", DEFAULT_ROUTING_THRESHOLDS.routeUpAt),
  routeDownAt: floatFlag("route-down", DEFAULT_ROUTING_THRESHOLDS.routeDownAt),
};

/* ------------------------------------------------------------------ */
/* Print helpers                                                       */
/* ------------------------------------------------------------------ */

function heading(text: string): void {
  console.log(`\n${"=".repeat(78)}\n${text}\n${"=".repeat(78)}`);
}

function printRun(label: string, result: AdaptiveSessionResult): void {
  heading(label);
  console.log(
    `  scope: ${result.scope.examStyle} Y${result.scope.yearLevel} ${result.scope.subject}  ` +
      `items/stage: ${result.itemsPerStage}  thresholds: up>=${result.thresholds.routeUpAt} down<=${result.thresholds.routeDownAt}`,
  );
  for (const stage of result.stages) {
    const difficulties = stage.served.map((item) => (item.correct ? "✓" : "✗") + item.difficulty[0]).join(" ");
    console.log(
      `\n  Stage ${stage.stage} — band: ${stage.band.padEnd(11)} ` +
        `served: ${stage.served.length}/${stage.requested}${stage.degraded ? "  ** DEGRADED (band too thin) **" : ""}`,
    );
    console.log(`    items: ${difficulties || "(none served)"}`);
    console.log(
      `    stage score: ${stage.stageCorrect}/${stage.served.length} = ${stage.stageScore.toFixed(2)}   ` +
        `running score: ${stage.runningCorrect}/${stage.runningTotal} = ${stage.runningScore.toFixed(2)}`,
    );
  }
  const path = result.stages.map((stage) => stage.band).join(" -> ");
  console.log(`\n  PATH: ${path}   FINAL SCORE: ${result.finalScore.toFixed(2)}`);
}

/* ------------------------------------------------------------------ */
/* Run                                                                  */
/* ------------------------------------------------------------------ */

const bank = getExamBank("published");

const runs: readonly { label: string; strategy: AnswerStrategy; seed: string }[] = [
  { label: "STRONG RUN (all correct) — expect the band to climb", strategy: allCorrectStrategy, seed: "demo-strong" },
  { label: "WEAK RUN (all wrong) — expect the band to drop", strategy: allWrongStrategy, seed: "demo-weak" },
  { label: "MIXED RUN (alternating) — expect it to settle on medium", strategy: mixedStrategy, seed: "demo-mixed" },
];

console.log("MindMosaic adaptive-routing prototype — SPIKE (src/features/adaptive-prototype/)");
console.log("Engine logic only. No DB, no session, no cohort wiring — see the spike README.");

for (const run of runs) {
  const result = runAdaptiveSession(bank, {
    scope,
    itemsPerStage,
    thresholds,
    seed: run.seed,
    answerStrategy: run.strategy,
  });
  printRun(run.label, result);
}

console.log("\nDone. Try a different cell: --exam-style=icas_style --year=5 --subject=science");
