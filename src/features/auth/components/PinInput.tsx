"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { mmFocus } from "./auth-fields";

/**
 * Six-box student PIN. The PIN is the account password (see
 * ../student-alias.ts), so each box is masked and never autofilled, and the
 * numeric keypad is requested on phones. Digits can be typed, pasted across
 * boxes, and removed with Backspace; the value is one plain string so the
 * caller treats it like any other secret field.
 *
 * Accessibility: the six inputs are one labelled group. Each input's own name
 * starts with the visible label ("Your PIN, number 1 of 6"), so what a voice
 * user says matches what a screen reader announces (WCAG 2.5.3).
 */
export function PinInput({
  id,
  label,
  hint,
  value,
  onChange,
  invalid = false,
  errorId,
  length = 6,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (next: string) => void;
  invalid?: boolean;
  errorId?: string;
  length?: number;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const focusBox = (index: number) => {
    const box = refs.current[Math.max(0, Math.min(length - 1, index))];
    box?.focus();
  };

  function handleChange(index: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    /* A typed digit replaces the box's digit; several digits (paste,
       autofill, some keyboards) spread forward from this box. */
    const next = (value.slice(0, index) + digits).slice(0, length);
    onChange(next);
    focusBox(Math.min(index + digits.length, length - 1));
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        onChange(value.slice(0, index) + value.slice(index + 1));
      } else if (index > 0) {
        onChange(value.slice(0, index - 1) + value.slice(index));
        focusBox(index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!digits) return;
    event.preventDefault();
    handleChange(index, digits);
  }

  const describedBy =
    [hint ? `${id}-hint` : null, invalid && errorId ? errorId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="grid gap-2">
      <span id={`${id}-label`} className="text-[13.5px] font-bold text-mm-ink-soft">
        {label}
      </span>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={describedBy}
        className="grid grid-cols-6 gap-2"
      >
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(node) => {
              refs.current[index] = node;
            }}
            id={index === 0 ? id : `${id}-${index + 1}`}
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-lpignore="true"
            aria-label={`${label}, number ${index + 1} of ${length}`}
            aria-invalid={invalid || undefined}
            value={value[index] ?? ""}
            onChange={(event) => handleChange(index, event.currentTarget.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={(event) => handlePaste(index, event)}
            onFocus={(event) => event.currentTarget.select()}
            className={twMerge(
              clsx(
                "h-[54px] min-w-0 rounded-[13px] border-[1.5px] bg-white text-center text-xl font-bold text-mm-ink transition-colors hover:border-mm-brand/60",
                mmFocus,
                invalid ? "border-mm-coral" : "border-mm-line",
              ),
            )}
          />
        ))}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] leading-[1.5] text-mm-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
