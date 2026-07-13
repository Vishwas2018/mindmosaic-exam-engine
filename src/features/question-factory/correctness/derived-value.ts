import type { Fraction } from "./numeric";

/**
 * Every shape an independent derivation method can produce, closed over
 * the subset of answer-key kinds this gate implements deterministic
 * derivation for. `text`, `manual`, `hotspot`, and `drag_drop` are
 * deliberately absent — no derivation method in this module produces
 * them (see the Mission 2C report's "confirmed gaps" section).
 */
export type DerivedValue =
  | { readonly kind: "number"; readonly value: Fraction }
  | { readonly kind: "boolean"; readonly value: boolean }
  | { readonly kind: "single_option"; readonly optionId: string }
  | { readonly kind: "multiple_options"; readonly optionIds: readonly string[] }
  | { readonly kind: "ordering"; readonly optionIds: readonly string[] }
  | {
      readonly kind: "matching";
      readonly pairs: readonly { readonly sourceId: string; readonly targetId: string }[];
    }
  | { readonly kind: "fill_blank"; readonly values: Readonly<Record<string, string>> }
  | { readonly kind: "dropdown"; readonly values: Readonly<Record<string, string>> };
