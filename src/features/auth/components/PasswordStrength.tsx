"use client";

import { Check, X } from "lucide-react";
import { clsx } from "clsx";

import { evaluatePassword } from "../password";

const BAR_COLOUR: Record<string, string> = {
  empty: "bg-mm-tint",
  weak: "bg-mm-coral",
  fair: "bg-mm-brand",
  strong: "bg-[#0B6B63]",
};

const BAR_WIDTH: Record<string, string> = {
  empty: "w-0",
  weak: "w-1/3",
  fair: "w-2/3",
  strong: "w-full",
};

const STRENGTH_LABEL: Record<string, string> = {
  empty: "",
  weak: "Weak",
  fair: "Getting there",
  strong: "Strong",
};

/** Restyled onto the mm-* auth system to match the rest of /auth/reset. */
export function PasswordStrength({ password }: { password: string }) {
  const { results, strength } = evaluatePassword(password);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-mm-tint">
          <div
            className={clsx(
              "h-full rounded-full transition-all duration-300",
              BAR_COLOUR[strength],
              BAR_WIDTH[strength],
            )}
          />
        </div>
        {strength !== "empty" && (
          <span className="text-xs font-bold text-mm-muted">{STRENGTH_LABEL[strength]}</span>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={clsx(
              "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
              rule.met
                ? "border-mm-brand/30 bg-mm-tint text-mm-brand"
                : "border-mm-line bg-mm-page text-mm-muted",
            )}
          >
            {rule.met ? (
              <Check aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <X aria-hidden="true" className="h-3.5 w-3.5 shrink-0 opacity-50" />
            )}
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
