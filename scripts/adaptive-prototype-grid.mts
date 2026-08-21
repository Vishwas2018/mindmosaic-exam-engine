/**
 * `npm run adaptive:grid` — the evidence run behind
 * `docs/adr/007-fixed-path-vs-adaptive-mst-delivery.md`'s recommendation for
 * items-per-stage, the two routing thresholds, and banded-vs-numeric
 * provisional ability (strategy doc §16 / spec §24's three open questions).
 *
 * READ-ONLY exploration. Drives `src/features/adaptive-prototype/` — the
 * spike, unchanged in shape — across a grid of parameters and simulated
 * student abilities, against the real compiled bank. Writes nothing to
 * content/ or supabase/; the only output is this process's stdout and the
 * gitignored `scripts/out/adaptive-grid-report.json`.
 *
 * Two phases:
 *
 *   A. DEGRADATION CENSUS — every real (family, year, subject) cohort at
 *      years already serving gated content (Y3/Y5 today), at a few
 *      items-per-stage sizes, measuring how often a stage's requested band
 *      is too thin to fill and deriving the per-band minimum depth a cell
 *      needs to never degrade in a single sitting.
 *
 *   B. PARAMETER GRID — three representative cohorts (one deep, one
 *      balanced, one thin-at-the-top) x every (items-per-stage, thresholds,
 *      ability model) combination x a spread of simulated ability levels x
 *      repeated trials, measuring DISCRIMINATION (does the router's final
 *      band agree with what the student's true ability implies under the
 *      same thresholds) and its SENSITIVITY to each parameter.
 */

/* Must precede every other import: @/server/exam-bank is `server-only`. */
import "./lib/allow-server-only.mts";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  probabilisticStrategy,
  routeBand,
  runAdaptiveSession,
  type AbilityModel,
  type ContentScope,
  type DifficultyBand,
  type RoutingThresholds,
} from "@/features/adaptive-prototype";
import { filterEligibleQuestions, ISOLABLE_SUBJECT_FILTERS, REGISTRY_SUBJECT_BY_FILTER } from "@/features/exam-engine/selection";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";
import { isSubjectSatIn } from "@/features/taxonomy/subject-registry";
import { getExamBank } from "@/server/exam-bank";

const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT_DIR = path.join(REPO_ROOT, "scripts", "out");
const OUT_FILE = path.join(OUT_DIR, "adaptive-grid-report.json");

const BANDS: readonly DifficultyBand[] = ["easy", "medium", "challenging"];
const bank = getExamBank("published");

/* ------------------------------------------------------------------ */
/* Cohort universe: every real (family, year, subject) at a year        */
/* already serving gated content -- the same "cohorts that have         */
/* content" scoping scripts/capacity-report.mts's near-term view uses.  */
/* ------------------------------------------------------------------ */

function realCohorts(): ContentScope[] {
  const cohorts: ContentScope[] = [];
  for (const examStyle of ["naplan_style", "icas_style"] as const) {
    for (const yearLevel of yearLevelsWithGatedCoverage()) {
      for (const subject of ISOLABLE_SUBJECT_FILTERS) {
        if (isSubjectSatIn(REGISTRY_SUBJECT_BY_FILTER[subject], examStyle, yearLevel)) {
          cohorts.push({ examStyle, yearLevel, subject });
        }
      }
    }
  }
  return cohorts;
}

function scopeLabel(scope: ContentScope): string {
  return `${scope.examStyle} Y${scope.yearLevel} ${scope.subject}`;
}

function bandDepth(scope: ContentScope): Record<DifficultyBand, number> {
  const eligible = filterEligibleQuestions(bank, scope);
  const depth = { easy: 0, medium: 0, challenging: 0 } as Record<DifficultyBand, number>;
  for (const question of eligible) depth[question.metadata.difficulty] += 1;
  return depth;
}

const COHORTS = realCohorts();

/* ------------------------------------------------------------------ */
/* Grid parameters                                                      */
/* ------------------------------------------------------------------ */

const ITEMS_PER_STAGE_VALUES = [4, 6, 8] as const;

const THRESHOLD_SETS: readonly { label: string; thresholds: RoutingThresholds }[] = [
  { label: "narrow(.45/.55)", thresholds: { routeDownAt: 0.45, routeUpAt: 0.55 } },
  { label: "default(.4/.6)", thresholds: { routeDownAt: 0.4, routeUpAt: 0.6 } },
  { label: "wide(.3/.7)", thresholds: { routeDownAt: 0.3, routeUpAt: 0.7 } },
];

