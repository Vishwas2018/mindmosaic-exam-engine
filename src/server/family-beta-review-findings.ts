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

export type FindingKind =
  | "CHART-ALT-NO-DATA"
  | "NUMBERLINE-OFF-GRID"
  | "UNIT-NOT-CUED"
  | "UNIT-AMBIGUOUS";

export interface ReviewFinding {
  readonly kind: FindingKind;
  readonly detail: string;
}

export const FINDING_EXPLANATIONS: Readonly<Record<FindingKind, string>> = Object.freeze({
  "CHART-ALT-NO-DATA":
    "The chart renderers mark every bar, point and segment aria-hidden and expose only altText, so a screen-reader user receives no plotted values. For these items the values are not in the altText and are not recoverable from the prompt, so the question cannot be answered without sight. Sighted use is unaffected.",
  "NUMBERLINE-OFF-GRID":
    "NumberLineRenderer draws ticks at min + n x step and positions highlights by value, so highlights whose value is not on that grid render between ticks and cannot be read off the scale.",
  "UNIT-NOT-CUED":
    "The answer key carries a unit but the prompt never names it, so a correct quantity in another unit is marked wrong.",
  "UNIT-AMBIGUOUS":
    "Units appear in the prompt but the prompt does not state which unit the answer must be written in.",
});

/** Charts whose data marks are aria-hidden, leaving altText as the only accessible description. */
const ARIA_HIDDEN_CHART_TYPES: ReadonlySet<string> = new Set([
  "bar_chart",
  "line_graph",
  "pie_chart",
]);

const UNIT_WORDS =
  /\b(cents?|dollars?|metres?|centimetres?|millilitres?|litres?|minutes?|chairs?|weeks?)\b/i;

function plottedValues(visual: { type: string; data: Record<string, unknown> }): number[] {
  const data = visual.data as {
    values?: number[];
    points?: { y: number }[];
    segments?: { value: number }[];
  };
  if (visual.type === "bar_chart") return data.values ?? [];
  if (visual.type === "line_graph") return (data.points ?? []).map((p) => p.y);
  if (visual.type === "pie_chart") return (data.segments ?? []).map((s) => s.value);
  return [];
}

/**
 * Whether the question is answerable without seeing the chart: either the
 * altText carries every plotted value, or the prompt already states the
 * structure the question turns on (for example "split into four equal parts").
 */
function chartDataIsAccessible(altText: string, prompt: string, values: number[]): boolean {
  const tokens = new Set((altText.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number));
  if (values.every((v) => tokens.has(v))) return true;
  // All segments equal and the prompt says so: the plotted magnitudes are not needed.
  const allEqual = values.every((v) => v === values[0]);
  if (allEqual && /\bequal (parts|segments|sections)\b/i.test(prompt)) return true;
  return false;
}

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

    if (ARIA_HIDDEN_CHART_TYPES.has(visual.type)) {
      const values = plottedValues(visual);
      if (values.length > 0 && !chartDataIsAccessible(visual.altText ?? "", prompt, values)) {
        findings.push({
          kind: "CHART-ALT-NO-DATA",
          detail: `${visual.type} plots ${values.join(", ")}; altText states none of them.`,
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
