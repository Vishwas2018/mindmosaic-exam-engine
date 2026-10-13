/**
 * Whether the writing dev preview (and its seeded fixture task) may be reached.
 *
 * Same posture as /dev/bar-model: 404 in any production build, and 404 on a
 * real Vercel production deployment regardless of anything else.
 *
 * WRITING_PREVIEW_ENABLED is an escape hatch for exactly one caller: the
 * Playwright configs, whose web server is a PRODUCTION build. Never set it on a
 * real deployment; VERCEL_ENV === "production" overrides it anyway.
 */
export function isWritingPreviewAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (env.VERCEL_ENV === "production") return false;
  return env.NODE_ENV !== "production" || env.WRITING_PREVIEW_ENABLED === "1";
}
