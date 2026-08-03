"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  inputClassName?: string;
  /** Optional leading icon (e.g. Mail, Lock) rendered inside the field, left-aligned. Decorative — never a substitute for `label`. */
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    className,
    inputClassName,
    icon,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={twMerge("w-full", className)}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-muted"
          >
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={twMerge(
            "min-h-12 w-full rounded-xl border border-royal/15 bg-white px-4 py-3 text-base text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] outline-none transition placeholder:text-muted/70 hover:border-royal/30 focus:border-royal focus:ring-4 focus:ring-royal/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-muted",
            icon && "pl-11",
            error && "border-error focus:border-error focus:ring-error/15",
            inputClassName,
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-2 text-sm leading-5 text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-error"
        >
          <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
});
