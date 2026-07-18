"use client";

import { Check, X } from "lucide-react";

import { evaluatePassword } from "../password";

const BAR_COLOUR: Record<string, string> = {
  empty: "bg-royal/10",
  weak: "bg-error",
  fair: "bg-royal-orange",
  strong: "bg-success",
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

export function PasswordStrength({ password }: { password: string }) {
  const { results, strength } = evaluatePassword(password);

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-royal/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ${BAR_COLOUR[strength]} ${BAR_WIDTH[strength]}`}
          />
        </div>
        {strength !== "empty" && (
          <span className="text-xs font-bold text-muted">{STRENGTH_LABEL[strength]}</span>
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {results.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-xs font-semibold ${
              rule.met ? "text-success" : "text-muted"
            }`}
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
