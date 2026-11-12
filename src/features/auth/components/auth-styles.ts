import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/*
 * Style helpers for the auth screens. Deliberately NOT a client module:
 * server-rendered pages (/welcome, /signed-out, the student help page) call
 * these directly, and a function exported from a "use client" file cannot be
 * invoked from the server. auth-fields.tsx re-exports them for client code.
 */

/*
 * The handoff specifies `outline: 3px solid #5925A8; outline-offset: 3px`
 * on every interactive control, rather than the ring-based treatment the
 * marketing primitives use. Kept as one constant so the two cannot drift.
 */
export const mmFocus =
  "focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand";

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
