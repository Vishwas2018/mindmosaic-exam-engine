import { describe, expect, it } from "vitest";

import {
  FAMILY_BETA_YEAR_3_CONFIG,
  FAMILY_BETA_YEAR_5_CONFIG,
  loadFamilyBetaFixedPaperQuestions,
} from "@/server/family-beta-fixed-papers";
import { findingsForQuestion } from "@/server/family-beta-review-findings";

const ENABLED_ENV = { FAMILY_BETA_FIXED_PAPERS_PREVIEW: "enabled" } as const;

/**
 * These findings are what the human content review is handed, so they are
 * pinned: if a content change fixes one, removes one, or introduces a new one,
 * this test fails and the reviewer's list has to be re-agreed rather than
 * silently changing underneath them.
 *
 * Each expectation below was confirmed against the rendering code, not
 * inferred. NumberLineRenderer draws ticks at min + n x step while positioning
 * highlights by value, so an off-grid highlight really does render between
 * ticks.
 *
 * There is no chart-accessibility expectation here on purpose. An earlier
 * version of this file asserted six, on the belief that altText was a chart's
 * only accessible description. That held for just one of the three renderers:
 * LineGraphRenderer already lists every point in an sr-only list and
 * PieChartRenderer exposes values through a visible legend, so those items
 * were never inaccessible. BarChartRenderer was the real gap and now carries
 * the same sr-only list (see its own test), so no beta item is affected.
 */
const EXPECTED: Readonly<Record<string, readonly string[]>> = {
  "year3:26": ["UNIT-NOT-CUED"],
  "year5:20": ["NUMBERLINE-OFF-GRID"],
  "year5:33": ["UNIT-AMBIGUOUS"],
  "year5:36": ["UNIT-NOT-CUED"],
};

function actualFindings(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [paper, config] of [
    ["year3", FAMILY_BETA_YEAR_3_CONFIG],
    ["year5", FAMILY_BETA_YEAR_5_CONFIG],
  ] as const) {
    const authoring = loadFamilyBetaFixedPaperQuestions(paper, ENABLED_ENV);
    config.pinnedQuestions.forEach((pin, index) => {
      const kinds = findingsForQuestion(authoring[index]!).map((f) => f.kind);
      if (kinds.length > 0) out[`${paper}:${pin.slot}`] = kinds;
    });
  }
  return out;
}

describe("Family Beta review findings", () => {
  it("reports exactly the agreed set of open content findings", () => {
    expect(actualFindings()).toEqual(EXPECTED);
  });

  it("flags no finding on the overwhelming majority of items", () => {
    const flagged = Object.keys(actualFindings()).length;
    const total =
      FAMILY_BETA_YEAR_3_CONFIG.questionCount + FAMILY_BETA_YEAR_5_CONFIG.questionCount;
    expect(total).toBe(78);
    expect(flagged).toBe(4);
  });

  it("does not flag a chart item, since every chart renderer exposes its data", () => {
    const y5 = loadFamilyBetaFixedPaperQuestions("year5", ENABLED_ENV);
    // Q8 and Q42 are line graphs, Q23 a bar chart, Q32 a pie chart: all whose
    // altText recites no values, and none of them is a finding any more.
    for (const slot of [8, 23, 32, 42]) {
      expect(findingsForQuestion(y5[slot - 1]!)).toEqual([]);
    }
  });

  it("still flags a number line whose highlights miss the tick grid", () => {
    const y5 = loadFamilyBetaFixedPaperQuestions("year5", ENABLED_ENV);
    const q20 = findingsForQuestion(y5[19]!);
    expect(q20).toHaveLength(1);
    expect(q20[0]!.kind).toBe("NUMBERLINE-OFF-GRID");
  });

  it("does not flag the number lines that are correctly aligned", () => {
    const y5 = loadFamilyBetaFixedPaperQuestions("year5", ENABLED_ENV);
    // Q13 (min 4, step 0.5) and Q28 (min 0, step 0.25) land on ticks.
    expect(findingsForQuestion(y5[12]!)).toEqual([]);
    expect(findingsForQuestion(y5[27]!)).toEqual([]);
  });

  it("returns nothing for every item when the papers are disabled", () => {
    expect(loadFamilyBetaFixedPaperQuestions("year3", {})).toEqual([]);
  });
});
