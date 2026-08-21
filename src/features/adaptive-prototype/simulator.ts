import type { Question } from "@/schemas/question.schema";

import { selectStageItems } from "./item-pool";
import { routeBand, stepBand } from "./routing";
import type {
  AdaptiveSessionParams,
  AdaptiveSessionResult,
  DifficultyBand,
  StageItemOutcome,
  StageOutcome,
} from "./types";

/**
 * The 3-stage MST router from `docs/adaptive-testlet-strategy.md` D1, as a
 * pure function: given the REAL compiled bank and a mock student's answer
 * strategy, drives all three stages and returns the full path.
 *
 * Stage 1 is medium-anchored (D1: "Stage 1 has a fixed blueprint/
 * difficulty"). Stage 2 and Stage 3 each route off `params.abilityModel`
 * (default `"numeric"`): the cumulative running score across every prior
 * stage (`routeBand()`), or a Markov step off only the current band and the
 * just-completed stage's own local score (`stepBand()`) — §16's open
 * "banded vs numeric" question, both implemented so they can be compared
 * rather than one being assumed. Either way, an item served in an earlier
 * stage is never re-served in a later one, even if two stages land on the
 * same band.
 *
 * No DB, no session, no persistence — one in-memory pass, engine logic only.
 */
export function runAdaptiveSession(
  bank: readonly Question[],
  params: AdaptiveSessionParams,
): AdaptiveSessionResult {
  const { scope, itemsPerStage, thresholds, seed, answerStrategy } = params;
  const abilityModel = params.abilityModel ?? "numeric";
  const servedIds = new Set<string>();
  const stages: StageOutcome[] = [];
  let runningCorrect = 0;
  let runningTotal = 0;

  for (const stageNumber of [1, 2, 3] as const) {
    let band: DifficultyBand;
    if (stageNumber === 1) {
      band = "medium" as const;
    } else if (abilityModel === "banded") {
      const previous = stages[stages.length - 1]!;
      band = stepBand(previous.band, previous.stageScore, thresholds);
    } else {
      band = routeBand(runningTotal === 0 ? 0 : runningCorrect / runningTotal, thresholds);
    }

    const pool = selectStageItems(bank, scope, band, itemsPerStage, servedIds, `${seed}:stage${stageNumber}`);

    let stageCorrect = 0;
    const served: StageItemOutcome[] = pool.served.map((item, index) => {
      const correct = answerStrategy(stageNumber, index, item);
      if (correct) stageCorrect += 1;
      servedIds.add(item.id);
      return { id: item.id, difficulty: item.metadata.difficulty, correct };
    });

    runningCorrect += stageCorrect;
    runningTotal += served.length;

    stages.push({
      stage: stageNumber,
      band,
      requested: itemsPerStage,
      served,
      degraded: pool.degraded,
      stageCorrect,
      stageScore: served.length === 0 ? 0 : stageCorrect / served.length,
      runningCorrect,
      runningTotal,
      runningScore: runningTotal === 0 ? 0 : runningCorrect / runningTotal,
    });
  }

  return {
    scope,
    itemsPerStage,
    thresholds,
    seed,
    abilityModel,
    stages,
    finalScore: runningTotal === 0 ? 0 : runningCorrect / runningTotal,
  };
}
