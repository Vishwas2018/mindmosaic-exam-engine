import { describe, expect, it } from "vitest";

import {
  allCorrectStrategy,
  allWrongStrategy,
  mixedStrategy,
  runAdaptiveSession,
  type AdaptiveSessionParams,
  type ContentScope,
} from "@/features/adaptive-prototype";

import { buildBand } from "./fixtures";

const SCOPE: ContentScope = { examStyle: "naplan_style", yearLevel: 5, subject: "numeracy" };
const THRESHOLDS = { routeUpAt: 0.6, routeDownAt: 0.4 };

function fullBank() {
  return [
    ...buildBand("e", 20, { ...SCOPE, difficulty: "easy" }),
    ...buildBand("m", 20, { ...SCOPE, difficulty: "medium" }),
    ...buildBand("c", 20, { ...SCOPE, difficulty: "challenging" }),
  ];
}

function paramsFor(
  answerStrategy: AdaptiveSessionParams["answerStrategy"],
  seed: string,
): AdaptiveSessionParams {
  return { scope: SCOPE, itemsPerStage: 6, thresholds: THRESHOLDS, seed, answerStrategy };
}

/**
 * Drives the 3-stage MST router (`docs/adaptive-testlet-strategy.md` D1)
 * with scripted mock students, over a synthetic bank with deep, controlled
 * pools per band (so degrade/exhaustion cases can be tested deliberately in
 * their own cases below, not accidentally here).
 */
