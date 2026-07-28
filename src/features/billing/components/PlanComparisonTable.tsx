import { Check, Minus } from "lucide-react";

import { Badge, Card } from "@/components/ui";
import { FAMILY_PLAN, PRICE_DISCLAIMER } from "@/lib/billing/prices";

interface FeatureRow {
  label: string;
  free: string | boolean;
  family: string | boolean;
}

/**
 * There is exactly one paid product in this codebase today (public.subscriptions'
 * `plan` check constraint only allows family_monthly/family_annual — see
 * supabase/migrations/20260720100000_subscriptions.sql), so this compares
 * the two tiers that actually exist — free guest practice vs. the Family
 * plan — rather than a Standard/Premium split with no backing price IDs or
 * DB enum values. See this batch's completion report for the deviation.
 */
const FEATURE_ROWS: FeatureRow[] = [
  { label: "Practice questions", free: "Unlimited", family: "Unlimited" },
  { label: "Sign-in required", free: false, family: true },
  { label: "Children per account", free: "—", family: `Up to ${FAMILY_PLAN.maxChildren}` },
  { label: "Progress dashboard", free: false, family: true },
  { label: "Subject-level skill breakdowns", free: false, family: true },
  { label: "Learning observations & recommendations", free: false, family: true },
  { label: "Exam history & re-attempts", free: false, family: true },
];

function FeatureCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check aria-hidden="true" className="mx-auto h-4 w-4 text-success" />
    ) : (
      <Minus aria-hidden="true" className="mx-auto h-4 w-4 text-muted/50" />
    );
  }
  return <span className="text-sm font-semibold text-ink">{value}</span>;
}

export function PlanComparisonTable() {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[520px] border-collapse text-left">
        <thead>
          <tr className="border-b border-royal/8">
            <th scope="col" className="p-5 text-sm font-extrabold text-ink">
              Feature
            </th>
            <th scope="col" className="p-5 text-center">
              <p className="text-sm font-extrabold text-ink">Free</p>
              <p className="mt-1 text-xs font-semibold text-muted">Guest, no account</p>
            </th>
            <th scope="col" className="p-5 text-center">
              <p className="flex items-center justify-center gap-2 text-sm font-extrabold text-ink">
                {FAMILY_PLAN.name}
                <Badge variant="purple">Most families</Badge>
              </p>
              <p className="mt-1 text-xs font-semibold text-muted">
                {FAMILY_PLAN.monthly.display}
                {FAMILY_PLAN.monthly.period} · {FAMILY_PLAN.annual.display}
                {FAMILY_PLAN.annual.period}
              </p>
            </th>
          </tr>
        </thead>
        <tbody>
          {FEATURE_ROWS.map((row, index) => (
            <tr key={row.label} className={index % 2 === 1 ? "bg-page/50" : undefined}>
              <th scope="row" className="p-5 text-sm font-semibold text-ink">
                {row.label}
              </th>
              <td className="p-5 text-center">
                <FeatureCell value={row.free} />
              </td>
              <td className="p-5 text-center">
                <FeatureCell value={row.family} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="px-5 pb-5 text-xs leading-5 text-muted">{PRICE_DISCLAIMER}</p>
    </Card>
  );
}
