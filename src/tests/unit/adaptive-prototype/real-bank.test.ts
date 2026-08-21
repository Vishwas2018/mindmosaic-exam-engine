import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { allCorrectStrategy, allWrongStrategy, runAdaptiveSession, type ContentScope } from "@/features/adaptive-prototype";
import { getExamBank } from "@/server/exam-bank";

const BAND_ORDER = { easy: 0, medium: 1, challenging: 2 } as const;

/**
 * The same router, run over the REAL served bank rather than a synthetic
 * fixture — proving the prototype actually works against real content, not
 * just a controlled scenario. NAPLAN Y3 Numeracy is used because it has
 * real depth in all three bands (77/35/16 — docs/adaptive-testlet-
 * strategy.md §6), so this is a meaningful run rather than an immediate
 * degrade.
 */
describe("runAdaptiveSession against the real compiled bank", () => {
  const bank = getExamBank("published");
  const scope: ContentScope = { examStyle: "naplan_style", yearLevel: 3, subject: "numeracy" };
  const thresholds = { routeUpAt: 0.6, routeDownAt: 0.4 };

  it("a strong run ends at least as hard as it started", () => {
    const result = runAdaptiveSession(bank, {
      scope,
      itemsPerStage: 6,
      thresholds,
      seed: "real-strong",
      answerStrategy: allCorrectStrategy,
    });
    expect(result.stages[0]!.band).toBe("medium");
    expect(BAND_ORDER[result.stages[2]!.band]).toBeGreaterThanOrEqual(BAND_ORDER[result.stages[0]!.band]);
  });

  it("a weak run ends no harder than it started", () => {
    const result = runAdaptiveSession(bank, {
      scope,
      itemsPerStage: 6,
      thresholds,
      seed: "real-weak",
      answerStrategy: allWrongStrategy,
    });
    expect(BAND_ORDER[result.stages[2]!.band]).toBeLessThanOrEqual(BAND_ORDER[result.stages[0]!.band]);
  });

  it("every served item genuinely belongs to its stage's routed band", () => {
    const result = runAdaptiveSession(bank, {
      scope,
      itemsPerStage: 6,
      thresholds,
      seed: "real-band-check",
      answerStrategy: allCorrectStrategy,
    });
    for (const stage of result.stages) {
      for (const item of stage.served) expect(item.difficulty).toBe(stage.band);
    }
  });

  it("no item is served twice across the whole session", () => {
    const result = runAdaptiveSession(bank, {
      scope,
      itemsPerStage: 6,
      thresholds,
      seed: "real-no-dup",
      answerStrategy: allCorrectStrategy,
    });
    const ids = result.stages.flatMap((stage) => stage.served.map((item) => item.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
