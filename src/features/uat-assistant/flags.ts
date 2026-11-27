/**
 * Availability gate for the MindMosaic AI UAT Assistant.
 *
 * Fail-closed by construction:
 *   1. Vercel production (`VERCEL_ENV === "production"` or `VERCEL_TARGET_ENV === "production"`)
 *      is refused unconditionally ahead of every other setting.
 *   2. Any deployment pointed at a declared `PRODUCTION_SUPABASE_PROJECT_REF` is refused.
 *   3. `MM_UAT_ASSISTANT_ENABLED` set to `"0"` or `"false"` disables the feature everywhere.
 *   4. Hosted Vercel Preview (`VERCEL_ENV === "preview"`) and Vercel development
 *      (`VERCEL_ENV === "development"`) allow the UAT assistant for verified admin/tester
 *      sessions unless explicitly disabled above.
 *   5. Off-Vercel (`VERCEL_ENV` unset): allowed in `NODE_ENV === "development"` (`next dev`)
 *      or when `MM_UAT_ASSISTANT_ENABLED` is explicitly `"1"` / `"true"` (e.g. dedicated E2E
 *      verification against a production build). Unflagged off-Vercel production builds stay off.
 *   6. Any unrecognised `VERCEL_ENV` value fails closed.
 */

export type UatAvailabilityReason =
  | "vercel_production"
  | "production_supabase_target"
  | "explicit_opt_out"
  | "production_build_opt_in_missing"
  | "unknown_deployment_context"
  | "preview_enabled"
  | "local_development_enabled"
  | "explicit_opt_in";

export interface UatAvailability {
  readonly allowed: boolean;
  readonly reason: UatAvailabilityReason;
}

type EnvMap = Readonly<Record<string, string | undefined>>;

function trimmedLower(value: string | undefined): string | undefined {
  const next = value?.trim().toLowerCase();
  return next ? next : undefined;
}

function extractSupabaseProjectRef(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const hostname = new URL(rawUrl).hostname.toLowerCase();
    const match = /^([a-z0-9-]+)\.supabase\.(co|in|red)$/.exec(hostname);
    return match ? match[1]! : null;
  } catch {
    return null;
  }
}

export function uatAssistantAvailability(env: EnvMap = process.env): UatAvailability {
  const vercelEnv = trimmedLower(env.VERCEL_ENV);
  const vercelTargetEnv = trimmedLower(env.VERCEL_TARGET_ENV);

  // 1. Hard production refusal — cannot be overridden by any flag.
  if (vercelEnv === "production" || vercelTargetEnv === "production") {
    return { allowed: false, reason: "vercel_production" };
  }

  // 2. Never operate against a declared production Supabase project ref.
  const configuredRef = extractSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  const productionRef = trimmedLower(env.PRODUCTION_SUPABASE_PROJECT_REF);
  if (configuredRef && productionRef && configuredRef === productionRef) {
    return { allowed: false, reason: "production_supabase_target" };
  }

  // 3. Explicit kill-switch / feature flag off.
  const flag = trimmedLower(env.MM_UAT_ASSISTANT_ENABLED);
  if (flag === "0" || flag === "false" || flag === "off") {
    return { allowed: false, reason: "explicit_opt_out" };
  }

  // 4. Hosted Vercel Preview or Vercel Development.
  if (vercelEnv === "preview" || vercelEnv === "development") {
    return {
      allowed: true,
      reason: flag === "1" || flag === "true" ? "explicit_opt_in" : "preview_enabled",
    };
  }

  // 5. Off-Vercel (local dev / local start / CI E2E).
  if (vercelEnv === undefined) {
    if (flag === "1" || flag === "true") {
      return { allowed: true, reason: "explicit_opt_in" };
    }
    if (trimmedLower(env.NODE_ENV) === "development") {
      return { allowed: true, reason: "local_development_enabled" };
    }
    return { allowed: false, reason: "production_build_opt_in_missing" };
  }

  // 6. Any unknown deployment context fails closed.
  return { allowed: false, reason: "unknown_deployment_context" };
}

export function isUatAssistantEnvironmentAllowed(env: EnvMap = process.env): boolean {
  return uatAssistantAvailability(env).allowed;
}
