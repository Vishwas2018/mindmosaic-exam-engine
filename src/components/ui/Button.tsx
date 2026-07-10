import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type ButtonVariant =
  | "primary"
  | "orange"
  | "secondary"
  | "ghost"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-royal text-white shadow-[0_10px_24px_rgba(75,46,131,0.2)] hover:brightness-95",
  orange:
    "bg-royal-orange text-ink shadow-[0_10px_24px_rgba(255,138,0,0.2)] hover:brightness-95",
  secondary:
    "border border-royal/15 bg-white text-royal shadow-[0_8px_20px_rgba(75,46,131,0.08)] hover:border-royal/30 hover:bg-soft-purple",
  ghost: "bg-transparent text-royal hover:bg-royal/7",
  danger: "bg-error text-white hover:brightness-95",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-10 px-4 py-2 text-sm",
  md: "min-h-12 px-5 py-3 text-sm",
  lg: "min-h-14 px-6 py-3.5 text-base",
  icon: "h-12 w-12 p-0",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return twMerge(
    clsx(
      "inline-flex select-none items-center justify-center gap-2 rounded-xl font-bold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ),
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  loadingLabel = "Please wait",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
