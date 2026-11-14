/**
 * Availability of the Singapore Maths student sample practice.
 *
 * Phase 1 is 30 Year 3 / Year 5 draft pilot items: each carries
 * `draftProvenance` and none carries an `approvedBy` human sign-off, so they
 * are not publishable content under the repo's published-only + human-gate
 * rules. This gate therefore answers two questions at once — is this a
 * deployment allowed to show drafts, and is the backend it would record
 * submissions against a safe one — and refuses unless both are affirmatively,
 * explicitly true. Anything it cannot verify is refused.
 *
 * The decision, in order:
 *
 *   1. A real Vercel production deployment (`VERCEL_ENV === "production"`) is
 *      refused first and unconditionally. Production availability is a
 *      content-approval decision, never a configuration or code change.
 *   2. `SINGAPORE_MATHS_SAMPLE_ENABLED` set to `0`/`false` is an explicit
 *      opt-out, honoured everywhere, so the Coming Soon branch stays
 *      reachable for QA.
 *   3. The Supabase target must be identifiable from
 *      `NEXT_PUBLIC_SUPABASE_URL`. Missing or unparseable is refused: an
 *      unknown backend is never a safe one.
 *   4. The production Supabase project is never an accepted sample-testing
 *      target. Declare it as `PRODUCTION_SUPABASE_PROJECT_REF` (the `<ref>`
 *      in `https://<ref>.supabase.co`) and this refuses any deployment
 *      pointed at it, whatever else is set.
 *   5. Off-Vercel (`VERCEL_ENV` unset — local `next dev`, local `next start`,
 *      the e2e web servers) is a convenience mode that needs no opt-in, but
 *      ONLY when the backend is demonstrably isolated: a Supabase host of
 *      127.0.0.1, localhost or ::1, as started by `supabase start`. A local
 *      app pointed at any remote project is refused — this repo's own
 *      `.env.local` points at the hosted project, and a child's practice
 *      submissions must not reach it.
 *   6. A hosted Preview deployment (`VERCEL_ENV === "preview"`) requires BOTH
 *      an explicit opt-in (`SINGAPORE_MATHS_SAMPLE_ENABLED=1`) AND a verified
 *      non-production project binding: `SINGAPORE_MATHS_SAMPLE_SUPABASE_REF`
 *      must name the very project ref the deployment is configured to use,
 *      and `PRODUCTION_SUPABASE_PROJECT_REF` must be declared so that ref can
 *      be checked against it. An unset variable never enables the sample on
 *      Preview, and naming the wrong project disables it rather than
 *      silently testing against another project's data.
 *   7. Any other `VERCEL_ENV` value is an unrecognised deployment context and
 *      fails closed.
 *
 * The reason codes are part of the contract the tests assert on: keep them
 * stable, and prefer adding one over widening an existing branch.
 */

/** Supabase hosts that are, by construction, a throwaway local instance. */
const ISOLATED_SUPABASE_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1"]);

export type SampleAvailabilityReason =
  // Refusals.
  | "vercel_production"
  | "explicit_opt_out"
  | "supabase_target_unknown"
  | "production_supabase_target"
  | "local_backend_not_isolated"
  | "preview_opt_in_missing"
  | "preview_production_ref_undeclared"
  | "preview_binding_missing"
  | "preview_binding_mismatch"
  | "unknown_deployment_context"
  // Grants.
  | "local_isolated_backend"
  | "preview_opted_in_and_bound";

export interface SampleAvailability {
  readonly allowed: boolean;
  readonly reason: SampleAvailabilityReason;
}

function trimmed(value: string | undefined): string | undefined {
  const next = value?.trim();
  return next ? next : undefined;
}

function supabaseHostname(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** The `<ref>` of `https://<ref>.supabase.co`, or null for any other host. */
function hostedProjectRef(hostname: string): string | null {
  const match = /^([a-z0-9-]+)\.supabase\.(co|in|red)$/.exec(hostname);
  return match ? match[1] : null;
}

/**
 * The full decision, with the reason it was reached. Exported for tests and
 * for anything that needs to explain a refusal; callers deciding what to
 * render want `isSingaporeMathsSampleAllowed` instead.
 */
export function singaporeMathsSampleAvailability(
  env: Readonly<Record<string, string | undefined>> = process.env,
): SampleAvailability {
  const deployment = trimmed(env.VERCEL_ENV);
  const optIn = trimmed(env.SINGAPORE_MATHS_SAMPLE_ENABLED)?.toLowerCase();

  // 1. A real Vercel production deployment, ahead of everything else.
  if (deployment === "production") {
    return {allowed: false, reason: "vercel_production"};
  }

  // 2. Explicit opt-out, honoured in every other context.
  if (optIn === "0" || optIn === "false") {
    return {allowed: false, reason: "explicit_opt_out"};
  }

  // 3. An unidentifiable backend is never a safe one.
  const hostname = supabaseHostname(env.NEXT_PUBLIC_SUPABASE_URL);
  if (hostname === null) {
    return {allowed: false, reason: "supabase_target_unknown"};
  }

  // 4. The production project is never an accepted target.
  const projectRef = hostedProjectRef(hostname);
  const productionRef = trimmed(env.PRODUCTION_SUPABASE_PROJECT_REF);
  if (projectRef !== null && productionRef !== undefined && projectRef === productionRef) {
    return {allowed: false, reason: "production_supabase_target"};
  }

  // 5. Off-Vercel convenience mode: isolated local backends only.
  if (deployment === undefined) {
    return ISOLATED_SUPABASE_HOSTNAMES.has(hostname)
      ? {allowed: true, reason: "local_isolated_backend"}
      : {allowed: false, reason: "local_backend_not_isolated"};
  }

  // 6. Hosted Preview: explicit opt-in AND a verified non-production binding.
  if (deployment === "preview") {
    if (optIn !== "1" && optIn !== "true") {
      return {allowed: false, reason: "preview_opt_in_missing"};
    }
    if (productionRef === undefined) {
      return {allowed: false, reason: "preview_production_ref_undeclared"};
    }
    const boundRef = trimmed(env.SINGAPORE_MATHS_SAMPLE_SUPABASE_REF);
    if (boundRef === undefined) {
      return {allowed: false, reason: "preview_binding_missing"};
    }
    /*
     * A Preview deployment must target a nameable hosted project: there is
     * nothing to verify a binding against otherwise.
     */
    if (projectRef === null) {
      return {allowed: false, reason: "supabase_target_unknown"};
    }
    if (boundRef !== projectRef) {
      return {allowed: false, reason: "preview_binding_mismatch"};
    }
    // Unreachable while step 4 stands; kept so the production target is
    // refused even if that check is ever narrowed.
    if (boundRef === productionRef) {
      return {allowed: false, reason: "production_supabase_target"};
    }
    return {allowed: true, reason: "preview_opted_in_and_bound"};
  }

  // 7. Anything else ("development", a future target, a typo) fails closed.
  return {allowed: false, reason: "unknown_deployment_context"};
}

export function isSingaporeMathsSampleAllowed(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return singaporeMathsSampleAvailability(env).allowed;
}
