/**
 * Server-side feature flag for Singapore Maths student sample practice.
 *
 * Phase 1: 30 Year 3 / Year 5 sample bar-model questions, opt-in behind this
 * flag. Explicitly OFF by default — nothing reaches a student until the owner
 * flips it.
 *
 * Mirror of the bar-model preview gate posture: a real Vercel production
 * deployment is never allowed regardless of the flag, and `VERCEL_ENV ===
 * "production"` overrides everything. The `SINGAPORE_MATHS_SAMPLE_ENABLED`
 * escape hatch only works outside production (e.g. local dev, preview
 * deployments used for QA).
 */
export function isSingaporeMathsSampleAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  // A real Vercel production deployment is never allowed, flag or not.
  if (env.VERCEL_ENV === "production") return false;
  // Explicitly OFF by default; the escape hatch opts in outside production.
  return env.SINGAPORE_MATHS_SAMPLE_ENABLED === "1";
}
