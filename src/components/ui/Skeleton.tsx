import type { HTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={twMerge("animate-pulse rounded-xl bg-royal/10", className)}
      {...props}
    />
  );
}
