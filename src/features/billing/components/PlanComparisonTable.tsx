import { Check, Minus } from "lucide-react";

import {
  FAMILY_PLAN,
  FAMILY_PLAN_AVAILABILITY,
  FREE_PLAN,
  INDIVIDUAL_PLAN,
  PRICE_DISCLAIMER,
} from "@/lib/billing/prices";

interface FeatureRow {
  label: string;
  free: string | boolean;
  individual: string | boolean;
  family: string | boolean;
}

/**
 * Free vs Individual vs Family. Rows are limited to things the product does
 * today; the per-tier split of the paid features is a pricing decision, not
 * yet enforced in code (no entitlement check distinguishes Individual from
 * Family beyond the child limit).
 */
const FEATURE_ROWS: FeatureRow[] = [
  {
    label: "Practice questions",
    free: "Guest practice",
    individual: "Full bank",
    family: "Full bank",
  },
  { label: "Account required", free: false, individual: true, family: true },
  {
    label: "Child profiles",
    free: "—",
    individual: `${INDIVIDUAL_PLAN.maxChildren}`,
    family: `Up to ${FAMILY_PLAN.maxChildren}`,
  },
  { label: "Full-length exam papers", free: false, individual: true, family: true },
  { label: "Progress dashboard", free: false, individual: true, family: true },
  { label: "Subject-level skill breakdowns", free: false, individual: true, family: true },
  { label: "Learning observations & recommendations", free: false, individual: false, family: true },
  { label: "Exam history & re-attempts", free: false, individual: false, family: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <>
        <Check aria-hidden="true" className="mx-auto h-4 w-4 text-mm-positive" strokeWidth={3} />
        <span className="sr-only">Included</span>
      </>
    ) : (
      <>
        <Minus aria-hidden="true" className="mx-auto h-4 w-4 text-mm-quiet" />
        <span className="sr-only">Not included</span>
      </>
    );
  }
  return <span className="text-sm font-semibold text-mm-ink">{value}</span>;
}

export function PlanComparisonTable() {
  return (
    <section
      aria-labelledby="compare-heading"
      className="overflow-hidden rounded-[28px] border border-mm-line bg-white shadow-[0_18px_50px_-24px_rgba(24,21,31,0.18)]"
    >
      <div className="border-b border-mm-line-soft bg-[linear-gradient(135deg,#fbf8fe,#fff)] px-6 py-5">
        <h2 id="compare-heading" className="text-lg font-extrabold tracking-[-0.02em] text-mm-ink">
          Compare plans
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-mm-line-soft">
              <th scope="col" className="p-5 text-sm font-extrabold text-mm-ink">
                Feature
              </th>
              <th scope="col" className="p-5 text-center">
                <p className="text-sm font-extrabold text-mm-ink">{FREE_PLAN.name}</p>
                <p className="mt-1 text-xs font-semibold text-mm-muted">A$0</p>
              </th>
              <th scope="col" className="p-5 text-center">
                <p className="text-sm font-extrabold text-mm-ink">{INDIVIDUAL_PLAN.name}</p>
                <p className="mt-1 text-xs font-semibold text-mm-muted">
                  {INDIVIDUAL_PLAN.monthly.display}
                  {INDIVIDUAL_PLAN.monthly.period} · {INDIVIDUAL_PLAN.annual.display}
                  {INDIVIDUAL_PLAN.annual.period}
                </p>
              </th>
              <th scope="col" className="bg-mm-wash p-5 text-center">
                <p className="text-sm font-extrabold text-mm-brand">{FAMILY_PLAN.name}</p>
                <p className="mt-1">
                  <span className="whitespace-nowrap rounded-full bg-mm-coral px-2 py-0.5 text-[11px] font-black text-white">
                    {FAMILY_PLAN_AVAILABILITY === "purchasable" ? "Best value" : "Coming soon"}
                  </span>
                </p>
                <p className="mt-1 text-xs font-semibold text-mm-muted">
                  {FAMILY_PLAN.monthly.display}
                  {FAMILY_PLAN.monthly.period} · {FAMILY_PLAN.annual.display}
                  {FAMILY_PLAN.annual.period}
                </p>
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-mm-line-soft last:border-0">
                <th scope="row" className="p-5 text-sm font-semibold text-mm-ink-soft">
                  {row.label}
                </th>
                <td className="p-5 text-center">
                  <FeatureCell value={row.free} />
                </td>
                <td className="p-5 text-center">
                  <FeatureCell value={row.individual} />
                </td>
                <td className="bg-mm-wash/60 p-5 text-center">
                  <FeatureCell value={row.family} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-6 pb-5 pt-3 text-xs leading-5 text-mm-muted">{PRICE_DISCLAIMER}</p>
    </section>
  );
}
