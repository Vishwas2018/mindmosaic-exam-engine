/**
 * Whether the internal review console may render.
 *
 * Dev-only route gate:
 * Returns 404 in any production build unless REVIEW_CONSOLE_ENABLED is explicitly set to "1"
 * (which is only used by Playwright production test runs).
 * VERCEL_ENV === "production" ALWAYS returns false (refuses preview in any real deployment,
 * regardless of flags).
 */
export function isReviewConsoleAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.REVIEW_CONSOLE_ENABLED === "1";
}
