import { twMerge } from "tailwind-merge";

export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  tone?: "purple" | "orange" | "success";
}

const fillClasses = {
  purple: "bg-royal",
  orange: "bg-royal-orange",
  success: "bg-success",
};

export function ProgressBar({
  value,
  max = 100,
  label = "Progress",
  showValue = false,
  className,
  tone = "purple",
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 100;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((safeValue / safeMax) * 100);

  return (
    <div className={twMerge("w-full", className)}>
      {(showValue || label) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-ink">{label}</span>
          {showValue && (
            <span className="font-bold tabular-nums text-muted">{percent}%</span>
          )}
        </div>
      )}
      <div
        className="h-2.5 overflow-hidden rounded-full bg-royal/10"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${percent}% complete`}
      >
        <div
          className={`h-full rounded-full ${fillClasses[tone]} transition-[width] duration-300 motion-reduce:transition-none`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
