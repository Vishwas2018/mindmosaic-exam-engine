import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { TrendDirection } from "../analytics";

const PRESENTATION: Record<
  TrendDirection,
  { icon: typeof TrendingUp; className: string; describe: (points: number) => string }
> = {
  up: {
    icon: TrendingUp,
    className: "text-success",
    describe: (points) => `Up ${points} points`,
  },
  down: {
    icon: TrendingDown,
    className: "text-error",
    describe: (points) => `Down ${Math.abs(points)} points`,
  },
  flat: {
    icon: Minus,
    className: "text-muted",
    describe: () => "Steady",
  },
};

/** Small score-trend arrow + label, shared by the dashboard and student detail. */
export function TrendIndicator({
  direction,
  deltaPoints,
}: {
  direction: TrendDirection;
  deltaPoints: number;
}) {
  const { icon: Icon, className, describe } = PRESENTATION[direction];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${className}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {describe(deltaPoints)}
    </span>
  );
}
