import { twMerge } from "tailwind-merge";

import { Skeleton } from "./Skeleton";

export interface SkeletonTextProps {
  lines?: number;
  label?: string;
  className?: string;
  lineClassName?: string;
}

export function SkeletonText({
  lines = 3,
  label = "Loading",
  className,
  lineClassName,
}: SkeletonTextProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={twMerge("space-y-2", className)}
    >
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className={twMerge(
            "h-4 w-full rounded-full",
            index === lines - 1 && lines > 1 && "w-2/3",
            lineClassName,
          )}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
