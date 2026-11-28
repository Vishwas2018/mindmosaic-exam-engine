const ISOLATED = new Set(["127.0.0.1", "localhost", "::1"]);

export type VihaanAvailabilityEnv = Readonly<Record<string, string | undefined>>;

export function vihaanScholarshipPrepAvailability(env: VihaanAvailabilityEnv = process.env) {
  const ve = env.VERCEL_ENV?.trim();
  const en = env.VISHAAN_SCHOLARSHIP_PREP_ENABLED?.trim();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const pr = env.PRODUCTION_SUPABASE_PROJECT_REF?.trim();
  const vr = env.VISHAAN_SCHOLARSHIP_PREP_SUPABASE_REF?.trim();
  if (ve === "production") return { allowed: false, reason: "vercel_production" as const };
  if (en === "0" || en === "false") return { allowed: false, reason: "explicit_opt_out" as const };
  let hn: string | null = null;
  if (url) {
    try {
      hn = new URL(url).hostname.toLowerCase();
    } catch {
      hn = null;
    }
  }
  if (!hn) return { allowed: false, reason: "supabase_target_unknown" as const };
  let rf: string | null = null;
  try {
    const m = /^([a-z0-9-]+)\.supabase\.(co|in|red)$/.exec(hn);
    rf = m ? m[1] : null;
  } catch {
    rf = null;
  }
  if (pr && rf === pr) return { allowed: false, reason: "production_supabase_target" as const };
  if (!ve) {
    return ISOLATED.has(hn)
      ? { allowed: true, reason: "local_isolated_backend" as const }
      : { allowed: false, reason: "local_backend_not_isolated" as const };
  }
  if (ve === "preview") {
    if (en !== "1" && en !== "true") {
      return { allowed: false, reason: "preview_opt_in_missing" as const };
    }
    if (!pr) return { allowed: false, reason: "preview_production_ref_undeclared" as const };
    if (!vr) return { allowed: false, reason: "preview_binding_missing" as const };
    if (rf !== vr) return { allowed: false, reason: "preview_binding_mismatch" as const };
    return { allowed: true, reason: "preview_opted_in_and_bound" as const };
  }
  return { allowed: false, reason: "unknown_deployment_context" as const };
}

export function isVihaanScholarshipPrepEnabled(env: VihaanAvailabilityEnv = process.env): boolean {
  return vihaanScholarshipPrepAvailability(env).allowed === true;
}

/**
 * Parses the comma-separated allowlist of auth user IDs permitted to access
 * Vihaan Scholarship Prep (`VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS` or
 * `VIHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS`).
 */
export function getVihaanAllowedUserIds(env: VihaanAvailabilityEnv = process.env): ReadonlySet<string> {
  const raw = env.VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS ?? env.VIHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS ?? "";
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Account-level gate for Vihaan Scholarship Prep.
 *
 * Fails closed whenever the deployment flag is off OR the account allowlist is
 * missing/empty OR the signed-in user ID is absent or not in the allowlist.
 */
export function isVihaanScholarshipPrepEnabledFor(
  userId: string | null | undefined,
  env: VihaanAvailabilityEnv = process.env,
): boolean {
  if (!isVihaanScholarshipPrepEnabled(env)) return false;
  const allowedIds = getVihaanAllowedUserIds(env);
  if (allowedIds.size === 0) return false;
  const normalizedUserId = userId?.trim().toLowerCase();
  if (!normalizedUserId) return false;
  return allowedIds.has(normalizedUserId);
}

/**
 * Resolves the allowlisted Vihaan student ID from a parent's `parent_children`
 * links, or returns null when the feature is unavailable, the allowlist is
 * missing, or none of the linked children are allowlisted.
 */
export function resolveAllowlistedVihaanChildId(
  linkedChildIds: readonly string[],
  env: VihaanAvailabilityEnv = process.env,
): string | null {
  if (!isVihaanScholarshipPrepEnabled(env)) return null;
  const allowedIds = getVihaanAllowedUserIds(env);
  if (allowedIds.size === 0) return null;
  for (const childId of linkedChildIds) {
    const trimmed = childId.trim();
    if (trimmed && allowedIds.has(trimmed.toLowerCase())) {
      return trimmed;
    }
  }
  return null;
}

/**
 * Parent-route gate for `/parent/vihaan`: requires the deployment flag to be
 * active, the allowlist to be configured, a signed-in parent ID, and either a
 * linked allowlisted Vihaan child OR the parent's own ID allowlisted alongside
 * at least one linked child.
 */
export function isVihaanParentAllowedFor(
  parentUserId: string | null | undefined,
  linkedChildIds: readonly string[],
  env: VihaanAvailabilityEnv = process.env,
): boolean {
  if (!isVihaanScholarshipPrepEnabled(env)) return false;
  const normalizedParentId = parentUserId?.trim().toLowerCase();
  if (!normalizedParentId) return false;
  const allowedIds = getVihaanAllowedUserIds(env);
  if (allowedIds.size === 0) return false;
  if (resolveAllowlistedVihaanChildId(linkedChildIds, env) !== null) return true;
  return linkedChildIds.length > 0 && allowedIds.has(normalizedParentId);
}
