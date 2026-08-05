"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Field furniture for the redesigned auth screens, in the design handoff's
 * own measurements: 52-54px tall inputs, 12-13px radius, 1.5px borders,
 * 13.5px bold labels.
 *
 * These deliberately do NOT reuse `@/components/ui`'s Input/Button. Those
 * carry the product palette (`border-royal/15`, `focus:ring-royal/15`,
 * 48px height) and are used by the exam runner, dashboards and billing;
 * restyling them to the auth spec would drag every one of those surfaces
 * along with it. Same reasoning as the `--mm-*` / product token split in
 * globals.css.
 */

/* ---------- Focus ---------- */

/*
 * The handoff specifies `outline: 3px solid #5925A8; outline-offset: 3px`
 * on every interactive control, rather than the ring-based treatment the
 * marketing primitives use. Kept as one constant so the two cannot drift.
 */
export const mmFocus =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand";

/* ---------- Text field ---------- */

export interface MmFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className"> {
  id: string;
  label: string;
  /** Rendered to the right of the label — the "Forgot password?" link slot. */
  labelAside?: ReactNode;
  /** Helper text under the input. */
  hint?: string;
  /** Draws the coral error border. The message itself lives in <MmErrorPanel>. */
  invalid?: boolean;
  /** Extra room on the right for an inline button (e.g. Show/Hide). */
  trailingRoom?: boolean;
  trailing?: ReactNode;
  /** `#FCFBF8` inside the sign-up card, `#fff` on the sign-in form. */
  tone?: "paper" | "white";
}

export function MmField({
  id,
  label,
  labelAside,
  hint,
  invalid = false,
  trailingRoom = false,
  trailing,
  tone = "white",
  ...inputProps
}: MmFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[13.5px] font-bold text-mm-ink-soft">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative block">
        <input
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={twMerge(
            clsx(
              "h-[54px] w-full min-w-0 rounded-[13px] border-[1.5px] px-4 text-base text-mm-ink transition-colors",
              "placeholder:text-mm-muted-2 hover:border-mm-brand/60",
              mmFocus,
              tone === "paper" ? "bg-mm-page" : "bg-white",
              invalid ? "border-mm-coral" : "border-mm-line",
              trailingRoom && "pr-[92px]",
            ),
          )}
          {...inputProps}
        />
        {trailing}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-[13px] leading-[1.5] text-mm-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/** The inline Show/Hide button that sits inside a password field. */
export function MmRevealButton({
  visible,
  onToggle,
  controls,
}: {
  visible: boolean;
  onToggle: () => void;
  controls: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-controls={controls}
      aria-pressed={visible}
      className={twMerge(
        "absolute right-[7px] top-[7px] min-h-10 rounded-[9px] border border-mm-line bg-mm-page px-[13px] text-[13px] font-bold text-mm-brand transition-colors hover:border-mm-brand",
        mmFocus,
      )}
    >
      {visible ? "Hide" : "Show"}
    </button>
  );
}

/* ---------- Custom checkbox ---------- */

/**
 * `role="checkbox"` on a <button> with `aria-checked`, exactly as the
 * handoff's markup notes specify. A native <input type="checkbox"> cannot
 * take the filled-purple tile treatment without an appearance reset that
 * behaves differently across engines, and the handoff's accessibility notes
 * name this pattern by hand.
 */
export function MmCheckbox({
  checked,
  onToggle,
  children,
  id,
  align = "center",
}: {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  id: string;
  align?: "center" | "start";
}) {
  return (
    <div
      className={clsx(
        "flex gap-3 text-[14.5px] leading-[1.55] text-mm-ink-soft",
        align === "center" ? "items-center" : "items-start",
      )}
    >
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        onClick={onToggle}
        className={twMerge(
          clsx(
            "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-md border-[1.5px] text-[13px] font-extrabold transition-colors",
            align === "start" && "mt-px",
            checked
              ? "border-mm-brand bg-mm-brand text-white"
              : "border-mm-line bg-white text-transparent hover:border-mm-brand",
          ),
          mmFocus,
        )}
      >
        {/* aria-hidden: the checked state is already announced by aria-checked. */}
        <span aria-hidden="true">{checked ? "✓" : ""}</span>
      </button>
      <label id={`${id}-label`} htmlFor={id} className="cursor-pointer">
        {children}
      </label>
    </div>
  );
}

/* ---------- Error panel ---------- */

/**
 * `role="alert"` — the handoff specifies it, and unlike `role="status"`
 * (what the previous AuthCard used) it interrupts, which is right for a
 * sign-in failure the user must act on.
 */
export function MmErrorPanel({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="mm-rise-fast grid grid-cols-[20px_1fr] gap-[11px] rounded-xl border border-mm-alert-line bg-mm-alert p-3.5 text-sm leading-[1.5] text-mm-coral-deep"
    >
      <span aria-hidden="true" className="font-extrabold text-mm-coral-text">
        !
      </span>
      {children}
    </p>
  );
}

/* ---------- Primary / secondary buttons ---------- */

export function mmAuthButton({
  variant = "primary",
  disabled = false,
  className,
}: {
  variant?: "primary" | "outline";
  disabled?: boolean;
  className?: string;
} = {}) {
  return twMerge(
    clsx(
      "inline-flex min-h-[52px] select-none items-center justify-center gap-2 rounded-xl px-6 text-[15.5px] font-bold leading-none transition-colors",
      mmFocus,
      variant === "primary"
        ? disabled
          ? /* The handoff's explicit disabled treatment: #EFEAF4 on #928C99,
               not-allowed. Kept visible rather than dimmed to 50% so the
               label stays readable while the control is unavailable. */
            "cursor-not-allowed bg-mm-track text-mm-muted-2"
          : "bg-mm-brand text-white shadow-[0_6px_18px_rgba(89,37,168,0.22)] hover:bg-mm-brand-deep"
        : "border border-mm-line bg-white text-mm-ink hover:border-mm-brand hover:text-mm-brand",
    ),
    className,
  );
}