describe("runAdaptiveSession", () => {
  it("stage 1 is always medium-anchored, regardless of the answer strategy", () => {
    for (const strategy of [allCorrectStrategy, allWrongStrategy, mixedStrategy]) {
      const result = runAdaptiveSession(fullBank(), paramsFor(strategy, "anchor"));
      expect(result.stages[0]!.band).toBe("medium");
    }
  });

  it("a strong run (all correct) climbs: medium -> challenging -> challenging", () => {
    const result = runAdaptiveSession(fullBank(), paramsFor(allCorrectStrategy, "strong"));
    expect(result.stages.map((stage) => stage.band)).toEqual(["medium", "challenging", "challenging"]);
    expect(result.finalScore).toBe(1);
  });

  it("a weak run (all wrong) drops: medium -> easy -> easy", () => {
    const result = runAdaptiveSession(fullBank(), paramsFor(allWrongStrategy, "weak"));
    expect(result.stages.map((stage) => stage.band)).toEqual(["medium", "easy", "easy"]);
    expect(result.finalScore).toBe(0);
  });

  it("a 50/50 mixed run with an even items-per-stage settles on medium throughout", () => {
    const result = runAdaptiveSession(fullBank(), paramsFor(mixedStrategy, "mixed"));
    expect(result.stages.map((stage) => stage.band)).toEqual(["medium", "medium", "medium"]);
    expect(result.finalScore).toBe(0.5);
  });

  it("never serves the same item twice across the session, even when two stages route to the same band", () => {
    /* The strong run above lands on "challenging" for both stage 2 and 3 —
       exactly the case that would double-serve an item without exclusion
       tracking. */
    const result = runAdaptiveSession(fullBank(), paramsFor(allCorrectStrategy, "no-dup"));
    const allIds = result.stages.flatMap((stage) => stage.served.map((item) => item.id));
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it("accumulates the running score across stages rather than resetting it", () => {
    const result = runAdaptiveSession(fullBank(), paramsFor(allCorrectStrategy, "running"));
    expect(result.stages[0]).toMatchObject({ runningCorrect: 6, runningTotal: 6, runningScore: 1 });
    expect(result.stages[1]).toMatchObject({ runningCorrect: 12, runningTotal: 12, runningScore: 1 });
    expect(result.stages[2]).toMatchObject({ runningCorrect: 18, runningTotal: 18, runningScore: 1 });
  });

  it("flags degraded when the routed band cannot fill the stage, and a later empty stage does not move the running score", () => {
    const thinBank = [
      ...buildBand("m", 6, { ...SCOPE, difficulty: "medium" }),
      /* Only 2 challenging items exist; stage 2 (routed to challenging by an
         all-correct run) will exhaust the pool, leaving nothing for stage 3
         if it also routes to challenging. */
      ...buildBand("c", 2, { ...SCOPE, difficulty: "challenging" }),
    ];
    const result = runAdaptiveSession(thinBank, paramsFor(allCorrectStrategy, "thin"));

    expect(result.stages[1]).toMatchObject({ band: "challenging", degraded: true });
    expect(result.stages[1]!.served).toHaveLength(2);

    expect(result.stages[2]).toMatchObject({ band: "challenging", degraded: true });
    expect(result.stages[2]!.served).toHaveLength(0);
    /* An empty stage contributes nothing — the running score after stage 3
       equals the running score after stage 2, not something skewed by a 0. */
    expect(result.stages[2]!.runningScore).toBe(result.stages[1]!.runningScore);
    expect(result.stages[2]!.runningTotal).toBe(result.stages[1]!.runningTotal);
  });

  it("reports the params it actually ran with, unchanged", () => {
    const params = paramsFor(allCorrectStrategy, "echo");
    const result = runAdaptiveSession(fullBank(), params);
    expect(result.scope).toEqual(SCOPE);
    expect(result.itemsPerStage).toBe(6);
    expect(result.thresholds).toEqual(THRESHOLDS);
    expect(result.seed).toBe("echo");
  });

  it("defaults abilityModel to 'numeric' and echoes back whichever model actually ran", () => {
    const numeric = runAdaptiveSession(fullBank(), paramsFor(allCorrectStrategy, "default-model"));
    expect(numeric.abilityModel).toBe("numeric");

    const banded = runAdaptiveSession(fullBank(), {
      ...paramsFor(allCorrectStrategy, "explicit-banded"),
      abilityModel: "banded",
    });
    expect(banded.abilityModel).toBe("banded");
  });
});

/**
 * §16 / spec §24's "banded vs numeric provisional ability" question, made
 * concrete: the two models can disagree, and this is the shape of when they
 * do. Both always agree on Stage 2 (there is only one data point — Stage 1's
 * own score — so "cumulative so far" and "just the last stage" are the same
 * number). They can diverge on Stage 3: numeric averages Stage 1 and Stage 2
 * together; banded reacts only to Stage 2's own, most recent, performance.
 */
describe("banded vs numeric ability models diverge on a recent-performance-drop", () => {
  const scope: ContentScope = { examStyle: "naplan_style", yearLevel: 5, subject: "numeracy" };
  const thresholds = { routeUpAt: 0.6, routeDownAt: 0.4 };
  const bank = [
    ...buildBand("e", 20, { ...scope, difficulty: "easy" }),
    ...buildBand("m", 20, { ...scope, difficulty: "medium" }),
    ...buildBand("c", 20, { ...scope, difficulty: "challenging" }),
  ];
  /* Perfect in stage 1 (routes stage 2 to challenging, both models — they
     cannot yet disagree). Then only 2/6 correct in stage 2. */
  const strongThenSlips: AdaptiveSessionParams["answerStrategy"] = (stageNumber, itemIndex) =>
    stageNumber === 1 ? true : stageNumber === 2 ? itemIndex < 2 : true;

  it("both models route stage 2 to challenging off stage 1's perfect score", () => {
    for (const abilityModel of ["numeric", "banded"] as const) {
      const result = runAdaptiveSession(bank, { scope, itemsPerStage: 6, thresholds, seed: "slip", answerStrategy: strongThenSlips, abilityModel });
      expect(result.stages[1]!.band).toBe("challenging");
    }
  });

  it("numeric keeps stage 3 at challenging — the strong stage 1 still buoys the cumulative average", () => {
    const result = runAdaptiveSession(bank, {
      scope,
      itemsPerStage: 6,
      thresholds,
      seed: "slip",
      answerStrategy: strongThenSlips,
      abilityModel: "numeric",
    });
    /* Cumulative after stage 1+2: (6 + 2) / 12 = 0.667 >= 0.6. */
    expect(result.stages[2]!.band).toBe("challenging");
  });

  it("banded drops stage 3 to medium — it reacts only to stage 2's own weak score", () => {
    const result = runAdaptiveSession(bank, {
      scope,
      itemsPerStage: 6,
      thresholds,
      seed: "slip",
      answerStrategy: strongThenSlips,
      abilityModel: "banded",
    });
    /* Stage 2's own score: 2 / 6 = 0.333 <= 0.4 -> steps down from challenging. */
    expect(result.stages[2]!.band).toBe("medium");
  });
});
