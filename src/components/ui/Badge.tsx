import type { HTMLAttributes } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type BadgeVariant =
  | "purple"
  | "orange"
  | "success"
  | "warning"
  | "error"
  | "neutral";

const variantClasses: Record<BadgeVariant, string> = {
  purple: "border-royal/10 bg-royal/8 text-royal",
  orange: "border-royal-orange/15 bg-royal-orange/10 text-warning",
  success: "border-success/15 bg-success/10 text-success",
  warning: "border-warning/15 bg-warning/10 text-warning",
  error: "border-error/15 bg-error/10 text-error",
  neutral: "border-muted/15 bg-slate-100 text-muted",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "purple",
  ...props
}: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold leading-none tracking-[0.01em]",
          variantClasses[variant],
          className,
        ),
      )}
      {...props}
    />
  );
}