/* A spread of constant-ability simulated students, not just strong/weak/mixed. */
const ABILITY_LEVELS = [0.9, 0.7, 0.5, 0.3, 0.1] as const;
const TRIALS_PER_LEVEL = 10;
const ABILITY_MODELS: readonly AbilityModel[] = ["numeric", "banded"];

/* Three representative cohorts spanning deep / balanced / thin-at-the-top
   content, per the census in docs/adaptive-testlet-strategy.md §6 and
   scripts/capacity-report.mts's own output. */
const REPRESENTATIVE_COHORTS: ContentScope[] = [
  { examStyle: "naplan_style", yearLevel: 3, subject: "numeracy" }, // deep: 77/35/16
  { examStyle: "icas_style", yearLevel: 3, subject: "numeracy" }, // balanced: 32/45/24
  { examStyle: "naplan_style", yearLevel: 5, subject: "numeracy" }, // thin challenging: 36/52/3
];

/* ------------------------------------------------------------------ */
/* Phase A -- degradation census                                        */
/* ------------------------------------------------------------------ */

interface DegradationRow {
  readonly cohort: string;
  readonly itemsPerStage: number;
  readonly stageInstances: number;
  readonly degradedInstances: number;
  readonly degradedByBand: Record<DifficultyBand, number>;
  readonly actualDepth: Record<DifficultyBand, number>;
  readonly worstCaseDepthNeeded: Record<DifficultyBand, number>;
  readonly meetsWorstCase: Record<DifficultyBand, boolean>;
}

function worstCaseDepth(itemsPerStage: number): Record<DifficultyBand, number> {
  /* Stage 1 always draws `itemsPerStage` from medium. Stage 2 and Stage 3
     can each independently land on any band -- so the worst single sitting
     draws a band twice (easy/challenging, only reachable by stage 2/3) or
     three times (medium, reachable by all three stages), never repeating an
     item (the simulator's own exclusion tracking). */
  return { easy: 2 * itemsPerStage, medium: 3 * itemsPerStage, challenging: 2 * itemsPerStage };
}

function runDegradationCensus(): { rows: DegradationRow[]; maxObservedDraw: Record<DifficultyBand, number> } {
  const rows: DegradationRow[] = [];
  const maxObservedDraw: Record<DifficultyBand, number> = { easy: 0, medium: 0, challenging: 0 };
  const degradationAbilities = [0.9, 0.5, 0.1];
  const degradationTrials = 5;
  const thresholds = THRESHOLD_SETS[1]!.thresholds; // default

  for (const cohort of COHORTS) {
    const depth = bandDepth(cohort);
    for (const itemsPerStage of ITEMS_PER_STAGE_VALUES) {
      let stageInstances = 0;
      let degradedInstances = 0;
      const degradedByBand: Record<DifficultyBand, number> = { easy: 0, medium: 0, challenging: 0 };

      for (const ability of degradationAbilities) {
        for (let trial = 0; trial < degradationTrials; trial += 1) {
          const seed = `census:${scopeLabel(cohort)}:${itemsPerStage}:${ability}:${trial}`;
          const result = runAdaptiveSession(bank, {
            scope: cohort,
            itemsPerStage,
            thresholds,
            seed,
            answerStrategy: probabilisticStrategy(ability, seed),
          });
          const drawnThisSession: Record<DifficultyBand, number> = { easy: 0, medium: 0, challenging: 0 };
          for (const stage of result.stages) {
            stageInstances += 1;
            drawnThisSession[stage.band] += stage.served.length;
            if (stage.degraded) {
              degradedInstances += 1;
              degradedByBand[stage.band] += 1;
            }
          }
          for (const band of BANDS) {
            maxObservedDraw[band] = Math.max(maxObservedDraw[band], drawnThisSession[band]);
          }
        }
      }

      const worstCase = worstCaseDepth(itemsPerStage);
      rows.push({
        cohort: scopeLabel(cohort),
        itemsPerStage,
        stageInstances,
        degradedInstances,
        degradedByBand,
        actualDepth: depth,
        worstCaseDepthNeeded: worstCase,
        meetsWorstCase: {
          easy: depth.easy >= worstCase.easy,
          medium: depth.medium >= worstCase.medium,
          challenging: depth.challenging >= worstCase.challenging,
        },
      });
    }
  }

  return { rows, maxObservedDraw };
}

