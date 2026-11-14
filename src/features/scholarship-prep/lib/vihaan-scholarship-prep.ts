
const ISOLATED = new Set(["127.0.0.1","localhost","::1"]);

export function vihaanScholarshipPrepAvailability(env = process.env) {
  const ve = env.VERCEL_ENV?.trim();
  const en = env.VISHAAN_SCHOLARSHIP_PREP_ENABLED?.trim();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const pr = env.PRODUCTION_SUPABASE_PROJECT_REF?.trim();
  const vr = env.VISHAAN_SCHOLARSHIP_PREP_SUPABASE_REF?.trim();
  if (ve === "production") return { allowed: false, reason: "vercel_production" };
  if (en === "0" || en === "false") return { allowed: false, reason: "explicit_opt_out" };
  let hn = null; if (url) { try { hn = new URL(url).hostname.toLowerCase(); } catch {} }
  if (!hn) return { allowed: false, reason: "supabase_target_unknown" };
  let rf = null; try { const m = /^([a-z0-9-]+)\.supabase\.(co|in|red)$/.exec(hn); rf = m ? m[1] : null; } catch {}
  if (pr && rf === pr) return { allowed: false, reason: "production_supabase_target" };
  if (!ve) return ISOLATED.has(hn) ? { allowed: true, reason: "local_isolated_backend" } : { allowed: false, reason: "local_backend_not_isolated" };
  if (ve === "preview") {
    if (en !== "1" && en !== "true") return { allowed: false, reason: "preview_opt_in_missing" };
    if (!pr) return { allowed: false, reason: "preview_production_ref_undeclared" };
    if (!vr) return { allowed: false, reason: "preview_binding_missing" };
    if (rf !== vr) return { allowed: false, reason: "preview_binding_mismatch" };
    return { allowed: true, reason: "preview_opted_in_and_bound" };
  }
  return { allowed: false, reason: "unknown_deployment_context" };
}

export function isVihaanScholarshipPrepEnabled(env = process.env) { return vihaanScholarshipPrepAvailability(env).allowed === true; }
