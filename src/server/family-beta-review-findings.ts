import "server-only";

import type { AuthoringQuestion } from "@/features/exam-engine/types";

/**
 * Itemised, derived review findings for the family-beta fixed papers.
 *
 * Every finding below is computed from the pinned question objects themselves,
 * not transcribed from a report, so this list cannot drift away from the
 * content it describes. It exists so the human content review (AGENTS.md rule
 * 8, `approvedBy`) can be made per item with the defects already surfaced.
 *
 * Nothing here records or implies approval.
 */

export type FindingKind = "NUMBERLINE-OFF-GRID" | "UNIT-NOT-CUED" | "UNIT-AMBIGUOUS";

export interface ReviewFinding {
  readonly kind: FindingKind;
  readonly detail: string;
}

/*
 * There is deliberately no chart-accessibility finding here any more.
 *
 * An earlier version of this file flagged six Year 5 items whose chart altText
 * recites none of its plotted values, on the belief that altText was the only
 * accessible description. That was true of only one of the three chart
 * renderers: LineGraphRenderer already carries an sr-only list of every point,
 * and PieChartRenderer exposes label, value and percentage through a visible
 * legend, so the line-graph and pie items were never inaccessible.
 * BarChartRenderer was the real gap, and it now carries the same sr-only list,
 * which closes the issue for every bar item rather than for the beta's one.
 */
export const FINDING_EXPLANATIONS: Readonly<Record<FindingKind, string>> = Object.freeze({
  "NUMBERLINE-OFF-GRID":
    "NumberLineRenderer draws ticks at min + n x step and positions highlights by value, so highlights whose value is not on that grid render between ticks and cannot be read off the scale.",
  "UNIT-NOT-CUED":
    "The answer key carries a unit but the prompt never names it, so a correct quantity in another unit is marked wrong.",
  "UNIT-AMBIGUOUS":
    "Units appear in the prompt but the prompt does not state which unit the answer must be written in.",
});

const UNIT_WORDS =
  /\b(cents?|dollars?|metres?|centimetres?|millilitres?|litres?|minutes?|chairs?|weeks?)\b/i;

export function findingsForQuestion(question: AuthoringQuestion): readonly ReviewFinding[] {
  const q = question as unknown as {
    prompt?: string;
    visuals?: { type: string; altText?: string; data: Record<string, unknown> }[];
    answerKey?: { kind?: string; unit?: string };
  };
  const findings: ReviewFinding[] = [];
  const prompt = q.prompt ?? "";

  for (const visual of q.visuals ?? []) {
    if (visual.type === "number_line") {
      const { min, step, highlightedValues = [] } = visual.data as {
        min: number;
        step: number;
        highlightedValues?: number[];
      };
      const off = highlightedValues.filter((hv) => {
        const k = (hv - min) / step;
        return Math.abs(k - Math.round(k)) > 1e-6;
      });
      if (off.length > 0) {
        findings.push({
          kind: "NUMBERLINE-OFF-GRID",
          detail: `min=${min}, step=${step}; highlighted ${off.join(", ")} do not fall on a tick.`,
        });
      }
    }

  }

  if (q.answerKey?.kind === "number") {
    const unit = q.answerKey.unit;
    if (unit !== undefined && unit.length > 0) {
      const letters = unit.replace(/[^a-zA-Z]/g, "");
      const cued =
        letters.length === 0
          ? /\$|dollar/i.test(prompt)
          : new RegExp(letters.slice(0, 4), "i").test(prompt);
      if (!cued) {
        findings.push({
          kind: "UNIT-NOT-CUED",
          detail: `the key requires "${unit}" but the prompt does not name that unit.`,
        });
      }
    } else if (
      UNIT_WORDS.test(prompt) &&
      !/\bin (cents|dollars|metres|centimetres|millilitres|litres|minutes)\b|\bwrite just\b|how many (cents|dollars|metres|centimetres|millilitres|litres|minutes)\b/i.test(
        prompt,
      )
    ) {
      findings.push({
        kind: "UNIT-AMBIGUOUS",
        detail: "the prompt mentions units but does not say which unit to answer in.",
      });
    }
  }

  return Object.freeze(findings);
}