/* ------------------------------------------------------------------ */
/* Phase B -- parameter grid: discrimination and sensitivity            */
/* ------------------------------------------------------------------ */

interface GridCell {
  readonly cohort: string;
  readonly itemsPerStage: number;
  readonly thresholdLabel: string;
  readonly abilityModel: AbilityModel;
  /** Per ability level, the fraction of trials whose final band matched routeBand(ability, thresholds). */
  readonly agreementByAbility: Record<string, number>;
  readonly meanAgreement: number;
  readonly minAgreement: number;
  readonly degradedFraction: number;
}

function runParameterGrid(): GridCell[] {
  const cells: GridCell[] = [];

  for (const cohort of REPRESENTATIVE_COHORTS) {
    for (const itemsPerStage of ITEMS_PER_STAGE_VALUES) {
      for (const { label: thresholdLabel, thresholds } of THRESHOLD_SETS) {
        for (const abilityModel of ABILITY_MODELS) {
          const agreementByAbility: Record<string, number> = {};
          let stageInstances = 0;
          let degradedInstances = 0;

          for (const ability of ABILITY_LEVELS) {
            const expectedBand = routeBand(ability, thresholds);
            let agree = 0;
            for (let trial = 0; trial < TRIALS_PER_LEVEL; trial += 1) {
              const seed = `grid:${scopeLabel(cohort)}:${itemsPerStage}:${thresholdLabel}:${abilityModel}:${ability}:${trial}`;
              const result = runAdaptiveSession(bank, {
                scope: cohort,
                itemsPerStage,
                thresholds,
                seed,
                answerStrategy: probabilisticStrategy(ability, seed),
                abilityModel,
              });
              const finalStage = result.stages[result.stages.length - 1]!;
              if (finalStage.band === expectedBand) agree += 1;
              for (const stage of result.stages) {
                stageInstances += 1;
                if (stage.degraded) degradedInstances += 1;
              }
            }
            agreementByAbility[String(ability)] = agree / TRIALS_PER_LEVEL;
          }

          const agreements = Object.values(agreementByAbility);
          cells.push({
            cohort: scopeLabel(cohort),
            itemsPerStage,
            thresholdLabel,
            abilityModel,
            agreementByAbility,
            meanAgreement: agreements.reduce((sum, value) => sum + value, 0) / agreements.length,
            minAgreement: Math.min(...agreements),
            degradedFraction: degradedInstances / stageInstances,
          });
        }
      }
    }
  }

  return cells;
}

/* ------------------------------------------------------------------ */
/* Aggregation for the human summary                                    */
/* ------------------------------------------------------------------ */

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function summariseByItemsPerStage(cells: readonly GridCell[]): { itemsPerStage: number; meanAgreement: number }[] {
  return ITEMS_PER_STAGE_VALUES.map((itemsPerStage) => ({
    itemsPerStage,
    meanAgreement: mean(cells.filter((cell) => cell.itemsPerStage === itemsPerStage).map((cell) => cell.meanAgreement)),
  }));
}

function summariseByThreshold(cells: readonly GridCell[]): { thresholdLabel: string; meanAgreement: number }[] {
  return THRESHOLD_SETS.map(({ label }) => ({
    thresholdLabel: label,
    meanAgreement: mean(cells.filter((cell) => cell.thresholdLabel === label).map((cell) => cell.meanAgreement)),
  }));
}

function summariseByAbilityModel(cells: readonly GridCell[]): { abilityModel: AbilityModel; meanAgreement: number }[] {
  return ABILITY_MODELS.map((abilityModel) => ({
    abilityModel,
    meanAgreement: mean(cells.filter((cell) => cell.abilityModel === abilityModel).map((cell) => cell.meanAgreement)),
  }));
}

function thresholdSensitivityByItemsPerStage(cells: readonly GridCell[]): { itemsPerStage: number; range: number }[] {
  return ITEMS_PER_STAGE_VALUES.map((itemsPerStage) => {
    const values = THRESHOLD_SETS.map(({ label }) =>
      mean(
        cells
          .filter((cell) => cell.itemsPerStage === itemsPerStage && cell.thresholdLabel === label)
          .map((cell) => cell.meanAgreement),
      ),
    );
    return { itemsPerStage, range: Math.max(...values) - Math.min(...values) };
  });
}

