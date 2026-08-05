import { Check, Minus, X } from "lucide-react";
import { clsx } from "clsx";

import { plans } from "../content";
import { Section } from "./primitives";

/**
 * The nine-row plan comparison — design handoff screen 3.
 *
 * Cells are rendered from their string value rather than a boolean so a row
 * can say "Being written" or a profile count, not just yes/no. "Yes"/"No"
 * get a glyph as well as the word: never colour or icon alone, per the
 * handoff's accessibility notes and this codebase's own convention.
 *
 * The table scrolls inside its own container below the breakpoint where
 * four columns fit, with a labelled `role="region"` and `tabIndex={0}` so
 * the scroll area is reachable by keyboard — the same treatment
 * BreakdownTable on /results already uses.
 */
function Cell({ value }: { value: string }) {
  if (value === "Yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-mm-brand">
        <Check aria-hidden="true" className="h-4 w-4" />
        Yes
      </span>
    );
  }
  if (value === "No") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-mm-muted">
        <X aria-hidden="true" className="h-4 w-4" />
        No
      </span>
    );
  }
  if (value === "—") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-mm-muted">
        <Minus aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">Not applicable</span>
      </span>
    );
  }
  return <span className="text-[14.5px] font-semibold text-mm-ink-soft">{value}</span>;
}

export function PlanComparison() {
  return (
    <Section tone="page" labelledBy="plan-comparison-heading">
      <h2
        id="plan-comparison-heading"
        className="max-w-[620px] text-[clamp(26px,3vw,40px)] font-bold leading-[1.12] text-mm-ink"
      >
        {plans.comparison.heading}
      </h2>
      <p className="mt-3 max-w-[680px] text-[16.5px] leading-[1.6] text-mm-muted">
        {plans.comparison.intro}
      </p>

      <div
        role="region"
        aria-label="Plan comparison, scroll right to see every column"
        tabIndex={0}
        className="mt-[clamp(22px,2.2vw,30px)] overflow-x-auto rounded-2xl border border-mm-line focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
      >
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead className="bg-mm-tint">
            <tr>
              <th
                scope="col"
                className="px-5 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-mm-brand"
              >
                Included
              </th>
              {plans.comparison.columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="px-5 py-4 text-[13px] font-bold uppercase tracking-[0.08em] text-mm-brand"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plans.comparison.rows.map((row, index) => (
              <tr
                key={row.label}
                className={clsx(
                  "border-t border-mm-line-soft",
                  index % 2 === 1 ? "bg-mm-page" : "bg-white",
                )}
              >
                <th
                  scope="row"
                  className="px-5 py-4 text-[15px] font-semibold leading-[1.5] text-mm-ink"
                >
                  {row.label}
                </th>
                {row.values.map((value, columnIndex) => (
                  <td key={plans.comparison.columns[columnIndex]} className="px-5 py-4">
                    <Cell value={value} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 max-w-[760px] text-[14.5px] leading-[1.6] text-mm-muted">
        {plans.comparison.footnote}
      </p>
    </Section>
  );
}
