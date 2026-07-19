import { Card } from "@/components/ui";

/** KPI tile for the admin dashboards (mockup 14/16 summary rows). */
export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <Card variant="outlined" className="rounded-2xl p-5">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tabular-nums tracking-[-0.02em] text-ink">
        {value}
      </p>
      {detail && <p className="mt-1 text-xs font-semibold text-muted">{detail}</p>}
    </Card>
  );
}
