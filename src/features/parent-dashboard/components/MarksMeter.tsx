import type { ReactNode } from "react";

export interface MarksMeterProps {
  label: string;
  earnedMarks: number;
  availableMarks: number;
  papersCount?: number;
  className?: string;
}

/**
 * MarksMeter component (§4.3 of Parent Journey specification):
 *
 * "Marks, never percentages:
 *  Numeracy
 *  41 of 60 marks
 *  3 papers · 60 marks counted
 *  The bar is decoration with aria-hidden; the figure beside it is the content.
 *  A screen reader hears '41 of 60 marks', not a percentage it cannot check."
 *
 * Non-negotiable honesty rules:
 * - NEVER renders a percentage (%) in visible text or screen-reader content.
 * - NEVER computes or renders a performance band (e.g. Strong/Good/Building/Needs practice).
 * - Progress bar is purely visual styling marked with aria-hidden="true".
 */
export function MarksMeter({
  label,
  earnedMarks,
  availableMarks,
  papersCount,
  className = "",
}: MarksMeterProps): ReactNode {
  const safeEarned = Math.max(0, earnedMarks);
  const safeAvailable = Math.max(0, availableMarks);
  const fillRatio =
    safeAvailable > 0
      ? Math.min(1, Math.max(0, safeEarned / safeAvailable))
      : 0;
  const fillWidthPercent = Math.round(fillRatio * 100);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-extrabold text-ink">{label}</span>
        <span className="font-extrabold text-ink tabular-nums">
          {safeEarned} of {safeAvailable} marks
        </span>
      </div>

      {/* Decorative visual bar — aria-hidden so screen readers hear only the exact marks */}
      <div
        aria-hidden="true"
        className="h-2 w-full overflow-hidden rounded-full bg-royal/10"
      >
        <div
          className="h-full rounded-full bg-royal transition-[width] duration-300"
          style={{ width: `${fillWidthPercent}%` }}
        />
      </div>

      {papersCount !== undefined && (
        <p className="text-xs font-medium text-muted">
          {papersCount} {papersCount === 1 ? "paper" : "papers"} ·{" "}
          {safeAvailable} marks counted
        </p>
      )}
    </div>
  );
}
