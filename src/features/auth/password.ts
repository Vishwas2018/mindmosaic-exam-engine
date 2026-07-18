/**
 * Password-strength rules mirrored from the auth mockup (8+ chars, lowercase,
 * uppercase, number, special character). Pure and framework-free so it is unit
 * tested directly and reused by the live strength meter.
 */
export interface PasswordRule {
  readonly id: "length" | "lower" | "upper" | "number" | "special";
  readonly label: string;
  readonly test: (password: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { id: "length", label: "8+ characters", test: (p) => p.length >= 8 },
  { id: "lower", label: "Lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "upper", label: "Uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "Number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export interface PasswordRuleResult extends PasswordRule {
  readonly met: boolean;
}

export interface PasswordEvaluation {
  readonly results: readonly PasswordRuleResult[];
  readonly metCount: number;
  readonly total: number;
  readonly allMet: boolean;
  readonly strength: "empty" | "weak" | "fair" | "strong";
}

export function evaluatePassword(password: string): PasswordEvaluation {
  const results = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
  const metCount = results.filter((rule) => rule.met).length;
  const total = PASSWORD_RULES.length;

  let strength: PasswordEvaluation["strength"];
  if (password.length === 0) strength = "empty";
  else if (metCount <= 2) strength = "weak";
  else if (metCount <= 4) strength = "fair";
  else strength = "strong";

  return { results, metCount, total, allMet: metCount === total, strength };
}
