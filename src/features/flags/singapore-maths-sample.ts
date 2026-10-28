/**
 * Availability of the Singapore Maths student sample practice.
 *
 * Phase 1: 30 Year 3 / Year 5 sample bar-model questions.
 *
 * The sample is available by default wherever the app is NOT a real Vercel
 * production deployment — local dev, `next start`, and every Preview
 * deployment — so selecting the programme simply works, with no environment
 * variable to configure first.
 *
 * `VERCEL_ENV === "production"` still refuses it, unconditionally and ahead of
 * every other check. The 30 pilot items are drafts: each carries
 * `draftProvenance` and none carries an `approvedBy` human sign-off, so they
 * are not publishable content under the repo's published-only + human-gate
 * rules. Production availability is a content-approval decision, not a code
 * switch, and must not be bought by editing this function.
 *
 * `SINGAPORE_MATHS_SAMPLE_ENABLED=0` (or `false`) is an explicit opt-out, kept
 * so the Coming Soon branch stays reachable for QA outside production.
 */
export function isSingaporeMathsSampleAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  // A real Vercel production deployment is never allowed, whatever is set.
  if (env.VERCEL_ENV === "production") return false;
  // Explicit opt-out, for exercising the Coming Soon branch.
  const flag = env.SINGAPORE_MATHS_SAMPLE_ENABLED;
  if (flag === "0" || flag === "false") return false;
  return true;
}
