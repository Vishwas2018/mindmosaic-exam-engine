"use client";

import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  selectClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    id,
    label,
    hint,
    error,
    className,
    selectClassName,
    children,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={twMerge("w-full", className)}>
      {label && (
        <label htmlFor={selectId} className="mb-2 block text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={twMerge(
            "min-h-12 w-full appearance-none rounded-xl border border-royal/15 bg-white py-3 pl-4 pr-11 text-base text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] outline-none transition hover:border-royal/30 focus:border-royal focus:ring-4 focus:ring-royal/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-muted",
            error && "border-error focus:border-error focus:ring-error/15",
            selectClassName,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-2 text-sm leading-5 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-sm font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  );
});
