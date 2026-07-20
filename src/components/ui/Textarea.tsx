"use client";

import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";
import { twMerge } from "tailwind-merge";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  textareaClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    id,
    label,
    hint,
    error,
    className,
    textareaClassName,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = hint ? `${textareaId}-hint` : undefined;
  const errorId = error ? `${textareaId}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={twMerge("w-full", className)}>
      {label && (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-bold text-ink">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={twMerge(
          "min-h-28 w-full rounded-xl border border-royal/15 bg-white px-4 py-3 text-base text-ink shadow-[0_2px_8px_rgba(49,32,86,0.04)] outline-none transition placeholder:text-muted/70 hover:border-royal/30 focus:border-royal focus:ring-4 focus:ring-royal/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-muted",
          error && "border-error focus:border-error focus:ring-error/15",
          textareaClassName,
        )}
        {...props}
      />
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
