import { AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

import { Card } from "@/components/ui";
import type { Insight, InsightTone } from "../types";

const toneStyles: Record<
  InsightTone,
  { icon: typeof CheckCircle2; iconClass: string; pillClass: string }
> = {
  good: {
    icon: CheckCircle2,
    iconClass: "bg-success/10 text-success",
    pillClass: "border-success/15 bg-success/10 text-success",
  },
  warn: {
    icon: AlertCircle,
    iconClass: "bg-warning/10 text-warning",
    pillClass: "border-warning/15 bg-warning/10 text-warning",
  },
  bad: {
    icon: TrendingDown,
    iconClass: "bg-error/10 text-error",
    pillClass: "border-error/15 bg-error/10 text-error",
  },
};

/** Insight cards feed (mockup 16 "Insights" tab, mockup 14 key findings). */
export function InsightList({ insights }: { insights: readonly Insight[] }) {
  return (
    <ul className="space-y-4">
      {insights.map((insight) => {
        const tone = toneStyles[insight.tone];
        const Icon = tone.icon;
        return (
          <li key={insight.title}>
            <Card variant="outlined" className="rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                    tone.iconClass,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-ink">{insight.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{insight.body}</p>
                  <span
                    className={clsx(
                      "mt-3 inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold",
                      tone.pillClass,
                    )}
                  >
                    Recommended: {insight.action}
                  </span>
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
