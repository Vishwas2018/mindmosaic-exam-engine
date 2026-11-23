/**
 * Shared password-recovery validation, copy and resend-cooldown constants.
 *
 * Used by both `/sign-in?mode=forgot` (SignInPanel) and standalone `/auth/forgot`
 * so parents get identical validation, anti-enumeration messaging and resend
 * throttling regardless of which entry point they arrive from (DEF-AUTH-006).
 */
export const FORGOT_COOLDOWN_SECONDS = 30;

export const FORGOT_EMPTY_EMAIL_ERROR = "Enter the email address on your account.";
export const FORGOT_INVALID_EMAIL_ERROR =
  "That doesn\u2019t look like a complete email address, like name@example.com.";
export const FORGOT_NETWORK_ERROR =
  "We couldn\u2019t reach MindMosaic. Check your connection and try again.";
export const FORGOT_FALLBACK_ERROR =
  "We couldn\u2019t send a reset link just now. Please try again in a few minutes.";
export const FORGOT_SUCCESS_NOTICE =
  "If that email has an account, a reset link is on its way. It expires in one hour.";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Format check only — never reveals whether an address is registered. */
export function isCompleteEmailAddress(raw: string): boolean {
  return EMAIL_PATTERN.test(raw.trim());
}

/** Validates the email field before calling Supabase resetPasswordForEmail. */
export function validateForgotEmail(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return FORGOT_EMPTY_EMAIL_ERROR;
  if (!isCompleteEmailAddress(trimmed)) return FORGOT_INVALID_EMAIL_ERROR;
  return null;
}
