import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

import { Badge, Card } from "@/components/ui";

export interface AssignmentsSummaryCardProps {
  toDoCount: number;
  inProgressCount: number;
  overdueCount: number;
  /** False when the assignments read failed — say so rather than show "0 to do". */
  loaded: boolean;
}

/**
 * Work a teacher has set, summarised. A student's own dashboard is the one
 * place they should learn that something is due without going looking for
 * it, so this renders whether or not there is anything outstanding — an
 * "all clear" is information too.
 */
export function AssignmentsSummaryCard({
  toDoCount,
  inProgressCount,
  overdueCount,
  loaded,
}: AssignmentsSummaryCardProps) {
  const outstanding = toDoCount + inProgressCount;

  return (
    <Card variant="default" className="p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-royal/8 text-royal"
          >
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-extrabold text-ink">Assignments</h2>
            <p className="mt-0.5 text-xs font-semibold text-muted">Set by your teacher</p>
          </div>
        </div>
        {overdueCount > 0 && <Badge variant="error">{overdueCount} overdue</Badge>}
      </div>

      <p className="mt-5 text-2xl font-black tabular-nums leading-none text-ink">
        {loaded ? outstanding : "—"}
      </p>
      <p className="mt-1.5 text-xs font-semibold text-muted">
        {!loaded
          ? "We couldn't load your assignments just now."
          : outstanding === 0
            ? "Nothing outstanding — you're all caught up."
            : `${outstanding} to finish${inProgressCount > 0 ? `, ${inProgressCount} already started` : ""}`}
      </p>

      <Link
        href="/student/assignments"
        className="mt-4 inline-flex min-h-11 items-center gap-1.5 rounded-xl text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
      >
        View assignments
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </Link>
    </Card>
  );
}