/* ------------------------------------------------------------------ */
/* Print helpers                                                        */
/* ------------------------------------------------------------------ */

type Cell = string | number;

function heading(text: string): void {
  console.log(`\n${"=".repeat(90)}\n${text}\n${"=".repeat(90)}`);
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

function pct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/* ------------------------------------------------------------------ */
/* Run                                                                   */
/* ------------------------------------------------------------------ */

console.log("MindMosaic adaptive-routing grid — evidence run for ADR-007 (docs/adr/007-...)");
console.log(`Generated: ${new Date().toISOString()}`);
console.log(`Cohort universe: ${COHORTS.length} real (family, year, subject) cells at Y${[...yearLevelsWithGatedCoverage()].join("/Y")}`);

heading("PHASE A — degradation census (default thresholds, ability 0.9/0.5/0.1, 5 trials each)");
const { rows: degradationRows, maxObservedDraw } = runDegradationCensus();
table(
  ["cohort", "items/stage", "stage instances", "degraded", "degraded %", "meets worst-case depth"],
  degradationRows.map((row) => [
    row.cohort,
    row.itemsPerStage,
    row.stageInstances,
    row.degradedInstances,
    pct(row.degradedInstances / row.stageInstances),
    BANDS.every((band) => row.meetsWorstCase[band]) ? "yes" : `no (${BANDS.filter((b) => !row.meetsWorstCase[b]).join(",")})`,
  ]),
);

console.log("\n  Observed maximum single-sitting draw per band, across every Phase A session:");
table(
  ["band", "max observed draw"],
  BANDS.map((band) => [band, maxObservedDraw[band]]),
);

heading("PHASE B — parameter grid (discrimination = final-band agreement with true ability, over 10 trials)");
const gridCells = runParameterGrid();

console.log("\n  Mean discrimination by items-per-stage (averaged over thresholds, ability models, cohorts):");
table(
  ["items/stage", "mean agreement"],
  summariseByItemsPerStage(gridCells).map((row) => [row.itemsPerStage, pct(row.meanAgreement)]),
);

console.log("\n  Mean discrimination by threshold set:");
table(
  ["thresholds", "mean agreement"],
  summariseByThreshold(gridCells).map((row) => [row.thresholdLabel, pct(row.meanAgreement)]),
);

console.log("\n  Mean discrimination by ability model:");
table(
  ["ability model", "mean agreement"],
  summariseByAbilityModel(gridCells).map((row) => [row.abilityModel, pct(row.meanAgreement)]),
);

console.log("\n  Threshold sensitivity (range of mean agreement across the 3 threshold sets) by items-per-stage:");
table(
  ["items/stage", "range (max-min agreement across thresholds)"],
  thresholdSensitivityByItemsPerStage(gridCells).map((row) => [row.itemsPerStage, pct(row.range)]),
);

console.log("\n  Discrimination by ability level (numeric model, default thresholds, mean across the 3 representative cohorts):");
const defaultNumericCells = gridCells.filter((cell) => cell.abilityModel === "numeric" && cell.thresholdLabel === "default(.4/.6)");
table(
  ["items/stage", ...ABILITY_LEVELS.map((level) => `ability=${level}`)],
  ITEMS_PER_STAGE_VALUES.map((itemsPerStage) => [
    itemsPerStage,
    ...ABILITY_LEVELS.map((level) =>
      pct(mean(defaultNumericCells.filter((cell) => cell.itemsPerStage === itemsPerStage).map((cell) => cell.agreementByAbility[String(level)]!))),
    ),
  ]),
);

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(
  OUT_FILE,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      cohortUniverse: COHORTS.map(scopeLabel),
      itemsPerStageValues: ITEMS_PER_STAGE_VALUES,
      thresholdSets: THRESHOLD_SETS,
      abilityLevels: ABILITY_LEVELS,
      trialsPerLevel: TRIALS_PER_LEVEL,
      degradationCensus: degradationRows,
      maxObservedDraw,
      parameterGrid: gridCells,
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
console.log(`\nWrote ${path.relative(REPO_ROOT, OUT_FILE)}`);
