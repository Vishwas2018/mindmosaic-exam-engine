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
 * inferred: BarChartRenderer/LineGraphRenderer/PieChartRenderer mark every
 * data mark aria-hidden and expose only altText, and NumberLineRenderer draws
 * ticks at min + n x step while positioning highlights by value.
 */
const EXPECTED: Readonly<Record<string, readonly string[]>> = {
  "year3:26": ["UNIT-NOT-CUED"],
  "year5:8": ["CHART-ALT-NO-DATA"],
  "year5:16": ["CHART-ALT-NO-DATA"],
  "year5:20": ["NUMBERLINE-OFF-GRID"],
  "year5:23": ["CHART-ALT-NO-DATA"],
  "year5:26": ["CHART-ALT-NO-DATA"],
  "year5:32": ["CHART-ALT-NO-DATA"],
  "year5:33": ["UNIT-AMBIGUOUS"],
  "year5:36": ["UNIT-NOT-CUED"],
  "year5:42": ["CHART-ALT-NO-DATA"],
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
    expect(flagged).toBe(10);
  });

  it("treats a chart as accessible when the altText carries every plotted value", () => {
    // Year 3 Q5's altText lists all four jug volumes, so it is not flagged.
    const y3 = loadFamilyBetaFixedPaperQuestions("year3", ENABLED_ENV);
    const q5 = y3[4]!;
    expect(findingsForQuestion(q5)).toEqual([]);
  });

  it("treats equal segments as accessible when the prompt states they are equal", () => {
    // Year 3 Q8's pie chart segments are all equal and the prompt says so, so
    // the plotted magnitudes are not needed to answer it.
    const y3 = loadFamilyBetaFixedPaperQuestions("year3", ENABLED_ENV);
    const q8 = y3[7]!;
    expect(findingsForQuestion(q8)).toEqual([]);
  });

  it("returns nothing for every item when the papers are disabled", () => {
    expect(loadFamilyBetaFixedPaperQuestions("year3", {})).toEqual([]);
  });
});
